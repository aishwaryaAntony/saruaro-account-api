const express = require('express');
const router = express.Router();
import applePassController from "../../../controllers/applePass";

router.post('/',applePassController.apple_pass); 

module.exports = router;