import db from '../models';
import _ from "underscore";
import { createNewUser } from "../helpers/accounts";
import { loginSalesforce, CONNECTION, createAccountContact, createTestResult, findContactUsingMobileNumber, fetchContactFromSalesforceById, findContactUsingMobileNumberAndBirtDate, findContactUsingEmailAndBirtDate, updateContact } from "../helpers/salesForceUtils";
import { Op } from "sequelize";

exports.fetchAllPaymentStatus = async (req, res, next) => {
    try {
        let fetchResults = await db.TestResult.findAll({
            order: [
                ['id', 'DESC']
            ],
            attributes: {exclude: ["data"]}
        });
        res.status(200).json({
            status: 'success',
            payload: fetchResults,
            message: 'Test result fetched successfully'
        });
    } catch (error) {
        console.log(`Error --> ${error}`)
        res.status(500).json({
            status: "failed",
            payload: null,
            message: "Error While fetching test result",
        });
    }
}

exports.fetchPaymentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        let fetchResult = await db.TestResult.findOne({
            where: {
                id: id
            }
        });

        let processData = _.omit(fetchResult.data, 'signatureImage', 'back_insurance_card_image', 'front_insurance_card_image');

        res.status(200).json({
            status: 'success',
            payload: processData,
            message: 'Test result data fetched successfully'
        });
    } catch (error) {
        console.log(`Error --> ${error}`)
        res.status(500).json({
            status: "failed",
            payload: null,
            message: "Error While fetching test result",
        });
    }
}

exports.createTestResult = async (req, res, next) => {
    try {
        let { session_id, data, payment_status } = req.body;

        // console.log(`Body --> ${JSON.stringify(req.body)}`);
        console.log(`Test Result session created with session id -> ${session_id !== undefined ? session_id : ""} \n`)
        
        // console.log(`Body --> Enters ${data.test_types}--> ${data} --> ${data.test_types.length} ===> ${data !== undefined} ---> ${data.test_types.length > 0}\n`);
        if(session_id !== undefined && data !== undefined && data.test_types.length > 0){
            let locationTestType = data.test_types[0];
            let phone_number = data.phone_number;
            let email = data.email;
            let locationName = locationTestType.location_name;
            let testType = locationTestType.name;
            let fetchTestResult = await db.TestResult.findOne({
                where: {
                    session_id: session_id
                }
            });

            if(fetchTestResult !== null){
                res.status(200).json({
                    status: "failed",
                    payload: null,
                    message: "Test Result already exist",
                });
            }

            let createNewTestResult = await db.TestResult.create({
                session_id: session_id,
                first_name: data.first_name,
                last_name: data.last_name,
                phone_number: phone_number,
                email: email,
                test_type: testType,
                location: locationName,
                data: data,
                payment_status: 'PAYMENT INITIATED',
                is_paid: false,
                created_date: new Date(),
                status: 'ACTIVE'
            });

            console.log(`Payment Initiated for ${data.first_name !== null && data.first_name !== "" ? data.first_name : ''} ${data.last_name !== null && data.last_name !== "" ? data.last_name : ''} - with session id - ${session_id}`)
            
            res.status(200).json({
                status: 'success',
                payload: createNewTestResult,
                message: 'Test result created successfully'
            });
        }else{
            console.log(`No Data --> `)
            res.status(200).json({
                status: "failed",
                payload: null,
                message: "No data for test result",
            });
        }
    } catch (error) {
        console.log(`Error --> ${error}`)
        res.status(500).json({
            status: "failed",
            payload: null,
            message: "Error While creating test result",
        });
    }
}

exports.updateTestResult = async (req, res, next) => {
    try {
        const { session_id } = req.params;
        let { payment_status, transaction_ref } = req.body;

        console.log(`Session Id -- ${session_id} ---- Payment Status -- ${payment_status}`);
        let fetchTestResult = await db.TestResult.findOne({
            where: {
                session_id: session_id
            }
        });

        if(fetchTestResult === null){
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "Test Result not found",
            });
        }

        let updateObj = {};
        if(fetchTestResult.payment_status !== 'IN SALESFORCE'){
            updateObj.payment_status = payment_status;
        }
        if(payment_status === 'PAYMENT SUCCESSFUL'){
            updateObj.paid_at = new Date();
            updateObj.is_paid = true;
            updateObj.transaction_ref = transaction_ref !== undefined && transaction_ref !== "" ? transaction_ref : null;
        }

        if(fetchTestResult.payment_status !== 'IN SALESFORCE' && payment_status === 'PAYMENT FAILED'){
            updateObj.cancelled_at = new Date();
            updateObj.is_paid = false;
        }

        let updateNewTestResult = await db.TestResult.update(updateObj, {
            where: {
                id: fetchTestResult.id
            }
        });
        
        console.log(`Going to release respone for Session Id -- ${session_id} ---- Payment Status -- ${payment_status}`);

        res.status(200).json({
            status: 'success',
            payload: updateNewTestResult,
            message: 'Test result created successfully'
        });
    } catch (error) {
        console.log(`Error in payment status update ${error}`);
        res.status(200).json({
            status: "failed",
            payload: null,
            message: "Error While creating test result",
        });
    }
}

