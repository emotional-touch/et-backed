var express = require('express');
var router = express.Router();
var conn = require("../config/db");
const authController = require("../controller/AdminController/AuthController");
const dashboardController = require("../controller/AdminController/DashboardController");
const listnerController = require("../controller/AdminController/ListnerController");
const userController = require("../controller/AdminController/UserController");
const contactController = require("../controller/AdminController/ContactController");
const profileController = require("../controller/AdminController/ProfileController");
const faqCategoryController = require("../controller/AdminController/FaqCategoryController");
const faqController = require("../controller/AdminController/FaqController");
const pageController = require("../controller/AdminController/PageController");
const emailController = require("../controller/AdminController/EmailController");
const settingController = require("../controller/AdminController/SettingController");
const topicController = require("../controller/AdminController/TopicController");
const chargeController = require("../controller/AdminController/ChargeController");
const messageController = require("../controller/AdminController/MessageController");
const penaltyController = require("../controller/AdminController/PenaltyController");
const couponController = require("../controller/AdminController/CouponController");
const reportController = require("../controller/AdminController/ReportController");
const rechargeController = require("../controller/AdminController/RechargeController");
const analysisController = require("../controller/AdminController/AnalysisController");
const queryController = require("../controller/AdminController/QueryController");
const reviewController = require("../controller/AdminController/ReviewController");
const roleController = require("../controller/AdminController/RoleController");
const subadminController = require("../controller/AdminController/SubadminController");
const referEarnController = require("../controller/AdminController/ReferEarnController");
const paymentController = require("../controller/AdminController/PaymentController");
const payoutController = require("../controller/AdminController/PayoutController");
const giftController = require("../controller/AdminController/GiftController");
var adminModel = require("../models/Admin");
const { check, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/AdminAuthMiddleware');
const path = require('path');
const AdminCommissionController = require('../controller/AdminController/AdminCommissionController');


/****************************************     ************************************************/
                                    // Routes for Admin Pages
/****************************************     ************************************************/

// Auth Page Routes

router.get("/admin/login", authMiddleware.alreadyLogin, authController.login);
router.post("/admin/login-post", [
    check('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Email format is wrong.'),
    check('password').notEmpty().withMessage('Password is required.'),
],authController.loginPost);
router.get("/admin/forgot-password", authMiddleware.alreadyLogin, authController.forgotPassword);
router.post("/admin/forgot-password-post", authMiddleware.alreadyLogin, authController.forgotPasswordPost);
router.get("/admin/reset-password/:token", authMiddleware.alreadyLogin, authController.resetPassword);
router.post("/admin/reset-password-post", authMiddleware.alreadyLogin, authController.resetPasswordPost);

// Google form routes
router.get("/admin/googleFormData", listnerController.googleFormData);
router.post("/google-docs-webhook", listnerController.googleDocsWebhook);

//APK Download Route
router.get('/download-apk/', (req, res) => {
  const filePath = path.join(__dirname, '..', 'public', 'apk', 'app-release.apk');

  res.download(filePath, (err) => {
    if (err) {
      res.status(404).send('File not found');
    }
  });
});

// Admin Panel Routes

// Dashboard Route
router.get("/admin/dashboard", authMiddleware.requireLogin(null), dashboardController.dashboard);

// Revenue Route
router.get("/admin/revenue-info/:timeperiod", authMiddleware.requireLogin(19), dashboardController.revenueInfo);
router.get("/admin/revenue-info", authMiddleware.requireLogin(19), dashboardController.revenueInfoDate);

//Push Notification
router.get("/admin/push-notification/sent", authMiddleware.requireLogin(0), dashboardController.pushNotificationSent);
router.post("/admin/push-notification/sent-notification", authMiddleware.requireLogin(0), dashboardController.sentPushNotification);

// User Management Routes
router.get("/admin/users-management/list", authMiddleware.requireLogin(0), userController.list);
router.get("/admin/users-management/list123", userController.getUserList);
router.get("/admin/users-management/user-details/:id", authMiddleware.requireLogin(0), userController.userDetails);
router.get("/admin/google-docs-sent/:id", authMiddleware.requireLogin(0), userController.googleDocsSent);
router.post("/admin/users-management/user-status-action", authMiddleware.requireLogin(0), userController.userStatusAction);
router.get("/admin/users-management/delete-user/:id", authMiddleware.requireLogin(0), userController.deleteUser);
router.get("/admin/users-management/soft-delete-user/:id", authMiddleware.requireLogin(0), userController.softDeleteUser);

router.get("/admin/users-management/add", authMiddleware.requireLogin(0), userController.add);
router.post("/admin/users-management/save-user", authMiddleware.requireLogin(0), userController.userSave);
router.get("/admin/users-management/edit/:id", authMiddleware.requireLogin(0), userController.edit);
router.get("/admin/users-management/edit-listener/:id", authMiddleware.requireLogin(0), userController.editListener);
router.post("/admin/users-management/save-listener", authMiddleware.requireLogin(0), userController.saveListener);
router.post("/admin/users-management/user-acc-freeze-action", authMiddleware.requireLogin(0), userController.userAccFreezeAction);
router.post("/admin/users-management/user-wallet-freeze-action", authMiddleware.requireLogin(0), userController.userWalletFreezeAction);
router.get("/admin/users-management/deleted-user-recover/:id", authMiddleware.requireLogin(0), userController.deletedUserRecover);

router.get("/admin/users-management/refund-money/:id", authMiddleware.requireLogin(0), userController.refundMoney);
router.post("/admin/users-management/post-refund-money", authMiddleware.requireLogin(0), userController.postRefundMoney);

router.get("/admin/users-management/get-user-list", authMiddleware.requireLogin(0), userController.getUserList);
router.get("/admin/users-management/get-recharge-transaction", authMiddleware.requireLogin(0), userController.getRechargeTransaction);
router.get("/admin/users-management/get-gift-transaction", authMiddleware.requireLogin(0), userController.getGiftTransaction);
router.get("/admin/users-management/get-service-transaction", authMiddleware.requireLogin(0), userController.getServiceTransaction);
router.get("/admin/users-management/get-refund-transaction", authMiddleware.requireLogin(0), userController.getRefundTransaction);
router.get("/admin/users-management/get-payout-record-transaction", authMiddleware.requireLogin(0), userController.getPayoutRecordTransaction);
router.get("/admin/users-management/get-leave-penalty-record", authMiddleware.requireLogin(0), userController.getLeavePenaltyRecord);
router.get("/admin/users-management/get-missed-penalty-record", authMiddleware.requireLogin(0), userController.getMissedPenaltyRecord);

//Listener Management Routes
router.get("/admin/listener-management/list", authMiddleware.requireLogin(0), listnerController.list);

// Listener Account Request Routes
router.get("/admin/listener-account-request/list", authMiddleware.requireLogin(1), listnerController.listnerAccountRequestList);
router.get("/admin/accept-account-request/:id", authMiddleware.requireLogin(1), listnerController.acceptAccountRequest);
router.get("/admin/reject-account-request/:id", authMiddleware.requireLogin(1), listnerController.rejectAccountRequest);
router.get("/admin/view-docs-details/:id", authMiddleware.requireLogin(1), listnerController.viewDocsDetails);

// Listner Profile Request Routes
router.get("/admin/profile-approval-request/list", authMiddleware.requireLogin(2), listnerController.profileApprovalRequestList);
router.get("/admin/approve-profile-request/:id", authMiddleware.requireLogin(2), listnerController.approveProfileRequest);
router.get("/admin/reject-profile-request/:id", authMiddleware.requireLogin(2), listnerController.rejectProfileRequest);

// Contact List Routes
router.get("/admin/contact-request/list", authMiddleware.requireLogin(3), contactController.contactRequestList);
router.get("/admin/contact-request/delete/:id", authMiddleware.requireLogin(3), contactController.contactRequestDelete);

// Profile Setting Routes
router.get("/admin/change-password", authMiddleware.requireLogin(null), profileController.changePassword);
router.post("/admin/change-password-post", authMiddleware.requireLogin(null), profileController.changePasswordPost);

router.get('/admin/my-profile', authMiddleware.requireLogin(null), profileController.myProfile);
router.post('/admin/my-profile-post', authMiddleware.requireLogin(null), [
  check('name').notEmpty().withMessage('Name field is required.').isString().withMessage('Name must contain only letters').matches(/^[a-zA-Z\s]+$/).withMessage('Name must contain only letters'),
], profileController.myProfilePost);


// Faq Category Management Routes
router.get("/admin/faq-category-management/list", authMiddleware.requireLogin(13), faqCategoryController.list);
router.get("/admin/faq-category-management/delete/:id", authMiddleware.requireLogin(13), faqCategoryController.delete);
router.get("/admin/faq-category-management/add", authMiddleware.requireLogin(13), faqCategoryController.add);
router.post("/admin/faq-category-management/save", authMiddleware.requireLogin(13), faqCategoryController.save);
router.get("/admin/faq-category-management/edit/:id", authMiddleware.requireLogin(13), faqCategoryController.edit);

// Faqs Management Routes
router.get("/admin/faq-management/list", authMiddleware.requireLogin(14), faqController.list);
router.get("/admin/faq-management/delete/:id", authMiddleware.requireLogin(14), faqController.delete);
router.get("/admin/faq-management/add", authMiddleware.requireLogin(14), faqController.add);
router.post("/admin/faq-management/save", authMiddleware.requireLogin(14), faqController.save);
router.get("/admin/faq-management/edit/:id", authMiddleware.requireLogin(14), faqController.edit);
router.post("/admin/faq-management/faq-status-action", authMiddleware.requireLogin(14), faqController.faqStatusAction);
router.get("/admin/faq-management/details/:id", authMiddleware.requireLogin(14), faqController.details);

// Pages Management Routes
router.get("/admin/page-management/list", authMiddleware.requireLogin(4), pageController.list);
router.post("/admin/page-management/save", authMiddleware.requireLogin(4), pageController.save);
router.get("/admin/page-management/edit/:id", authMiddleware.requireLogin(4), pageController.edit);
router.post("/admin/page-management/page-status-action", authMiddleware.requireLogin(4), pageController.pageStatusAction);

// Email Management Routes
router.get("/admin/email-management/list", authMiddleware.requireLogin(5), emailController.list);
router.post("/admin/email-management/save", authMiddleware.requireLogin(5), emailController.save);
router.get("/admin/email-management/add", authMiddleware.requireLogin(5), emailController.add);
router.get("/admin/email-management/edit/:id", authMiddleware.requireLogin(5), emailController.edit);
router.post("/admin/email-management/email-status-action", authMiddleware.requireLogin(5), emailController.emailStatusAction);

// Setting Routes
router.get("/admin/setting/list", authMiddleware.requireLogin(23), settingController.list);
router.post("/admin/setting/save", authMiddleware.requireLogin(23), settingController.save);
router.get("/admin/setting/edit/:id", authMiddleware.requireLogin(23), settingController.edit);


//Topic Management Routes
router.get("/admin/topic-management/list", authMiddleware.requireLogin(6), topicController.list);
router.get("/admin/topic-management/delete/:id", authMiddleware.requireLogin(6), topicController.delete);
router.get("/admin/topic-management/add", authMiddleware.requireLogin(6), topicController.add);
router.post("/admin/topic-management/save", authMiddleware.requireLogin(6), topicController.save);
router.get("/admin/topic-management/edit/:id", authMiddleware.requireLogin(6), topicController.edit);
router.post("/admin/topic-management/topic-status-action", authMiddleware.requireLogin(6), topicController.topicStatusAction);

// Charge Management Routes
router.get("/admin/charge-management/list", authMiddleware.requireLogin(20), chargeController.list);
router.post("/admin/charge-management/save", authMiddleware.requireLogin(20), chargeController.save);
router.get("/admin/charge-management/edit/:id", authMiddleware.requireLogin(20), chargeController.edit);

router.get("/admin/charge-management/user/delete/:id", authMiddleware.requireLogin(20), chargeController.deleteUserCharge);
router.get("/admin/charge-management/user/add", authMiddleware.requireLogin(20), chargeController.addUserCharge);
router.post("/admin/charge-management/user/save", authMiddleware.requireLogin(20), chargeController.saveUserCharge);
router.get("/admin/charge-management/user/edit/:id", authMiddleware.requireLogin(20), chargeController.editUserCharge);

router.post("/admin/charge-management/gst/save", authMiddleware.requireLogin(20), chargeController.gstSave);
router.get("/admin/charge-management/gst/edit", authMiddleware.requireLogin(20), chargeController.gstEdit);

// Message Management
router.get("/admin/message-management/list", authMiddleware.requireLogin(9), messageController.list);
router.post("/admin/message-management/filter", authMiddleware.requireLogin(9), messageController.filter);
router.post("/admin/message-management/user-details", authMiddleware.requireLogin(9), messageController.userDetails);

// Penalty Management Routes
router.get("/admin/penalty-management/list", authMiddleware.requireLogin(21), penaltyController.list);
router.post("/admin/penalty-management/save", authMiddleware.requireLogin(21), penaltyController.save);

// Coupon Management Routes
router.get("/admin/coupon-management/list", authMiddleware.requireLogin(10), couponController.list);
router.get("/admin/coupon-management/delete/:id", authMiddleware.requireLogin(10), couponController.delete);
router.get("/admin/coupon-management/add", authMiddleware.requireLogin(10), couponController.add);
router.post("/admin/coupon-management/save", authMiddleware.requireLogin(10), couponController.save);
router.get("/admin/coupon-management/edit/:id", authMiddleware.requireLogin(10), couponController.edit);
router.get("/admin/coupon-management/details/:id", authMiddleware.requireLogin(10), couponController.details);

// Report Management Routes
router.get("/admin/report-management/list", authMiddleware.requireLogin(15), reportController.list);
router.post("/admin/report-management/report-status-action", authMiddleware.requireLogin(15), reportController.reportStatusAction);

// Recharge Management Routes
router.get("/admin/recharge-management/list", authMiddleware.requireLogin(16), rechargeController.list);
router.get("/admin/recharge-management/delete/:id", authMiddleware.requireLogin(16), rechargeController.delete);
router.get("/admin/recharge-management/add", authMiddleware.requireLogin(16), rechargeController.add);
router.post("/admin/recharge-management/save", authMiddleware.requireLogin(16), rechargeController.save);
router.get("/admin/recharge-management/edit/:id", authMiddleware.requireLogin(16), rechargeController.edit);
router.get("/admin/recharge-management/edit-service-fees", authMiddleware.requireLogin(16), rechargeController.editServiceFees);
router.post("/admin/recharge-management/update-service-fees", authMiddleware.requireLogin(16), rechargeController.updateServiceFees);
router.get("/admin/recharge-management/edit-gst", authMiddleware.requireLogin(16), rechargeController.editGST);
router.post("/admin/recharge-management/update-gst", authMiddleware.requireLogin(16), rechargeController.updateGst);
router.post("/admin/recharge-management/highlight-action", authMiddleware.requireLogin(0), rechargeController.highlightAction);

// Report Analysis Routes
router.get("/admin/report-analysis/list", authMiddleware.requireLogin(22), analysisController.list);
router.get("/admin/report-analysis/export/:type", authMiddleware.requireLogin(22), analysisController.export);

// Query Management Routes
router.get("/admin/query-management/list", authMiddleware.requireLogin(18), queryController.list);
router.post("/admin/query-management/save", authMiddleware.requireLogin(18), queryController.save);
router.get("/admin/query-management/reply/:id", authMiddleware.requireLogin(18), queryController.edit);
router.get("/admin/query-management/details/:id", authMiddleware.requireLogin(18), queryController.details);

// Review Management Routes
router.get("/admin/review-management/list", authMiddleware.requireLogin(12), reviewController.list);
router.post("/admin/review-management/review-status-action", authMiddleware.requireLogin(12), reviewController.reviewStatusAction);
router.get("/admin/review-management/details/:id", authMiddleware.requireLogin(12), reviewController.details);
router.get("/admin/review-management/delete-review/:id", authMiddleware.requireLogin(0), reviewController.deleteReview);

// Admin Role Management Routes
router.get("/admin/role-management/list", authMiddleware.requireLogin(8), roleController.list);
router.get("/admin/role-management/delete/:id", authMiddleware.requireLogin(8), roleController.delete);
router.get("/admin/role-management/add", authMiddleware.requireLogin(8), roleController.add);
router.post("/admin/role-management/save", authMiddleware.requireLogin(8), roleController.save);
router.get("/admin/role-management/edit/:id", authMiddleware.requireLogin(8), roleController.edit);

// Sub Admin Management Routes
router.get("/admin/subadmin-management/list", authMiddleware.requireLogin(7), subadminController.list);
router.get("/admin/subadmin-management/delete/:id", authMiddleware.requireLogin(7), subadminController.delete);
router.get("/admin/subadmin-management/add", authMiddleware.requireLogin(7), subadminController.add);
router.post("/admin/subadmin-management/save", authMiddleware.requireLogin(7), subadminController.save);
router.get("/admin/subadmin-management/edit/:id", authMiddleware.requireLogin(7), subadminController.edit);

// Refer Earn Management Routes
router.get("/admin/refer-earn-management/list", authMiddleware.requireLogin(11), referEarnController.list);
router.post("/admin/refer-earn-management/save", authMiddleware.requireLogin(11), referEarnController.save);
router.get("/admin/refer-earn-management/set-referral-amount", authMiddleware.requireLogin(11), referEarnController.setReferralAmount);

// Payment Management Routes
router.get("/admin/payment-management/list", authMiddleware.requireLogin(19), paymentController.list);
router.post("/admin/payment-management/getdata", authMiddleware.requireLogin(19), paymentController.getData);
router.get("/admin/payment-management/details/:id", authMiddleware.requireLogin(19), paymentController.details);
router.get("/admin/payment-management/delete-transaction/:id", authMiddleware.requireLogin(19), paymentController.deleteTransaction);

//GST Management Routes
router.get("/admin/gst/list",authMiddleware.requireLogin(17),AdminCommissionController.gstList);

// Payout Management Routes
router.get("/admin/payout-management/list", authMiddleware.requireLogin(19), payoutController.list);
router.get("/admin/payout-management/get-payout-list", authMiddleware.requireLogin(19), payoutController.getPayoutList);
router.get("/admin/payout-management/payout/:id", authMiddleware.requireLogin(19), payoutController.payout);

// Gift Management Routes
router.get("/admin/gift-management/list", authMiddleware.requireLogin(17), giftController.list);
router.get("/admin/gift-management/delete/:id", authMiddleware.requireLogin(17), giftController.delete);
router.get("/admin/gift-management/add", authMiddleware.requireLogin(17), giftController.add);
router.post("/admin/gift-management/save", authMiddleware.requireLogin(17), giftController.save);
router.get("/admin/gift-management/edit/:id", authMiddleware.requireLogin(17), giftController.edit);

// Admin Commission Management
router.get("/admin/commission/list",authMiddleware.requireLogin(17),AdminCommissionController.list);
router.get("/admin/commission/get-commission-list",authMiddleware.requireLogin(17),AdminCommissionController.getCommissionList);

// Logout Route
router.get('/admin/logout', authMiddleware.requireLogin(null), (req, res) => {
    // Clear the user's session
    req.session.destroy(err => {
      if (err) {
        console.error('Error destroying session:', err);
      }
      res.redirect('/admin/login'); // Redirect to a login page or another route
    });
});


/****************************************     ************************************************/
                                    // Routes for Admin Pages HTML
/****************************************     ************************************************/

router.get('/admin/test', (req, res) => {
  //console.log(req.query.id);
  var fromId = req.query.id;
  res.render('test', {fromId}); 
});

router.get('/admin/test1', (req, res) => {
  //console.log(req.query.id);
  var fromId = req.query.id;
  res.render('test1', {fromId}); 
});

router.get('/admin/category-management-list', (req, res) => {
  res.render('admin/category-management/category-management-list'); 
});

router.get('/admin/category-management-add-new', (req, res) => {
    res.render('admin/category-management/category-management-add-new'); 
});


router.get('/admin/sub-admin-list', (req, res) => {
  res.render('admin/sub-admin-management/sub-admin-list'); 
});

router.get('/admin/new-admin', (req, res) => {
  res.render('admin/sub-admin-management/new-admin'); 
});

router.get('/admin/role-list', (req, res) => {
  res.render('admin/role-management/role-list'); 
});

router.get('/admin/new-role', (req, res) => {
  res.render('admin/role-management/new-role'); 
});

router.get('/admin/coupon-list', (req, res) => {
  res.render('admin/coupon-management/coupon-list'); 
});

router.get('/admin/create-coupon', (req, res) => {
  res.render('admin/coupon-management/create-coupon'); 
});

router.get('/admin/refer-earn-list', (req, res) => {
  res.render('admin/refer-earn-management/refer-earn-list'); 
});

router.get('/admin/set-referal-amout', (req, res) => {
  res.render('admin/refer-earn-management/set-referal-amout'); 
});

router.get('/admin/review-management-list', (req, res) => {
  res.render('admin/review-management/review-management-list'); 
});

router.get('/admin/view-review', (req, res) => {
  res.render('admin/review-management/view-review'); 
});

router.get('/admin/faqmanagement-list', (req, res) => {
  res.render('admin/faq-management/faqmanagement-list'); 
});

router.get('/admin/add-faq', (req, res) => {
  res.render('admin/faq-management/add-faq'); 
});

router.get('/admin/report-management-list', (req, res) => {
  res.render('admin/report-management/report-management-list'); 
});

router.get('/admin/query-management-list', (req, res) => {
  res.render('admin/query-management/query-management-list'); 
});

router.get('/admin/query-management-reply', (req, res) => {
  res.render('admin/query-management/query-management-reply'); 
});

router.get('/admin/payment-management-list', (req, res) => {
  res.render('admin/payment-management/payment-management-list'); 
});

router.get('/admin/manage-commission', (req, res) => {
  res.render('admin/payment-management/manage-commission'); 
});

router.get('/admin/charge-management-list', (req, res) => {
  res.render('admin/charge-management/charge-management-list'); 
});

router.get('/admin/edit-charge', (req, res) => {
  res.render('admin/charge-management/edit-charge'); 
});

router.get('/admin/add-gst-charge', (req, res) => {
  res.render('admin/charge-management/add-gst-charge'); 
});

router.get('/admin/penalty-edit', (req, res) => {
  res.render('admin/penalty-management/penalty-edit'); 
});



router.get('/admin/change-password', (req, res) => {
  res.render('admin/setting/change-password'); 
});


module.exports = router;