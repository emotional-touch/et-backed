var conn = require("../config/db");
var userModel = require("../models/User");

async function authenticateToken(req, res, next) {
  var token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }
  token = token.replace('Bearer ', '');
  let user = await userModel.apiTokenAuth(conn, token);
  if (user == '') {
    return res.status(403).json({ message: 'Access denied. Invalid token.' });
  }

  if(user[0].is_active == 0){
    return res.status(201).json({
      "status": "error",   
      "message": 'Your account is deactivated.',
    });
  }

  if(user[0].block_status == 1){
    return res.status(201).json({
        "status": "error",   
        "message": 'Your account blocked.',
    });
  }

  if(user[0].account_freeze_status == 1){
    return res.status(201).json({
      "status": "error",   
      "message": 'Your account is freeze.',
    });
  }

  req.authuser = user[0]; // Store the user information in the request object
  next();
}

module.exports = authenticateToken;