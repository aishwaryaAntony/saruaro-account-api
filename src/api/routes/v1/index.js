const express = require('express');
const router = express.Router();
import db from "../../../models";
import checkAuth from "../../../middleware/check-auth";
import { fetchTestResultByContactId, loginSalesforce, fetchContactFromSalesforce, fetchTestResultByPhoneNumberOrEmail, fetchCABTestResultByPhoneNumberOrEmail, findContactUsingMobileNumberAndBirtDate, updateCurrentContact, createAccountInProd, updateSMSsent, fetchContactFromSalesforceById, updatePRLReport, bulkSMSsent, fetchQueryResult } from "../../../helpers/salesForceUtils";
const cp = require('child_process');
const path = require("path");
const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../../../config/config.js')[env];
import { getImage } from "../../../helpers/attachments";
import { S3_BUCKETS, CLIENT_DOMAIN } from "../../../helpers/constants";
import smsUtils from "../../../helpers/smsUtils";
import { createVerificationCode } from "../../../helpers/accounts";
import cryptoJs from "../../../helpers/crypto";
import { send_mail } from "../../../helpers/emailUtils";
import { connectSFTP, disconnectSFTP, fetchRemoteFileThroughSFTP, downloadDynamicFilesFromSftp, fetchSingleRemoteFileThroughSFTP, fetchTestResultFromPRL, putPRLFileThroughSFTP, deleteFileFromSFTP } from "../../../helpers/sftpUtils";
import _ from "underscore";
import moment from "moment";
const fs = require('fs');

// const sample = require('./sample.json');

// var Acuity = require('acuityscheduling');

// var acuity = Acuity.basic({
// 	userId: 24642675,
// 	apiKey: '45790908b0e0d4360ab451e94746fd59'
// });

router.get('/internal/healthcheck', async (req, res, next) => {
    res.status(200).json({
        status: 'success'
    });
});

router.get('/api/internal/healthcheck', async (req, res, next) => {
    res.status(200).json({
        status: 'success'
    });
});

router.get('/internal/salesforce', async (req, res, next) => {
    try {
        let login = await loginSalesforce();
        // let contact = await createAccountInProd();

        if (login === null) {
            return res.status(500).json({
                status: "failed",
                message: "failed to login with salesforce",
                payload: null
            })
        }
        // else {
        //     return res.status(200).json({
        //         status: "success",
        //         message: "Logged in to salesforce successfully",
        //         payload: null
        //     })
        // }

        res.status(200).json({
            status: "success",
            message: "Logged in to salesforce successfully",
            payload: login
        })
    } catch (error) {
        return res.status(500).json({
            status: "failed",
            message: "failed to login with salesforce",
            payload: null
        })
    }
});

router.get('/test/results', checkAuth, async (req, res, next) => {
    try {
        const { member_token } = req.userData;
        // console.log(`Saved --> ${JSON.stringify(req.userData)}`)
        let fetchProfile = await db.UserProfile.findOne({
            where: {
                id: req.userData.user_profile_id,
                member_token: member_token
            }
        });

        // console.log(`\nCurrent Profile --> ${JSON.stringify(fetchProfile)}`)

        if (fetchProfile === null) {
            return res.status(200).json({
                status: "failed",
                message: "Invalid User",
                payload: null
            })
        }

        let hashed_phone_number = await cryptoJs.decrypt(fetchProfile.hashed_phone_number);
        // let email = await cryptoJs.hash_from_string(phone);
        // console.log(`Phone Number ==> ${hashed_phone_number}`)
        let testResult = await fetchTestResultByPhoneNumberOrEmail(hashed_phone_number, null, fetchProfile.birth_date);
        let cabTestResult = await fetchCABTestResultByPhoneNumberOrEmail(hashed_phone_number, null, fetchProfile.birth_date);

        let constructTestResult = [...testResult, ... cabTestResult];
        
        // let testResult = await fetchTestResultByContactId(fetchProfile.contact_id)
        if (testResult === null) {
            return res.status(200).json({
                status: "failed",
                message: "Invalid Test",
                payload: null
            })
        }

        res.status(200).json({
            status: 'success',
            // payload: testResult,
            payload: constructTestResult,
            message: "Error while fetch test results",
        });
    } catch (error) {
        console.log("Error at fetch test results ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while form",
        });
    }
});

