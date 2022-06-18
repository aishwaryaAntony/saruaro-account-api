import { fetchAcuityAvailableDate, fetchAvailableTimeByDate, fetchAvailableDateWithTime, checkIfSlotAvailable, makeAppointment, deleteUserAppointment } from "../helpers/acuity";
import cryptoJs from "../helpers/crypto";
import db from '../models';
const moment = require("moment");

exports.fetchAppointmentDates = async (req, res, next) => {
    try {
        let { calendarId = 6306720, appointmentTypeID = 28950776 } = req.query;
        let monthArray = [ moment().format('YYYY-MM'), moment().add(1, 'months').format('YYYY-MM'), moment().add(2, 'months').format('YYYY-MM') ];
        // let appointmentTypeID = 28950776;
        // let calendarId = 6306720;
        let appointmentAray = [];
        // let url = `availability/dates?appointmentTypeID=28950776&month=2021-12&calendarID=6306720&timezone=America/New_York`;
        for(let month of monthArray){
            let appointment = await fetchAcuityAvailableDate(appointmentTypeID, calendarId, month);
            appointmentAray.push(...appointment);
        }

        res.status(200).json({
            status: 'success',
            payload: appointmentAray
        });  
    } catch (error) {
        res.status(200).json({
            status: 'failed',
            payload: error
        });
    }
}


exports.fetchAppointmentTimes = async (req, res, next) => {
    try {
        let { date, appointmentTypeID = 28950776, calendarId = 6306720 } = req.query;
        // let appointmentTypeID = 28950776;
        // let calendarId = 6306720;
        // let url = `availability/times?appointmentTypeID=123&calendarID=123&date=2016-02-04`;
        let appointments = await fetchAvailableTimeByDate(appointmentTypeID, calendarId, date);
        res.status(200).json({
            status: 'success',
            payload: appointments
        });
    } catch (error) {
        res.status(200).json({
            status: 'failed',
            payload: error
        });
    }
}

exports.fetchAppointmentWithTimes = async (req, res, next) => {
    try {
        let { appointmentTypeID = 28950776, calendarId = 6306720, start = 0, end = 5 } = req.query;
        // let monthArray = [ moment().format('YYYY-MM'), moment().add(1, 'months').format('YYYY-MM'), moment().add(2, 'months').format('YYYY-MM') ];
        // let monthArray = [ moment().format('YYYY-MM')];

        let appointmentArray = [];
        for(let i = parseInt(start); i < parseInt(end); i++){
            let date = moment().add(i, 'days').format('YYYY-MM-DD');
            await appointmentArray.push(date);
        }
        
        // console.log(`Today - ${moment().format('YYYY-MM-DD')}\nZero -> ${moment().add(0, 'days').format('YYYY-MM-DD')} \nStart -> ${start} - ${startDate} \nEnd -> ${endDate}\n`);
        // let appointmentArray = [];
        // for(let month of monthArray){
        //     let appointment = await fetchAcuityAvailableDate(appointmentTypeID, calendarId, month);
        //     appointmentArray.push(...appointment);
        // }

        // let appointmentDateArray = appointmentAray.slice(start, end);

        let appointments = await fetchAvailableDateWithTime(appointmentTypeID, calendarId, appointmentArray);
        res.status(200).json({
            status: 'success',
            payload: appointments
        });
    } catch (error) {
        res.status(200).json({
            status: 'failed',
            payload: error
        });
    }
}

exports.makeUserAppointment = async (req, res, next)=> {
    try {
        let { appointmentTypeID = 28950776, calendarId = 6306720, appointment_time } = req.body;

        let result = await checkIfSlotAvailable(appointmentTypeID, calendarId, appointment_time);
        if(result.valid !== undefined && result.valid === true){
            let createAppointmentInAcuity = await makeAppointment(req.body);

            // console.log(`Create Appointment ==> ${JSON.stringify(createAppointmentInAcuity)}`);
            let findUserAppointment = await db.UserAppointment.findOne({
                where: {
                    acuity_appointment_id: createAppointmentInAcuity.id.toString()
                }
            });
            // console.log(`Step 1 ==> `)
            // console.log(`Step 2 ==> ${findUserAppointment}`)
            if (findUserAppointment !== null) {
                return res.json({
                    status: "failed",
                    payload: null,
                    message: "User Appointment already exist",
                });
            }

            let { first_name, last_name, phone_number, country_code, email, location_id, test_type_id,
                location_test_type_id, appointment_date } = req.body;

            // console.log(`Created Appntmnt => `)
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
                acuity_appointment_id: createAppointmentInAcuity.id,
                status: "ACTIVE"
            });

            // console.log(`createUserAppointment --> ${JSON.stringify(createUserAppointment)}`);
            res.status(200).json({
                status: "success",
                payload: createAppointmentInAcuity,
                message: "User Appointment successfully created",
            });

        }else{
            res.status(200).json({
                status: 'failed',
                payload: null,
                message: `The time ${moment(result.datetime).format('YYYY-MM-DD h:mm a')} is completed. Kindly try again with different time slot.`
            });
        }
    } catch (error) {
        console.log(`Error ===> ${error}`);
        res.status(200).json({
            status: 'failed',
            payload: error
        });
    }
}

exports.cancelUserAppointment = async (req, res, next) => {
    try {
        const { id } = req.params;

        if(id === undefined || id === null || id === ""){
            return res.json({
				status: "failed",
				payload: null,
				message: "User Appointment doesn't exist",
			});
        }

        let findUserAppointment = await db.UserAppointment.findOne({
			where: {
				acuity_appointment_id: id
			}
		});

		if (findUserAppointment === null) {
			return res.json({
				status: "failed",
				payload: null,
				message: "User Appointment doesn't exist",
			});
		}

        await deleteUserAppointment(id);

		await db.UserAppointment.destroy({
			where: {
				acuity_appointment_id: id
			}
		});

		res.status(200).json({
			status: "success",
			payload: null,
			message: "User Appointment successfully deleted",
		});

    } catch (error) {
        res.status(200).json({
            status: 'failed',
            payload: error
        });
    }
}