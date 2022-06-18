const moment = require("moment");
const Acuity = require('acuityscheduling');

let acuity = Acuity.basic({
	userId: 24642675,
	apiKey: '45790908b0e0d4360ab451e94746fd59'
});

module.exports = {
    fetchAcuityAvailableDate: (appointmentTypeID, calendarId, month)=> {
        return new Promise(async (resolve, reject) => {
            try {
                let constructURL = `availability/dates?appointmentTypeID=${appointmentTypeID}&month=${month}&calendarID=${calendarId}`;
                let arr = acuity.request(constructURL, function (err, aqres, appointments) {
                    if (err) return console.error(err);
                    // console.log(appointments);
                    resolve(appointments);
                });
            } catch (error) {
                resolve([]);
            }
        });
    },

    fetchAvailableTimeByDate: (appointmentTypeID, calendarId, date)=> {
        return new Promise(async (resolve, reject) => {
            try {
                let constructURL = `availability/times?appointmentTypeID=${appointmentTypeID}&calendarID=${calendarId}&date=${date}`;
                acuity.request(constructURL, function (err, aqres, appointments) {
                    if (err) return console.error(err);
                    // console.log(`Time ==> ${JSON.stringify(appointments)}`);
                    resolve(appointments);
                });
            } catch (error) {
                resolve([]);
            }
        });
    },

    fetchAvailableDateWithTime: (appointmentTypeID, calendarId, dateArray)=> {
        return new Promise(async (resolve, reject) => {
            try {
                let constructDateWithTime = [];
                
                for(let appointmentDate of dateArray){
                    let constructDateObj = {};
                    let appointmentTimes = await module.exports.fetchAvailableTimeByDate(appointmentTypeID, calendarId, appointmentDate);
                    constructDateObj.date = appointmentDate;
                    constructDateObj.times = appointmentTimes;
                    constructDateWithTime.push(constructDateObj);
                }

                resolve(constructDateWithTime);
                
            } catch (error) {
                resolve([]);
            }
        });
    },

    checkIfSlotAvailable: (appointmentTypeID, calendarId, datetime)=> {
        return new Promise(async (resolve, reject) => {
            try {
                // https://acuityscheduling.com/api/v1/availability/check-times
                let constructURL = `availability/check-times`;
                let options = {
                    method: 'POST',
                    body: {
                        "datetime": datetime,
                        "appointmentTypeID": appointmentTypeID,
                        "calendarID": calendarId
                    }
                };

                acuity.request(constructURL, options, function (err, aqres, appointments) {
                    if (err) return console.error(err);
                    // console.log(`Time ==> ${JSON.stringify(appointments)}`);
                    resolve(appointments);
                });
                
            } catch (error) {
                resolve(null);
            }
        });
    },

    makeAppointment: (data)=> {
        return new Promise(async (resolve, reject) => {
            try {
                const { appointmentTypeID, calendarId, first_name, last_name, phone_number, country_code, email, appointment_time } = data;
                // https://acuityscheduling.com/api/v1/appointments
                let constructURL = `appointments`;
                let options = {
                    method: 'POST',
                    body: {
                        appointmentTypeID: appointmentTypeID,
                        datetime: appointment_time,
                        firstName: first_name,
                        lastName: last_name,
                        email: email,
                        phone: `${country_code}${phone_number}`,
                        calendarID: calendarId
                    }
                };

                acuity.request(constructURL, options, function (err, aqres, appointment) {
                    if (err) return console.error(err);

                    resolve(appointment);
                });
                
            } catch (error) {
                resolve(null);
            }
        });
    },

    deleteUserAppointment: (id)=> {
        return new Promise(async (resolve, reject) => {
            try {
                let constructURL = `appointments/${id}/cancel`;
                let options = {
                    method: 'PUT',
                    body: {}
                };
                acuity.request(constructURL, options, function (err, aqres, appointment) {
                    if (err) return console.error(err);

                    resolve(appointment);
                });
            } catch (error) {
                resolve(null);
            }
        });
    }
}