router.post('/internal/run-script', async (req, res, next) => {
    try {
        // const { filename } = req.params;
        const { filename } = req.body;

        if (filename !== undefined && filename !== null && filename !== "") {
            // let path = __dirname;
            let filepath = path.join(__dirname, `../../../../dbscripts/${filename}`);
            // console.log(`Current path => ${filepath}`);
            cp.exec(`sh ${filepath}`, function (err, stdout, stderr) {
                // handle err, stdout, stderr
                let message = null;
                if (stderr) {
                    console.error(`error==> ${stderr}`);
                    message = stderr;
                }
                console.log(`success===> ${stdout}`);
                message = stdout;
                res.status(200).json({
                    status: 'success',
                    message: message
                });
            });
        } else {
            console.log("Error while running script file ==> " + error);
            res.status(500).json({
                status: "failed",
                payload: {},
                message: "Error while running script file",
            });
        }

    } catch (error) {
        console.log("Error while running script file ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while running script file",
        });
    }
});

router.get('/internal/db-check', async (req, res, next) => {
    let sequelize = new Sequelize(config.database, config.username, config.password, config);

    try {
        await sequelize.authenticate()
        console.log('Connection has been established successfully.');
        res.status(200).json({
            status: 'success'
        });
    } catch (err) {
        console.error('Unable to connect to the database:', err)
        res.status(500).json({
            status: 'failed'
        });
    }
});

router.get('/testUser', async (req, res, next) => {
    try {
        let login = await loginSalesforce();

        // let fetchRecord = await findContactUsingMobileNumberAndBirtDate('9163058285', '1996-09-03');
        // let fetchRecord = await updateCurrentContact();
        // let fetchRecord = await fetchContactFromSalesforceById('0034x00000sWJg1AAG');
        let fetchRecord = await fetchQueryResult();

        // res.status(200).json({
        //     status: 'success',
        //     payload: fetchRecord
        // });
        res.status(200).json(fetchRecord);
    } catch (error) {
        console.error('Unable to fetch user:', error)
        res.status(500).json({
            status: 'failed'
        });
    }
});

router.post('/test-user', async (req, res, next) => {
    try {
        let login = await loginSalesforce();

        let { verified_through, email, birth_date, phone_number } = req.body;
        let findContact = null;
        if (verified_through !== undefined) {
            if (verified_through === 'EM') {
                console.log(`findContactUsingEmailAndBirtDate called ===> `);
                findContact = await findContactUsingEmailAndBirtDate(email, birth_date);
            } else {
                console.log(`findContactUsingMobileNumberAndBirtDate called ===> `);
                findContact = await findContactUsingMobileNumberAndBirtDate(phone_number, birth_date);
            }
        } else {
            console.log(`findContactUsingMobileNumberAndBirtDate 2 called ===> `);
            findContact = await findContactUsingMobileNumberAndBirtDate(phone_number, birth_date);
        }

        res.status(200).json({
            status: 'success',
            payload: findContact
        });
    } catch (error) {
        console.error('Unable to fetch user:', error)
        res.status(200).json({
            status: 'failed'
        });
    }
});

router.get('/test/acuity', async (req, res, next) => {
    try {
        // acuity.request('appointment-types', function (err, aqres, appointments) {
        //     if (err) return console.error(err);
        //     // console.log(appointments);
        //     res.status(200).json({
        //         status: 'success',
        //         payload: appointments
        //     });
        // });
        res.status(200).json({
            status: "success",
            message: "Logged in to salesforce successfully",
            payload: null
        })
    } catch (error) {
        console.error('Unable to fetch acuity:', error)
        res.status(500).json({
            status: 'failed'
        });
    }
});

router.get('/image/:type/:imagename', async (req, res, next) => {
    try {
        let { imagename, type } = req.params;

        let findBucket = S3_BUCKETS.find(x => x.code === type);

        if (findBucket === undefined) {
            res.status(500).json({
                status: 'failed',
                payload: {},
                message: 'Error '
            });
        }

        var params = { Bucket: findBucket.bucketName, Key: imagename };

        let data = await getImage(params)

        res.writeHead(200, { 'Content-Type': 'image/jpeg' });
        res.write(data.Body, 'binary');
        res.end(null, 'binary');
        data.Body.toString('utf-8');

    } catch (error) {
        console.log("Error ==> " + JSON.stringify(error))
        res.status(500).json({
            status: 'failed',
            payload: {},
            message: 'Error '
        });
    }
});


