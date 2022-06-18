const express = require('express');
const router = express.Router();
import acuityController from "../../../controllers/acuity";

router.get('/', acuityController.fetchAppointmentDates);

router.get('/appointment-times', acuityController.fetchAppointmentTimes);

router.get('/appointment-slots', acuityController.fetchAppointmentWithTimes);

router.post('/make-appointment', acuityController.makeUserAppointment);

router.delete('/cancel-appointment/:id', acuityController.cancelUserAppointment);

module.exports = router;