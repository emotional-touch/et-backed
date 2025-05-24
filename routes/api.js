var express = require('express');
var router = express.Router();
var conn = require("../config/db");
const userController = require("../controller/UserController");
const homeController = require("../controller/HomeController");
const listnerController = require("../controller/ListnerController");
const commonController = require("../controller/CommonController");
const couponController = require("../controller/CouponController");
const rechargePlanController = require("../controller/RechargePlanController");
const contactSupportController = require("../controller/ContactSupportController");
const reviewController = require("../controller/ReviewController");
const chatController = require("../controller/ChatController");
var userModel = require("../models/User");
const { validate } = require('deep-email-validator');
const { check, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/APIAuthMiddleware');
const securityXXS = require('../middleware/XSSMiddleware');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Custom validator function for a pattern allowing +, - and numbers
const phoneAllowedPattern = (value, { req }) => {
    if (value === null) {
      return true; // Skip validation if the field is null
    }
  
    // Use a regular expression to check if the value matches the allowed pattern
    if (!/^[-+\d]+$/.test(value)) {
      throw new Error('Phone number is invalid');
    }
  
    return true;
};

async function validateEmailAddress(email) {
    try {
      const { valid, reason, validators: { mxRecords, domain } } = await validate(email);
      if (valid) {
        //console.log(`The email address ${email} is valid.`);
        return true;
      } else {
        //console.log(`The email address ${email} is invalid. Reason: ${reason}`);
        return false;
      }
    } catch (error) {
      console.error('Error validating email address:', error);
      return false;
    }
    return true;
}

// Custom validator function to check if either email or mobile is provided
const emailOrMobileRequired = (value, { req }) => {
    const email = req.body.email;
    const phone = req.body.phone_number;
    
    if (!email && !phone) {
        throw new Error('Either email or phone number is required');
    }

    return true;
};

// validate age range
const validateAgeRange = (value, { req }) => {
    const ageFrom = parseInt(req.query.age_from);
    const ageTo = parseInt(req.query.age_to);
    // Check if ageFrom is less than ageTo
    if (isNaN(ageFrom) || isNaN(ageTo)) {
        return true;
    }else{
        if (ageFrom < ageTo) {
            // If valid, continue to the next middleware or route handler
            return true;
        } else {
            // If not valid, send an error response
            throw new Error('Age range is not proper');
        }
    }
    
};

function appDeeplink(filePath, callback) {
    fs.access(filePath, fs.constants.F_OK, (err) => {
        callback(err === null);
    });
}


/****************************************     ************************************************/
                                    //Middleware 
/****************************************     ************************************************/


/****************************************     ************************************************/
                                    // Routes for Front Pages
/****************************************     ************************************************/
router.post("/listner-form-submit", securityXXS, [
    check('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Email format is wrong.').custom(value => {
        return userModel.findWebUserByEmail(conn, value, '').then(user => {
            if (user) { 
                return Promise.reject('Email already in use');
            }
        });
      }),
    check('FullName').notEmpty().withMessage('Full name is required.').isString().withMessage('The full name must contain only letters'),
    check('phoneNumber').notEmpty().withMessage('Phone number is required.').isLength({ min: 10, max: 10 })
    .withMessage('Phone number must be 10 digit long').custom(phoneAllowedPattern).custom(value => {
        return userModel.findWebUserByMobile(conn, '+91'+value, '').then(user => {
            if (user) { 
                return Promise.reject('Phone number already in use');
            }
        });
    }),
],homeController.listnerFormSubmit);

router.post("/contact-form-submit", securityXXS, [
    check('email_address').notEmpty().withMessage('Email is required').isEmail().withMessage('Email format is wrong.'),
    check('first_name').notEmpty().withMessage('First name is required.').isString().withMessage('The first name must contain only letters'),
    check('last_name').notEmpty().withMessage('Last name is required.').isString().withMessage('The last name must contain only letters'),
    check('contact_number').notEmpty().withMessage('Contact number is required.').isLength({ min: 10, max: 10 })
    .withMessage('Contact number must be 10 digit long.').custom(phoneAllowedPattern),
],homeController.contactFormSubmit);

router.get("/get-pages-data", securityXXS, [
    check('page_id').notEmpty().withMessage('Page id is required').isNumeric().withMessage('Page id must be number'),
], homeController.getPagesData);

router.get("/get-faqs-data", securityXXS, homeController.getFaqsData);

router.get("/get-user-data", securityXXS, [
    check('urlId').notEmpty().withMessage('urlId is required'),
], homeController.getUserData);

router.get("/get-front-listener-data", securityXXS,  homeController.getFrontListenerData);


/****************************************     ************************************************/
                                    // Routes for Deep Linking
/****************************************     ************************************************/
router.get('/share', (req, res) => {
    const userAgent = req.get('User-Agent');
    if (/mobile/i.test(userAgent)) {
        if (/iPad|iPhone|iPod/.test(userAgent)) {
            var filePath = path.join(__dirname, '..', '.well-known', 'apple-app-site-association');
        } else {
            var filePath = path.join(__dirname, '..', '.well-known', 'assetlinks.json');
        }
       
        appDeeplink(filePath, (err, exists) => {
            if (err || !exists) {
                res.redirect(301, process.env.WEB_FRONT_URL);
            } else {
                // Serve the JSON file
                res.sendFile(filePath);
                // Handle the deep link request here
                // return res.sendFile(deeplinks);
            }
        });
    } else {
        res.redirect(301, process.env.WEB_FRONT_URL);
    }
});

/****************************************     ************************************************/
                                    // Routes for daily log
/****************************************     ************************************************/
router.get("/daily-leave-settlement" ,commonController.leaveSettlement);
router.get("/deleted-user-settlement" ,commonController.deletedUserSettlement);
router.get("/monthly-leave-settlement" ,commonController.monthlyLeaveSettlement);
router.get("/monthly-missed-session-settlement" ,commonController.monthlyMissedSessionSettlement);
router.get("/monthly-payout-settlement" ,commonController.monthlyPayoutSettlement);
/****************************************     ************************************************/
                                // Routes for API
/****************************************     ************************************************/
/* Mobile Application Routes. */
router.post("/register", [
    check('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Email format is wrong.').custom(value => {
        return userModel.findUserByEmail(conn, value, '').then(user => {
            if (user) { 
                return Promise.reject('Email already in use');
            }
        });
      }),
    check('full_name').notEmpty().withMessage('Full name is required.').isString().withMessage('The full name must contain only letters'),
    check('phone_number').notEmpty().withMessage('Phone number is required.').isLength({ min: 8, max: 15 })
    .withMessage('Phone number must be at 8 to 15 digit long').custom(phoneAllowedPattern).custom(value => {
        return userModel.findUserByMobile(conn, value, '').then(user => {
            if (user) { 
                return Promise.reject('Phone number already in use');
            }
        });
    }),
],userController.register);

router.post("/resend-otp", [
    check('user_id').notEmpty().withMessage('User id is required').isNumeric().withMessage('User id must be number'),
],userController.resendOTP);

router.post("/otp-verification", [
    check('user_id').notEmpty().withMessage('User id is required').isNumeric().withMessage('User id must be number'),
    check('otp').notEmpty().withMessage('OTP is required.').isNumeric().withMessage('OTP must be number').isLength({ min: 4, max: 4 })
    .withMessage('OTP must be 4 digit long'),
],userController.otpVerification);

router.post("/login", [
    // check('email').optional().isEmail().withMessage('Email format is wrong.'),
    // check('phone_number').optional().isNumeric().withMessage('Please enter only number').isLength({ min: 8, max: 15 })
    // .withMessage('must be at 8 to 15 digit long'),
    check('email').custom(emailOrMobileRequired),
    check('email').optional({ nullable: true, checkFalsy: true }).isEmail().withMessage('Email format is wrong.'),
    // check('email').optional({ nullable: true, checkFalsy: true })
    // .custom(async (value, { req }) => {
    //     var emailDomainCheck = await validateEmailAddress(value);
    //     if (!emailDomainCheck) {
    //         throw new Error('Email id is not proper.');
    //     }
    //     return true;
    // }),
    check('phone_number').optional({ nullable: true, checkFalsy: true }).isLength({ min: 8, max: 15 })
    .withMessage('Phone number must be at 8 to 15 digit long').custom(phoneAllowedPattern),
],userController.login);

router.get("/get-user-details", authenticateToken, [
    check('user_id').notEmpty().withMessage('User id is required').isNumeric().withMessage('Please enter valid user id'),
],userController.getUserDetails);

router.get("/get-topic-list" ,commonController.getTopicList);
router.get('/get-version',commonController.getVersionData);

/****************************************     ************************************************/
                                // Auth Routes for API
/****************************************     ************************************************/
router.post("/listner-profile-step-1", authenticateToken, [
    check('profile_photo').custom((value, { req }) => {
        if (req.files) {
            if(req.files.profile_photo){
                const file = req.files.profile_photo;
                // Check file type
                const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    return Promise.reject('Only JPEG, PNG, and GIF images are allowed');
                }
            
                // Check file size (in bytes)
                const maxSize = 8 * 1024 * 1024; // 8 MB
                if (file.size > maxSize) {
                    return Promise.reject('Profile image size should not exceed 8 MB');
                }
            }
        }
        return true;
    }),
    check('is_anonymous').notEmpty().withMessage('Anonymous field is required').isIn([0, 1]).withMessage('Anonymous field has invalid value'),
    check('full_name').notEmpty().withMessage('Full name field is required.').isString().withMessage('The Full name must contain only letters').matches(/^[a-zA-Z\s]+$/).withMessage('Full name must contain only letters'),
    check('display_name').notEmpty().withMessage('Display name field is required.').isString().withMessage('The Display name must contain only letters').matches(/^[a-zA-Z\s]+$/).withMessage('Display name must contain only letters'),
    check('gender').notEmpty().withMessage('Gender field is required.').isIn(['male', 'female', 'other']).withMessage('Gender field has invalid value'),
    check('age').notEmpty().withMessage('Age field is required').isInt().withMessage('Age must be a number').isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
    check('topic_id').notEmpty().withMessage('Topic field is required'),
    check('service').notEmpty().withMessage('Service field is required'),
    check('availability').notEmpty().withMessage('Availability field is required.'),
    check('about').notEmpty().withMessage('About field is required.'),
],listnerController.profileStepOne);