router.post('/verify-phone', async (req, res, next) => {
    try {
        let { phone, country_code } = req.body;
        let otp = env === "development" ? "000000" : await createVerificationCode();
        let message = "Hi, Please use the verification code to verify your phone number - " + otp + ".";
        let phone_number = `${country_code}${phone}`;
        smsUtils.sendSms(phone_number, message);
        res.status(200).json({
            status: 'success',
            payload: otp,
            message: 'Successfully otp sent'
        });

    } catch (error) {
        console.log("Error ==> " + JSON.stringify(error))
        res.status(500).json({
            status: 'failed',
            payload: {},
            message: 'Error '
        });
    }
});

router.post('/verify-email', async (req, res, next) => {
    try {
        let { email } = req.body;
        let otp = env === "development" ? "000000" : await createVerificationCode();
        let data = {};
        data.verification_code = otp;
        send_mail("OTP", email, `User`, data);
        res.status(200).json({
            status: 'success',
            payload: otp,
            message: 'Successfully otp sent'
        });

    } catch (error) {
        console.log("Error ==> " + JSON.stringify(error))
        res.status(500).json({
            status: 'failed',
            payload: {},
            message: 'Error '
        });
    }
});


router.post('/send-test-results-sms', async (req, res, next) => {
    try {
        let { phone, email, name, location, testResultId } = req.body;

        if (location === "NY") {
            let message = `${name}, your Bloom Labs test results are ready. Please use the following link to view your report: http://saguarobloom.force.com/ Reply STOP to unsubscribe`;
            // let phone_number = phone.length === 10 ? `+1${phone}` : `${phone}`;
            let phone_number = `+1${phone}`;
            let data = {};
            data.lab_email = "help@bloomlabs.co";
            data.newyork = true;
            data.link = "http://saguarobloom.force.com/";
            console.log(`INDV -> Phone Number NY => ${phone} === Phone => ${phone_number}`);
            smsUtils.sendSms(phone_number, message);
            if(email !== undefined && email !== null && email !== "" && email !== "null"){
                send_mail("TEST_RESULT", email, name, data);
            }
        } else {
            let message = `Hi ${name}, your Saguaro Bloom test results have been updated. Please visit ${CLIENT_DOMAIN}login to access your results. Reply STOP to unsubscribe.            `;
            // let phone_number = phone.length === 10 ? `+1${phone}` : `${phone}`;
            let phone_number = `+1${phone}`;
            let data = {};
            data.lab_email = "support@bloomsafely.com";
            data.newyork = false;
            data.link = CLIENT_DOMAIN;
            console.log(`INDV -> Phone Number => ${phone} === Phone => ${phone_number}`);
            smsUtils.sendSms(phone_number, message);
            if(email !== undefined && email !== null && email !== "" && email !== "null"){
                send_mail("TEST_RESULT", email, name, data);
            }
        }

        if(testResultId !== undefined && testResultId !== null && testResultId !== ""){
            // await updateSMSsent(testResultId);
            updateSMSsent(testResultId);
        }

        res.status(200).json({
            status: 'success',
            message: 'Successfully message sent'
        });

    } catch (error) {
        console.log("Error ==> " + JSON.stringify(error))
        res.status(500).json({
            status: 'failed',
            payload: {},
            message: 'Error '
        });
    }
});


