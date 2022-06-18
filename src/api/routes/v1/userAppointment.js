const express = require('express');
const router = express.Router();

import userAppointmentController from "../../../controllers/userAppointment";

router.get('/:acuity_appointment_id', userAppointmentController.fetchUserAppointment);

router.post('/', userAppointmentController.createUserAppointment);

router.delete('/:acuity_appointment_id', userAppointmentController.deleteUserAppointment);

module.exports = router;