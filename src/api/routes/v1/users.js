const express = require('express');
const router = express.Router();
import usersController from "../../../controllers/users";
import checkAuth from "../../../middleware/check-auth"

router.post('/login', usersController.login);

router.post('/internal-user-login', usersController.internal_user_login);

router.post('/verify-authentication-code',usersController.verify_authentication_code); 

router.get('/authenticate', checkAuth, usersController.authenticate);

router.post('/validate-token', checkAuth, usersController.validate_token);

router.get('/find-user/:email', checkAuth, usersController.find_user_profile); 

router.post('/create-internal-user', checkAuth, usersController.create_internal_user);

router.delete('/:id', checkAuth, usersController.deleteUserProfile);

router.patch('/:id', checkAuth, usersController.reactivateUserProfile);

router.get('/qr-code/:qrCode', usersController.createQRCode);

router.post('/send-qr-code', usersController.sendQRCode);

router.post('/reset-password', usersController.resetPassword);

router.post('/forgot-password', usersController.forgotPassword);

router.post('/create-payment-session', usersController.createPaymentSession);

router.get('/contacts', checkAuth, usersController.fetchUserContacts);

router.post('/resend-verification-code', usersController.resend_verification_code);

module.exports = router