router.post('/resend-test-results-sms', async (req, res, next) => {
    try {
        if(req.body.length > 0){
            let testResultArray = [];
            for(let testResult of req.body){
                const { phone, email, name, location, testResultId } = testResult;
                let testResultObj = {};
                if(testResultId !== undefined && testResultId !== null && testResultId !== ""){
                    testResultObj.Id = testResultId;
                    testResultObj.Status__c = 'Result Sent';

                    testResultArray.push(testResultObj);
                }

                if (location === "NY") {
                    let message = `${name}, your Bloom Labs test results are ready. Please use the following link to view your report: http://saguarobloom.force.com/ Reply STOP to unsubscribe`;
                    // let phone_number = phone.length === 10 ? `+1${phone}` : `${phone}`;
                    let phone_number = `+1${phone}`;
                    let data = {};
                    data.lab_email = "help@bloomlabs.co";
                    data.newyork = true;
                    data.link = "http://saguarobloom.force.com/";
                    console.log(`BATCH -> Phone Number NY => ${phone} === Phone => ${phone_number}`);
                    smsUtils.sendSms(phone_number, message);
                    if(email !== undefined && email !== null && email !== "" && email !== "null"){
                        send_mail("TEST_RESULT", email, name, data);
                    }
                } else {
                    let message = `Hi ${name}, your Saguaro Bloom test results have been updated. Please visit ${CLIENT_DOMAIN}login to access your results. Reply STOP to unsubscribe.            `;
                    // let phone_number = phone.length === 10 ? `+1${phone}` : `${phone}`;
                    let phone_number = `+1${phone}`;
                    let data = {};
                    data.lab_email = "support@bloomsafely.com";
                    data.newyork = false;
                    data.link = CLIENT_DOMAIN;
                    console.log(`BATCH -> Phone Number => ${phone} === Phone => ${phone_number}`);
                    smsUtils.sendSms(phone_number, message);
                    if(email !== undefined && email !== null && email !== "" && email !== "null"){
                        send_mail("TEST_RESULT", email, name, data);
                    }
                }
        
                // if(testResultId !== undefined && testResultId !== null && testResultId !== ""){
                //     await updateSMSsent(testResultId);
                // }                
            }

            if(testResultArray.length > 0){
                bulkSMSsent(testResultArray);
            }

            res.status(200).json({
                status: 'success',
                message: 'SMS and Email sent Successfully '
            });

        }else{
            res.status(200).json({
                status: 'success',
                message: 'No SMS and Email to be sent'
            });
        }

    } catch (error) {
        console.log("Error ==> " + JSON.stringify(error))
        res.status(500).json({
            status: 'failed',
            payload: {},
            message: 'Error '
        });
    }
});


router.get('/fetch-result', async (req, res, next) => {
    try {
        let makeConnection = await connectSFTP();
        // console.log(`makeConnection ==> ${JSON.stringify(makeConnection)}`)
        if(makeConnection !== null){
            // let putFile = await putPRLFileThroughSFTP();
            
            let makeConnectionAndFetchFolder = await downloadDynamicFilesFromSftp();
            // console.log(`MakeConnectionAnd ==> ${JSON.stringify(makeConnectionAndFetchFolder)}`)
           
            if(makeConnectionAndFetchFolder.length > 0){
                // console.log(`MakeConnectionAnd ==> ${JSON.stringify(makeConnectionAndFetchFolder)}`)

                for(let dynamicFile of makeConnectionAndFetchFolder){
                    await fetchSingleRemoteFileThroughSFTP(dynamicFile.name);
                    let testResultArray = await fetchTestResultFromPRL(dynamicFile.name);
                    await deleteFileFromSFTP(dynamicFile.name);
                    console.log(`Dynamic ==> ${JSON.stringify(dynamicFile)} ==> ${JSON.stringify(testResultArray)}`);
                    await updatePRLReport(testResultArray);
                    // console.log(`Dynamic ==> ${JSON.stringify(dynamicFile)} ==> ${JSON.stringify(testResultArray)}`);
                    //delete the file
                    fs.unlink(path.resolve(__dirname, `../../../../uploads/${dynamicFile.name}`), (err => {
                        if (err) console.log(err);
                        else {
                            console.log(`\nDeleted file: ${dynamicFile.name}`);
                        }
                    }));
                }

                await disconnectSFTP();
                return res.json({
                    status: 'success',
                    payload: {},
                    payload: "File Uploaded Successfully"
                });
            }else{
                await disconnectSFTP();
                return res.json({
                    status: 'failed',
                    message: 'File Not Found'
                });
            }

            // await disconnectSFTP();
            // return res.json({
            //     status: 'success',
            //     message: 'File Not Found'
            // });
        }else{
            await disconnectSFTP();
            return res.json({
                status: 'failed',
                payload: "SFTP Connection Error"
            }); 
        }
        
    } catch (error) {
        await disconnectSFTP();
        console.log("Error ==> " + JSON.stringify(error))
        res.status(500).json({
            status: 'failed',
            message: 'Error '
        });
    }
});

// router.get('/show', async (req, res, next) => {
//     let filterType = _.filter(sample.payload, (current) => moment(current.createdAt).format('YYYY-MM-DD') === '2022-02-16')
//     let orderById = _.sortBy(filterType, 'id');
//     let pluckIds = _.pluck(orderById, 'id');
//     console.log(pluckIds);
//     res.json(orderById); 
// });

module.exports = router