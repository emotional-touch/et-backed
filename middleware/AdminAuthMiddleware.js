const express = require('express');
const app = express();

// authenticationMiddleware.js
function requireLogin(permissionId) {
  return function(req, res, next) {

    if (req.session && req.session.admin) {

      if(req.session.admin.role_id != 0 && permissionId != null){
        var permissions = req.session.admin.permission;
        var permissionKeys = permissions.split(',').map(function (item) {
          return item.trim();
        });
        
        if (permissionKeys.includes(permissionId)) {
          //console.log('next');
          return next(); // User is authenticated, proceed to the next middleware
        } else {
          //console.log('no permission');
          return res.redirect('/admin/dashboard');
        }
      }else{
        return next(); // User is authenticated, proceed to the next middleware
      }
      
    } else {
      return res.redirect('/admin/login'); // Redirect to the login page if not authenticated
    }
  };
}

  
function alreadyLogin(req, res, next) {
  if (req.session && req.session.admin) {
    return res.redirect('/admin/dashboard');
  } else {
    return next(); // Redirect to the login page if not authenticated
  }
}

module.exports = {
  requireLogin,
  alreadyLogin
};