router.post("/listner-profile-step-2", authenticateToken, [
    check('selfie_photo').custom((value, { req }) => {
        if (!req.files) {
            throw new Error('Selfie photo is required');
        }else if (req.files || req.files.selfie_photo) {
            const file = req.files.selfie_photo;
            // Check file type
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return Promise.reject('Only JPEG, PNG, and GIF images are allowed');
            }
        
            // Check file size (in bytes)
            const maxSize = 8 * 1024 * 1024; // 8 MB
            if (file.size > maxSize) {
                return Promise.reject('Selfie image size should not exceed 8 MB');
            }
        }
        return true;
    }),
],listnerController.profileStepTwo);

router.post("/listner-profile-step-3", authenticateToken, [
    check('id_proof_name').notEmpty().withMessage('Id proof name field is required.'),
    check('id_proof').custom((value, { req }) => {
        if (!req.files) {
            throw new Error('Id proof is required');
        }else if (req.files || req.files.id_proof) {
            const file = req.files.id_proof;
            // Check file type
            const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
            if (!allowedMimeTypes.includes(file.mimetype)) {
                return Promise.reject('Only JPEG, PNG, and GIF images are allowed');
            }
        
            // Check file size (in bytes)
            const maxSize = 8 * 1024 * 1024; // 8 MB
            if (file.size > maxSize) {
                return Promise.reject('Id proof image size should not exceed 8 MB');
            }
        }
        return true;
    }),
],listnerController.profileStepThree);

