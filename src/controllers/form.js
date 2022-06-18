import db from '../models';
import cryptoJs from "../helpers/crypto";
import { createNewUser } from "../helpers/accounts";
import { loginSalesforce, CONNECTION, createAccountContact, createTestResult, findContactUsingMobileNumber, fetchContactFromSalesforceById, findContactUsingMobileNumberAndBirtDate, findContactUsingEmailAndBirtDate, updateContact, createCabTestResult } from "../helpers/salesForceUtils";
import { uploadDocument } from "../helpers/attachments";
import { S3_USER_BUCKET_NAME, S3_INSURANCE_BUCKET_NAME } from "../helpers/constants";
const fs = require('fs');

exports.test_form = async (req, res, next) => {
    try {
        // console.log("body==========>" + JSON.stringify(req.body))
        let { first_name, last_name, gender, country_code, phone_number, email, birth_date, race, ethnicity,
            driver_license_number, passport_number, ssn, address_line1, address_line2, city, state, country, zipcode,
            policy_number, insurance_provider, policy_group_number, provider_phone_number, front_insurance_card_image, back_insurance_card_image,
            street_address_line1, street_address_line2, provider_city, provider_state, provider_zipcode, test_types, contactId, verified_through, accuityId, session_id, physician_order, not_covered } = req.body;

        // console.log(`Id Image ===> ${req.body.id_image}`);
        // let qrCode = await cryptoJs.encrypt(user_profile.qr_code);
        console.log(`Enters ==> ${session_id !== undefined && session_id !== null ? session_id : 'No Session Id'} ---> ${new Date()}`);
        let login = await loginSalesforce();

        if (login === null) {
            return res.status(500).json({
                status: "failed",
                message: "failed to login with salesforce",
                payload: null
            })
        }

        let findContact = null;

        // console.log(`ContactId ===> ${contactId}`);
        if(contactId !== undefined && contactId !== null && contactId !== ""){
            // console.log(`fetchContactFromSalesforceById called ===> `);
            findContact = await fetchContactFromSalesforceById(contactId);
        }else{
            // findContact = await findContactUsingMobileNumber(phone_number);
            if(verified_through !== undefined){
                if(verified_through === 'EM'){
                    // console.log(`findContactUsingEmailAndBirtDate called ===> `);
                    findContact = await findContactUsingEmailAndBirtDate(email, birth_date);   
                }else{
                    // console.log(`findContactUsingMobileNumberAndBirtDate called ===> `);
                    findContact = await findContactUsingMobileNumberAndBirtDate(phone_number, birth_date);   
                }
            }else{
                // console.log(`findContactUsingMobileNumberAndBirtDate 2 called ===> `);
                findContact = await findContactUsingMobileNumberAndBirtDate(phone_number, birth_date);
            }            
        }

        console.log(`${session_id !== undefined && session_id !== null ? session_id : 'No Session Id'} Contact ==> ${JSON.stringify(findContact)} `);

        let contact = null;
        if (findContact.records.length === 0) {
            // console.log("if=========>")
            contact = await createAccountContact(req.body);
            // console.log(`\nContact Create ==> ${JSON.stringify(contact)}`)
        } else {
            // console.log("else=========> "+JSON.stringify(findContact.records[0]));
            await updateContact(req.body, findContact.records[0].Id);
            contact = findContact.records[0];
            // console.log(`\nContact Update ==> ${JSON.stringify(contact)}`)
        }

        // console.log(`\nStep 2 ==> ${JSON.stringify(contact)}`)

        // console.log(`\ntest_types ==> ${JSON.stringify(test_types)}`);

        // console.log(`\nBody ==> ${JSON.stringify(req.body)}`);

        await createTestResult(contact, test_types, req.body);
        console.log(`${session_id !== undefined && session_id !== null ? session_id : 'No Session Id'} Test result created`);
        // console.log("\nStep 3 ==>" + JSON.stringify(contact));

        let user_profile = await createNewUser(req.body, "CSR", contact);
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

        let result = {};

        if(currentContact.totalSize > 0){
            let createdContact = currentContact.records[0];
            let findName = createdContact.Name !== null ? createdContact.Name : "";
            let firstName = null;
            let lastName = null;

            let splitName = findName.split(" ");
            if(splitName.length > 0){
                firstName = splitName[0];

                lastName = splitName.reduce((accumulator, currentvalue, index) => {
                    if(index > 0){
                    accumulator = accumulator + " " + currentvalue
                    }
                    
                    return accumulator;
                }, "" );
            }

            result.first_name = firstName;
            result.last_name = lastName;
            result.birth_date = createdContact.Birthdate;
            result.qr_code = createdContact.QR_Code__c;
            result.email = createdContact.Email;
        }else{
            result.first_name = user_profile.first_name;
            result.last_name = user_profile.last_name;
            result.birth_date = user_profile.birth_date;
            result.qr_code = user_profile.qr_code;
            result.email = user_profile.email;
        }
        

        // let user_image_key, insurance_back_image_key, insurance_front_image_key; 
        // if(req.files.user_file !== undefined){
        //     let user_file = req.files.user_file[0];
        //     user_image_key = await uploadDocument(user_file, S3_USER_BUCKET_NAME);
        // }
        
        // if(req.files.insurance_front_file !== undefined && req.files.insurance_front_file.length > 0){
        //     let insurance_front_file = req.files.insurance_front_file[0];
        //     insurance_front_image_key = await uploadDocument(insurance_front_file, S3_INSURANCE_BUCKET_NAME);
        // }

        // if(req.files.insurance_back_file !== undefined && req.files.insurance_back_file.length > 0){
        //     let insurance_back_file = req.files.insurance_back_file[0];
        //     insurance_back_image_key = await uploadDocument(insurance_back_file, S3_INSURANCE_BUCKET_NAME);             
        // }
        console.log(`${session_id !== undefined && session_id !== null ? session_id : 'No Session Id'} - Finished creating `);
        res.status(200).json({
            status: 'success',
            payload: result,
            message: 'Successfully saved the form'
        });

    } catch (error) {
        console.log("Error at form ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while form",
        });
    }
}