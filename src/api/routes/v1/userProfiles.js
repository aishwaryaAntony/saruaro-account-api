const express = require('express');
const router = express.Router();
import checkAuth from "../../../middleware/check-auth"
import userProfilesController from "../../../controllers/userProfiles";


router.get('/', checkAuth, userProfilesController.fetch_all_profile); 

router.get('/qr/:qr_code', checkAuth, userProfilesController.fetch_profile_by_qr); 

router.put('/qr/:qr_code', checkAuth, userProfilesController.update_qr_code); 

router.get('/internal-users', checkAuth, userProfilesController.fetch_all_internal_profile); 

module.exports = router