router.post("/edit-listner-profile", authenticateToken, [
    check('profile_photo').custom((value, { req }) => {
        if (req.files) {
            if(req.files.profile_photo){
                const file = req.files.profile_photo;
                // Check file type
                const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedMimeTypes.includes(file.mimetype)) {
                    return Promise.reject('Only JPEG, PNG, and GIF images are allowed');
                }
            
                // Check file size (in bytes)
                const maxSize = 8 * 1024 * 1024; // 8 MB
                if (file.size > maxSize) {
                    return Promise.reject('Profile image size should not exceed 8 MB');
                }
            }
        }
        return true;
    }), 
    check('full_name').notEmpty().withMessage('Full name field is required.').isString().withMessage('The Full name must contain only letters'),
    check('display_name').notEmpty().withMessage('Display name field is required.').isString().withMessage('The Display name must contain only letters'),
    check('gender').notEmpty().withMessage('Gender field is required.').isIn(['male', 'female', 'other']).withMessage('Gender field has invalid value'),
    check('age').notEmpty().withMessage('Age field is required').isInt().withMessage('Age must be a number').isInt({ min: 18, max: 100 }).withMessage('Age must be between 18 and 100'),
    check('service').notEmpty().withMessage('Service field is required'),
    check('about').notEmpty().withMessage('about field is required.'),
],listnerController.profileEdit);

router.post("/logout", authenticateToken, listnerController.logout);

router.post("/delete-user-account", authenticateToken, listnerController.deleteUserAccount);

router.get("/get-all-listener", authenticateToken, [
    check('gender').optional().isIn(['male', 'female', 'other']).withMessage('Gender field has invalid value'),
    check('category').optional(),
    check('age_from').optional().isNumeric().withMessage('Please enter valid age').custom(validateAgeRange),
    check('age_to').optional().isNumeric().withMessage('Please enter valid age').custom(validateAgeRange),
], listnerController.getAllListener);

router.get("/listener-details", authenticateToken, [
    check('user_id').notEmpty().withMessage('User id is required').isNumeric().withMessage('Please enter valid user id'),
], listnerController.listenerDetails);

router.get("/report-and-block", authenticateToken, [
    check('user_id').notEmpty().withMessage('User id is required').isNumeric().withMessage('Please enter valid user id'),
], listnerController.reportAndBlock);

