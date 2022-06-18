const express = require('express');
const router = express.Router();
import rolesController from "../../../controllers/roles";


router.get('/',rolesController.fetch_all_roles); 

module.exports = router