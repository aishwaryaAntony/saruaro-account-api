import db from '../models';
import cryptoJs from "../helpers/crypto";


exports.fetchUserAppointment = async (req, res, next) => {
	try {
		let { acuity_appointment_id } = req.params;

		if(acuity_appointment_id === undefined){
			return res.json({
				status: "failed",
				payload: null,
				message: "User Appointment doesn't exist",
			});
		}

		let findUserAppointment = await db.UserAppointment.findOne({
			where: {
				acuity_appointment_id: acuity_appointment_id
			}
		});

		if (findUserAppointment === null) {
			return res.json({
				status: "failed",
				payload: null,
				message: "User Appointment doesn't exist",
			});
		}

		findUserAppointment.phone_number = await cryptoJs.decrypt(findUserAppointment.phone_number)
		findUserAppointment.country_code = await cryptoJs.decrypt(findUserAppointment.country_code)
		findUserAppointment.email = await cryptoJs.decrypt(findUserAppointment.email)

		res.status(200).json({
			status: "success",
			payload: findUserAppointment,
			message: "User Appointment successfully fetched",
		});
	} catch (error) {
		console.log("Error while fetching user appointment ==> " + error);
		res.status(200).json({
			status: "failed",
			payload: {},
			message: "Error while fetching user appointment",
		});
	}
}

exports.createUserAppointment = async (req, res, next) => {
	try {
		let { first_name, last_name, phone_number, country_code, email, location_id, test_type_id,
			location_test_type_id, appointment_date, appointment_time, acuity_appointment_id } = req.body;

		let findUserAppointment = await db.UserAppointment.findOne({
			where: {
				acuity_appointment_id: acuity_appointment_id
			}
		});

		if (findUserAppointment !== null) {
			return res.json({
				status: "failed",
				payload: null,
				message: "User Appointment already exist",
			});
		}

		let encryptedEmail = await cryptoJs.encrypt(email);
		let encryptedCountryCode = await cryptoJs.encrypt(country_code);
		let encryptedPhoneNumber = await cryptoJs.encrypt(phone_number);

		let createUserAppointment = await db.UserAppointment.create({
			first_name,
			last_name,
			phone_number: encryptedPhoneNumber,
			country_code: encryptedCountryCode,
			email: encryptedEmail,
			location_id,
			test_type_id,
			location_test_type_id,
			appointment_date,
			appointment_time,
			acuity_appointment_id,
			status: "ACTIVE"
		});

		res.status(200).json({
			status: "success",
			payload: createUserAppointment,
			message: "User Appointment successfully created",
		});
	} catch (error) {
		console.log("Error while creating user appointment ==> " + error);
		res.status(200).json({
			status: "failed",
			payload: {},
			message: "Error while creating user appointment",
		});
	}
}


exports.deleteUserAppointment = async (req, res, next) => {
	try {
		let { acuity_appointment_id } = req.params;

		let findUserAppointment = await db.UserAppointment.findOne({
			where: {
				acuity_appointment_id: acuity_appointment_id
			}
		});

		if (findUserAppointment === null) {
			return res.json({
				status: "failed",
				payload: null,
				message: "User Appointment doesn't exist",
			});
		}

		await db.UserAppointment.destroy({
			where: {
				acuity_appointment_id: acuity_appointment_id
			}
		});

		res.status(200).json({
			status: "success",
			payload: null,
			message: "User Appointment successfully deleted",
		});
	} catch (error) {
		console.log("Error while deleting user appointment ==> " + error);
		res.status(200).json({
			status: "failed",
			payload: {},
			message: "Error while deleting user appointment",
		});
	}
}