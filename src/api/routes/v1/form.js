const express = require('express');
const router = express.Router();
import formController from "../../../controllers/form";
import { upload } from "../../../helpers/attachments";

router.post('/',upload.fields([{ name: 'id_image', maxCount: 1 }, { name: 'insurance_front_file', maxCount: 1 }, { name: 'insurance_back_file', maxCount: 1 }]), formController.test_form); 


module.exports = router