exports.resubmitTestResult = async (req, res, next) => {
    try {
        const { id } = req.params;
        let fetchResult = await db.TestResult.findOne({
            where: {
                id: id
            }
        });

        let session_id = fetchResult.session_id;
        let { first_name, last_name, gender, country_code, phone_number, email, birth_date, race, ethnicity,
            driver_license_number, passport_number, ssn, address_line1, address_line2, city, state, country, zipcode,
            policy_number, insurance_provider, policy_group_number, provider_phone_number, front_insurance_card_image, back_insurance_card_image,
            street_address_line1, street_address_line2, provider_city, provider_state, provider_zipcode, test_types, contactId, verified_through, accuityId } = fetchResult.data;

        let login = await loginSalesforce();

        if (login === null) {
            return res.status(500).json({
                status: "failed",
                message: "failed to login with salesforce",
                payload: null
            })
        }

        let findContact = null;

        if(contactId !== undefined && contactId !== null && contactId !== ""){
            findContact = await fetchContactFromSalesforceById(contactId);
        }else{
            if(verified_through !== undefined){
                if(verified_through === 'EM'){
                    findContact = await findContactUsingEmailAndBirtDate(email, birth_date);   
                }else{
                    findContact = await findContactUsingMobileNumberAndBirtDate(phone_number, birth_date);   
                }
            }else{
                findContact = await findContactUsingMobileNumberAndBirtDate(phone_number, birth_date);
            }            
        }

        let contact = null;
        if (findContact.records.length === 0) {
            contact = await createAccountContact(fetchResult.data);
        } else {
            await updateContact(fetchResult.data, findContact.records[0].Id);
            contact = findContact.records[0];
        }

        console.log(`Going to create Testresult`)
        await createTestResult(contact, test_types, fetchResult.data);

        // console.log("\nStep 3 ==>" + JSON.stringify(contact));

        let user_profile = await createNewUser(fetchResult.data, "CSR", contact);
        // console.log("user_profile=========>" + JSON.stringify(user_profile));
        let currentContact = await fetchContactFromSalesforceById(contact.Id);
        // console.log(`Current Contact ==> ${JSON.stringify(currentContact)}`);

        if(accuityId !== undefined && accuityId !== null && accuityId !== ""){
            await db.UserAppointment.destroy({
                where: {
                    acuity_appointment_id: accuityId
                }
            });
        }

        if(session_id !== undefined && session_id !== null && session_id !== ""){
            await db.TestResult.update({
                payment_status: 'IN SALESFORCE',
                // paid_at: new Date(),
                // is_paid: true
            }, {
                where: {
                    session_id: session_id
                }
            });
        }

        res.status(200).json({
            status: 'success',
            payload: {},
            message: 'Successfully re-submitted the form'
        });

    } catch (error) {
        console.log(`Error --> ${error}`)
        res.status(500).json({
            status: "failed",
            payload: null,
            message: "Error While fetching test result",
        });
    }
}

exports.fetchPaymentBySession = async (req, res, next) => {
    try {
        const { session_id } = req.params;
        console.log(`Payment Session Called --> ${session_id}`);
        let fetchTestResult = await db.TestResult.findOne({
            where: {
                session_id: session_id,
                // payment_status: 'PAYMENT SUCCESSFUL'
                payment_status: {
                    [Op.or]: ['PAYMENT INITIATED', 'PAYMENT SUCCESSFUL']
                }
            }
        });

        if(fetchTestResult === null){
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "Test Result not found",
            });
        }

        res.status(200).json({
            status: 'success',
            payload: fetchTestResult,
            message: 'Test result form fetched successfully'
        });

    } catch (error) {
        console.log(`Error --> ${error}`)
        res.status(500).json({
            status: "failed",
            payload: null,
            message: "Error While fetching test payment",
        });
    }
}