const express = require('express');
const router = express.Router();
import userRolesController from "../../../controllers/userRoles";


router.get('/',userRolesController.user_roles); 

module.exports = router