router.post("/store-device-token", authenticateToken, [
    check('device_token').notEmpty().withMessage('Device token is required'),
], commonController.storeDeviceToken);

router.get("/unblock", authenticateToken, [
    check('user_id').notEmpty().withMessage('User id is required').isNumeric().withMessage('Please enter valid user id'),
], listnerController.unblock);

router.get("/get-support-category", authenticateToken, contactSupportController.getSupportCategory);

router.get("/get-category-question", authenticateToken, [
    check('category_id').notEmpty().withMessage('Category id is required'),
], contactSupportController.getCategoryQuestion);

router.get("/blocked-user-list", authenticateToken, listnerController.blockedUserList);

router.get("/get-offers", authenticateToken, couponController.getOffers);

router.get("/get-recharge-plan", authenticateToken, rechargePlanController.getRechargePlan);

router.get("/get-dashboard-data", authenticateToken, listnerController.getDashboardData);

router.get("/sent-google-docs", authenticateToken, commonController.sentGoogleDocs);

router.get("/service-payment-info", authenticateToken, commonController.servicePaymentInfo);

router.get("/listener-interest-notify", authenticateToken, listnerController.listenerInterestNotify);

router.get("/drag-other-to-inbox", authenticateToken, [
    check('inbox_user_id').notEmpty().withMessage('Inbox user id is required').isNumeric().withMessage('Please enter valid inbox user id'),
], chatController.dragOtherToInbox);

router.get("/add-nickname", authenticateToken, [
    check('user_id').notEmpty().withMessage('User id is required').isNumeric().withMessage('Please enter valid user id'),
    check('nick_name').notEmpty().withMessage('Nick name is required'),
], chatController.addNickname);

router.get("/chat-common-info", authenticateToken, [
    check('chat_user_id').notEmpty().withMessage('User id is required').isNumeric().withMessage('Please enter valid user id'),
], commonController.chatCommonInfo);

router.get("/get-transaction-history", authenticateToken, rechargePlanController.getTransactionHistory);

router.post("/write-review", authenticateToken, [
    check('listener_id').notEmpty().withMessage('Listener id is required').isNumeric().withMessage('Please enter valid listener id'),
    check('rating').notEmpty().withMessage('Rating is required').isNumeric().withMessage('Please enter valid rating').isIn([1, 2, 3, 4, 5]).withMessage('Please enter rating between 1 to 5'),
], reviewController.writeReview);
router.get("/get-received-review", authenticateToken, reviewController.getReceivedReview);
router.post("/delete-review", authenticateToken, [
    check('review_id').notEmpty().withMessage('Review id is required').isNumeric().withMessage('Please enter valid review id'),
], reviewController.deleteReview);



router.post("/gift-to-listener", authenticateToken, [
    check('payment_id').notEmpty().withMessage('Payment id is required'),
    check('listener_id').notEmpty().withMessage('Listener id is required').isNumeric().withMessage('Please enter valid listener id'),
    check('gift_amount').notEmpty().withMessage('Gift amount is required').isNumeric().withMessage('Please enter valid gift amount'),
    check('payment_status').notEmpty().withMessage('Payment status is required').isIn(['pending', 'success', 'failed']).withMessage('Payment status has invalid value'),
], commonController.giftToListener);

router.post("/gift-to-listener-webhook", commonController.giftToListenerWebhook);

router.get("/get-gift-amount", authenticateToken, commonController.getGiftAmount);

router.post("/recharge-payment-api", authenticateToken, [
    check('payment_id').notEmpty().withMessage('Payment id is required'),
    check('recharge_amount').notEmpty().withMessage('Recharge amount is required').isNumeric().withMessage('Please enter valid recharge amount'),
    check('payment_status').notEmpty().withMessage('Payment status is required').isIn(['pending', 'success', 'failed']).withMessage('Payment status has invalid value'),
], commonController.rechargePayment);

router.post("/recharge-payment-webhook", commonController.rechargePaymentWebhook);

router.get("/contact-boat-question", authenticateToken, commonController.contactBoatQuestion);

router.post("/query-submit", authenticateToken, [
    check('query').notEmpty().withMessage('Query is required'),
], commonController.querySubmit);

router.get("/get-notifications", authenticateToken, commonController.getNotifications);

router.get("/get-notification-count", authenticateToken, commonController.getNotificationCount);

router.post("/read-notification", authenticateToken, [
    check('notification_id').notEmpty().withMessage('Notification id is required').isNumeric().withMessage('Please enter valid notification id'),
], commonController.readNotification);

router.post("/store-upi", authenticateToken, [
    check('upi_id').notEmpty().withMessage('UPI id is required'),
], commonController.storeUpi);

router.get("/get-upi-details", authenticateToken, commonController.getUPIDetails);

module.exports = router;
