const express = require('express');
const app = express();

// authenticationMiddleware.js
function stripTagsMiddleware(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        for (const key in req.body) {
            if (typeof req.body[key] === 'string') {
            req.body[key] = req.body[key].replace(/<[^>]*>/g, ''); // replace HTML tags
            req.body[key] = req.body[key].replace(/<\?php.*\?>/g, ''); // replace PHP tags
            }
        }
    }
    next();
}

module.exports = stripTagsMiddleware;