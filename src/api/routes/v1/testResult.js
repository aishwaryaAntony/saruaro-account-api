const express = require('express');
const router = express.Router();
import testResultController from "../../../controllers/testResult";
import checkAuth from "../../../middleware/check-auth"

router.get('/', testResultController.fetchAllPaymentStatus);

router.get('/:id', testResultController.fetchPaymentById);

router.post('/re-submit/:id', testResultController.resubmitTestResult);

router.post('/', testResultController.createTestResult);

router.put('/:session_id', testResultController.updateTestResult);

router.get('/saved-form/:session_id', testResultController.fetchPaymentBySession);

module.exports = router