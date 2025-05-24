var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var apiRouter = require('./routes/api');
var adminRouter = require('./routes/admin');
const multer = require('multer');
const cors = require('cors');
const exphbs = require('express-handlebars');
const handlebars = require('handlebars');
const session = require('express-session');
const flash = require('express-flash');
var conn = require("./config/db");
const upload = multer();
var app = express();
var topicModel = require("./models/Topic");
var faqCategoryModel = require("./models/FaqCategory");
var roleModel = require("./models/AdminRole");
const homeController = require("./controller/HomeController");
const moment = require('moment');
require('dotenv').config();

app.use(session({
  secret: '1122334455', // Change this to a strong, random key
  resave: true,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 }, 
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

app.use(flash());

const fileUpload = require("express-fileupload");
app.use(fileUpload());

//app.use(upload.none());
//public folder image display code
app.use(express.static(path.resolve('./public')));
app.use('/public', express.static(path.resolve('./public')));

// Register a custom helper
handlebars.registerHelper('ifCondition', function (v1, operator, v2, options) {
  switch (operator) {
      case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      case '&&':
          return (v1 && v2) ? options.fn(this) : options.inverse(this);
      case '||':
          return (v1 || v2) ? options.fn(this) : options.inverse(this);
      default:
          return options.inverse(this);
  }
});

// handlebars.registerHelper('isEqual', function(arg1, arg2, options) {
//   return arg1 === arg2 ? options.fn(this) : options.inverse(this);
// });

handlebars.registerHelper('formatTime', function (date, format) {
  var mmnt = moment(date);
  return mmnt.format(format);
});

// view engine setup
app.engine('hbs', exphbs.engine({
  extname: '.hbs',
  defaultLayout: 'main',
  layoutsDir: path.join(__dirname, 'views/admin/layouts'),
  partialsDir: path.join(__dirname, 'views/admin/partials'),
  helpers: {
    // Define a block helper
    block: function (name) {
      const blocks = this._blocks;
      const content = blocks && blocks[name];
      return content ? content.join('\n') : null;
    },
    fixImageUrl: function(url) {
      // Modify the URL: replace single slash with double slash after http:
      return url.replace(/https:\//, 'https://');
    },
    and: function (condition1, condition2, options) {
      if (condition1 && condition2) {
        return options.fn(this);
      }
      return options.inverse(this);
    },
    addOne: function(value) {
      return value + 1;
    },
    commaSeprateArray: function(string) {
      return string.split(',');
    },
    truncateText: function (text, length) {
      if (text.length > length) {
        return new handlebars.SafeString(text.substring(0, length) + '... <span class="read-more-text">Read More</span>');
      } else {
        return text;
      }
    },
    faqCategoryById: async function (id) {
      if (id) {
        try {
          const catDetails = await faqCategoryModel.details(conn, id);
          if (catDetails.length > 0) {
            var catInfo = catDetails[0];
            //console.log(catInfo.name);
            return catInfo.name;
          }
        } catch (error) {
          console.error(error);
        }
      }
    },
    isEquals: function (a, b, options) {
      return a === b ? (options.fn ? options.fn(this) : true) : (options.inverse ? options.inverse(this) : false);
    },
    isEqual: function (arg1, arg2) {
      if (arg1 == arg2) {
        return 'selected';
      }
    },
    or: function() {
      // Convert arguments to an array
      const args = Array.from(arguments);
      // Check if any argument is truthy
      return args.some(arg => !!arg);
    },
    permissionList: function( ) {
      const permissionArray = ['User Management', 'Listener Account Request', 'Listener Profile Approval Request', 'Contact Management', 'Page Management', 'Email Management', 'Topic Management', 'Sub Admin Management', 'Role Management', 'Messages, Audio, Video', 'Coupon Management', 'Refer and Earn Management', 'Review Management', 'FAQ Category', 'FAQ Management', 'Report Management', 'Recharge Plan Management', 'Gift Amount Management', 'Queries Management', 'Payment Management', 'Charge Management', 'Penalty Management', 'Reports and Analysis', 'Settings'];
      return permissionArray;
    },
    contains: function (permissions, key, options) {
      //console.log('Permission Keys:', permissions);
      //console.log('Current Key:', key.toString());

      if(permissions != undefined){
        var permissionKeys = permissions.split(',').map(function (item) {
          return item.trim();
        });

        if (permissionKeys.includes(key.toString())) {
          return 'checked';
        }
      }
    },
    adminRoleAccess: function (permissions, permissionId) {
     
      if (permissions && permissions != '') {
        
        // Assuming you have a model named AdminRole with a method to fetch role permissions
        

          var permissionKeys = permissions.split(',').map(function (item) {
            return item.trim();
          });
          //console.log(permissionKeys.includes(permissionId));
          if (permissionKeys.includes(permissionId)) {
            //console.log('true');
            return true;
          } else {
            //console.log('falseeeeeeee');
            return false; 
          }
        
      } else {
        //console.log('last true');
        return true;
      }
    },
    loop: function (from, to, block) {
      var accum = '';
      for (var i = from; i <= to; i++) {
        accum += block.fn(i);
      }
      return accum;
    },
    commaPresent: function (csvString, targetValue){ 
      // Split the CSV string into an array
      const valuesArray = csvString.split(',');
       
      // If there's only one element in the array, compare directly
      if (valuesArray.length === 1) {
          valuesArray[0] === targetValue;
      }

      // Check if the target value is present in the array
      return valuesArray.includes(targetValue);
    },
    commaPresentWithNum: function (csvString, targetValue){ 
      // Split the CSV string into an array
      const valuesArray = csvString.split(',');
       //console.log(valuesArray.length);
      // If there's only one element in the array, compare directly
      if (valuesArray.length === 1) {
         valuesArray[0] === targetValue;
      }
      //console.log(valuesArray);
      // Check if the target value is present in the array
      return  valuesArray.map(Number).includes(targetValue)
    },
    topicFromId: async function (id) {
      if (id) {
        try {
          const topicDetails = await topicModel.find(conn, id);
          if(topicDetails != ''){
            var topicInfo = topicDetails[0];
            //console.log(topicInfo.name);
            return topicInfo.name;
          }else{
            return '';
          }
        } catch (error) {
          return '';
        }
      }
    },
    formatDateTime: function (date) {
      return moment(date).format('DD MMMM, YYYY | hh:mm A');
    },
  }
}));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

app.use(cors()); // Enable CORS for all routes
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', apiRouter);
app.use('/', adminRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
