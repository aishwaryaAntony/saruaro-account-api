import { SALESFORCE_LOGIN_URL, SALESFORCE_CLIENT_SECRET, SALESFORCE_CLIENT_ID, SALESFORCE_USER_EMAIL, SALESFORCE_SECURITY_PASSWORD, ACCOUNT_API_DOMAIN_URL, S3_BUCKETS } from "./constants";
import _ from "underscore";
import { uploadDocument, uploadBase64Image } from "./attachments";
import { S3_USER_BUCKET_NAME, S3_INSURANCE_BUCKET_NAME } from "./constants";
import moment from "moment";
var jsforce = require('jsforce');

var conn = new jsforce.Connection({
    loginUrl: SALESFORCE_LOGIN_URL,
    clientId: SALESFORCE_CLIENT_ID,
    clientSecret: SALESFORCE_CLIENT_SECRET
});

module.exports = {
    CONNECTION: conn,
    loginSalesforce: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let isAlreadyLogin = await module.exports.checkIfSessionExist();

                if(isAlreadyLogin === null){
                    let auth = await conn.login(SALESFORCE_USER_EMAIL, SALESFORCE_SECURITY_PASSWORD);
                    resolve(auth);
                }else{
                    resolve(isAlreadyLogin);
                }                
            } catch (error) {
                console.log("error at loginSalesforce=============>" + error)
                resolve(null);
            }
        })
    },
    checkIfSessionExist: ()=> {
        return new Promise(async (resolve, reject) => {
            try {
                const identity = await conn.identity();
                resolve(identity);
            } catch (error) {
                console.log("Error at checkIfSessionExist =>" + error)
                resolve(null);
            }
        });
    },
    findContactUsingMobileNumber: (phone_number) => {
        return new Promise(async (resolve, reject) => {
            try {
                let query = await conn.query("SELECT Id, Birthdate, Name, Sex__c, Phone_number_text__c, MobilePhone, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE Phone_number_text__c LIKE '%" + phone_number + "'");
                resolve(query);
            } catch (error) {
                console.log("error at findContactUsingMobileNumber=====>" + error)
                resolve(null);
            }
        });
    },

    findContactUsingMobileNumberAndBirtDate: (phone_number, birthDate) => {
        return new Promise(async (resolve, reject) => {
            try {
                // let Birthdate = new Date(birthDate);
                // let cc = "SELECT Id, Birthdate, Name, Sex__c, Phone_number_text__c, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE MobilePhone LIKE '%" + phone_number + "' AND Birthdate = "+birthDate+" ";
                // console.log(`${cc}`)
                let query = await conn.query("SELECT Id, Birthdate, Name, Sex__c, Phone_number_text__c, MobilePhone, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE Phone_number_text__c LIKE '%" + phone_number + "' AND Birthdate = "+birthDate+" ");
                resolve(query);
            } catch (error) {
                console.log("error at findContactUsingMobileNumberAndBirtDate=====>" + error)
                resolve(null);
            }
        });
    },
    findContactUsingEmailAndBirtDate: (email, birthDate) => {
        return new Promise(async (resolve, reject) => {
            try {
                // let Birthdate = new Date(birthDate);
                let query = await conn.query("SELECT Id, Birthdate, Name, Sex__c, Phone_number_text__c, MobilePhone, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE Email LIKE '%" + email + "' AND Birthdate = "+birthDate+" ");
                resolve(query);
            } catch (error) {
                console.log("error at findContactUsingEmailAndBirtDate=====>" + error)
                resolve(null);
            }
        });
    },
    findContactUsingQRCode: (qrCode) => {
        return new Promise(async (resolve, reject) => {
            try {
                let query = await conn.query("SELECT Id, Birthdate, Name, Sex__c, Phone_number_text__c, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE QR_Code__c = '"+qrCode+"' ");
                resolve(query);
            } catch (error) {
                console.log("error at findContactUsingQRCode=====>" + error)
                resolve(null);
            }
        });
    },
    createAccountInProd: ()=> {
        return new Promise (async (resolve, reject)=> {
            try {
                await conn.sobject("Contact").insert({
                    LastName: 'Test User Contact'
                }, function (err, ret) {
                    if (err || !ret.success) { return console.error(err, ret); }
                    console.log('Contact Created Successfully : ' + ret.id);
                    resolve('success');
                });
            } catch (error) {
                console.log("error at createAccountInProd=====>" + error)
                resolve(null);
            }
        });
    },
    createAccountContact: (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                // let fetchAccountRecordType = await module.exports.fetchRecordTypes('Account');
                // let fetchContactRecordType = await module.exports.fetchRecordTypes('Contact');
                // let findAccountRecordType = fetchAccountRecordType.records.find(x => x.Name === "Business");
                let accountObj = null
                // if (findAccountRecordType !== undefined) {
                //     accountObj = await conn.sobject("Account").insert(
                //         {
                //             Name: `${data.first_name} ${data.last_name}`,
                //             RecordTypeId: findAccountRecordType.Id
                //         }, function (err, ret) {
                //             if (err || !ret.success) { return console.error(err, ret); }
                //             console.log('Account Created Successfully : ' + ret.id);
                //         }
                //     )
                // }

                let signature = null;
                let userImage = null;
                let insuranceFrontImage = null;
                let insuranceBackImage = null;

                /*
                if(data.signatureImage !== undefined && data.signatureImage !== null && data.signatureImage !== "" ){
                    signature = await uploadBase64Image(data.signatureImage, S3_USER_BUCKET_NAME);
                }

                if(data.id_image !== undefined && data.id_image !== null && data.id_image !== "" ){
                    userImage = await uploadBase64Image(data.id_image, S3_USER_BUCKET_NAME);
                }

                if(data.front_insurance_card_image !== undefined && data.front_insurance_card_image !== null && data.front_insurance_card_image !== ""){
                    insuranceFrontImage = await uploadBase64Image(data.front_insurance_card_image, S3_INSURANCE_BUCKET_NAME);
                }
                
                if(data.back_insurance_card_image !== undefined && data.back_insurance_card_image !== null && data.back_insurance_card_image !== ""){
                    insuranceBackImage = await uploadBase64Image(data.back_insurance_card_image, S3_INSURANCE_BUCKET_NAME);
                }
                */

                if(data.signatureImage !== undefined && data.signatureImage !== null && data.signatureImage !== "" ){
                    let key = await uploadBase64Image(data.signatureImage, S3_USER_BUCKET_NAME);
                    let findBucket = S3_BUCKETS.find(x => x.bucketName === S3_USER_BUCKET_NAME);
                    if(findBucket !== undefined){
                        signature = `${ACCOUNT_API_DOMAIN_URL}image/${findBucket.code}/${key}`
                    }
                }

                if(data.id_image !== undefined && data.id_image !== null && data.id_image !== "" ){
                    let key = await uploadBase64Image(data.id_image, S3_USER_BUCKET_NAME);
                    let findBucket = S3_BUCKETS.find(x => x.bucketName === S3_USER_BUCKET_NAME);
                    if(findBucket !== undefined){
                        userImage = `${ACCOUNT_API_DOMAIN_URL}image/${findBucket.code}/${key}`
                    }
                }

                if(data.front_insurance_card_image !== undefined && data.front_insurance_card_image !== null && data.front_insurance_card_image !== ""){
                    let key = await uploadBase64Image(data.front_insurance_card_image, S3_INSURANCE_BUCKET_NAME);
                    let findBucket = S3_BUCKETS.find(x => x.bucketName === S3_INSURANCE_BUCKET_NAME);
                    if(findBucket !== undefined){
                        insuranceFrontImage = `${ACCOUNT_API_DOMAIN_URL}image/${findBucket.code}/${key}`
                    }
                }
                
                if(data.back_insurance_card_image !== undefined && data.back_insurance_card_image !== null && data.back_insurance_card_image !== ""){
                    let key = await uploadBase64Image(data.back_insurance_card_image, S3_INSURANCE_BUCKET_NAME);
                    let findBucket = S3_BUCKETS.find(x => x.bucketName === S3_INSURANCE_BUCKET_NAME);
                    if(findBucket !== undefined){
                        insuranceBackImage = `${ACCOUNT_API_DOMAIN_URL}image/${findBucket.code}/${key}`
                    }
                }

                let contactObj = null;
                // let findContactRecordType = fetchContactRecordType.records.find(x => x.Name === "Individual");
                // if (findAccountRecordType !== undefined) {
                    let carrierAddress = `${data.insurance_street_address} ${data.insurance_street_address_line2}, ${data.insurance_city}, ${data.insurance_state}, ${data.insurance_zip_code} `;
                    contactObj = await conn.sobject("Contact").insert(
                        {
                            //AccountId: accountObj.id,
                            Birthdate: data.birth_date,
                            MobilePhone: data.phone_number,
                            FirstName: `${data.first_name}`,
                            LastName: `${data.last_name}`,
                            // LastName: `${data.first_name} ${data.last_name}`,
                            // Name: `${data.first_name} ${data.last_name}`,
                            // RecordTypeId: findAccountRecordType.Id,
                            Email: data.email,
                            Ethnicity__c: data.ethnicity,
                            Race__c: data.race,
                            Sex__c: data.gender,
                            Zip_Code__c: data.zipcode,
                            Health_Insurance_Carrier_Name__c: data.insurance_provider,
                            Health_Insurance_Carrier_Phone_Number__c: data.provider_phone_number,
                            Health_Insurance_Policy_Group_Number__c: data.policy_group_number,
                            Health_Insurance_Carrier_Address__c: carrierAddress,
                            Image_From_Amazon__c: true,
                            Signature_URL__c: signature,
                            Uploadimageurl__c : userImage,
                            Insurancecardimageurl__c: insuranceFrontImage,
                            Health_Insurance_Policy_Number_Member_ID__c: data.health_insurance_policy_member_id !== null && data.health_insurance_policy_member_id !== "" ? data.health_insurance_policy_member_id.slice(0,18) : null,
                            // Primary_Insurance_City__c: data.insurance_city,
                            // Primary_Insurance_State__c: data.insurance_state,
                            // Primary_Insurance_Zip__c: data.insurance_zip_code,
                            MailingStreet: data.address_line1,
                            MailingCity: data.city,
                            MailingState: data.state,
                            // MailingCountry: data.country,
                            MailingPostalCode: data.zipcode,
                            SSN__c: data.ssn_number !== null ? data.ssn_number.slice(0,9) : null,
                            Driver_s_License_Number__c: data.license_number !== null ? data.license_number.slice(0,50) : null,
                            Passport_Number__c: data.passport_number !== null ? data.passport_number.slice(0, 35) : null
                        }, function (err, ret) {
                            if (err || !ret.success) { return console.error(err, ret); }
                            console.log('Contact Created Successfully : ' + ret.id);
                        }
                    )
                // }
                // console.log("==contactObj=====>"+JSON.stringify(contactObj))
                let resultObj = {}
                resultObj.Id = contactObj.id;
                resultObj.Name = contactObj.Name;
                resultObj.Birthdate = contactObj.Birthdate;
                resultObj.Email = contactObj.Email;
                resultObj.Ethnicity__c = contactObj.Ethnicity__c;
                resultObj.Race__c = contactObj.Race__c;
                resultObj.Sex__c = contactObj.Sex__c;
                resolve(resultObj);
            } catch (error) {
                console.log("error at createAccountContact=====>" + error)
                resolve(null);
            }
        })
    },
    updateContact: (data, contact_id) => {
        return new Promise(async (resolve, reject) => {
            try {
                let signature = null;
                let userImage = null;
                let insuranceFrontImage = null;
                let insuranceBackImage = null;
                let contactData = {};

                /*
                if(data.signatureImage !== undefined && data.signatureImage !== null && data.signatureImage !== "" ){
                    signature = await uploadBase64Image(data.signatureImage, S3_USER_BUCKET_NAME);
                    if(signature !== null){
                        contactData.Signature_URL__c = signature;
                    }
                }

                if(data.id_image !== undefined && data.id_image !== null && data.id_image !== "" ){
                    userImage = await uploadBase64Image(data.id_image, S3_USER_BUCKET_NAME);
                    if(userImage !== null){
                        contactData.Uploadimageurl__c = userImage;
                    }
                }

                if(data.front_insurance_card_image !== undefined && data.front_insurance_card_image !== null && data.front_insurance_card_image !== ""){
                    insuranceFrontImage = await uploadBase64Image(data.front_insurance_card_image, S3_INSURANCE_BUCKET_NAME);
                    if(insuranceFrontImage !== null){
                        contactData.Insurancecardimageurl__c = insuranceFrontImage;
                    }
                }
                
                if(data.back_insurance_card_image !== undefined && data.back_insurance_card_image !== null && data.back_insurance_card_image !== ""){
                    insuranceBackImage = await uploadBase64Image(data.back_insurance_card_image, S3_INSURANCE_BUCKET_NAME);
                }

                */

                if(data.signatureImage !== undefined && data.signatureImage !== null && data.signatureImage !== "" ){
                    let key = await uploadBase64Image(data.signatureImage, S3_USER_BUCKET_NAME);
                    let findBucket = S3_BUCKETS.find(x => x.bucketName === S3_USER_BUCKET_NAME);
                    if(findBucket !== undefined){
                        signature = `${ACCOUNT_API_DOMAIN_URL}image/${findBucket.code}/${key}`
                    }
                }

                if(data.id_image !== undefined && data.id_image !== null && data.id_image !== "" ){
                    let key = await uploadBase64Image(data.id_image, S3_USER_BUCKET_NAME);
                    let findBucket = S3_BUCKETS.find(x => x.bucketName === S3_USER_BUCKET_NAME);
                    if(findBucket !== undefined){
                        userImage = `${ACCOUNT_API_DOMAIN_URL}image/${findBucket.code}/${key}`
                    }
                }

                if(data.front_insurance_card_image !== undefined && data.front_insurance_card_image !== null && data.front_insurance_card_image !== ""){
                    let key = await uploadBase64Image(data.front_insurance_card_image, S3_INSURANCE_BUCKET_NAME);
                    let findBucket = S3_BUCKETS.find(x => x.bucketName === S3_INSURANCE_BUCKET_NAME);
                    if(findBucket !== undefined){
                        insuranceFrontImage = `${ACCOUNT_API_DOMAIN_URL}image/${findBucket.code}/${key}`
                    }
                }
                
                if(data.back_insurance_card_image !== undefined && data.back_insurance_card_image !== null && data.back_insurance_card_image !== ""){
                    let key = await uploadBase64Image(data.back_insurance_card_image, S3_INSURANCE_BUCKET_NAME);
                    let findBucket = S3_BUCKETS.find(x => x.bucketName === S3_INSURANCE_BUCKET_NAME);
                    if(findBucket !== undefined){
                        insuranceBackImage = `${ACCOUNT_API_DOMAIN_URL}image/${findBucket.code}/${key}`
                    }
                }

                let carrierAddress= `${data.insurance_street_address} ${data.insurance_street_address_line2}, ${data.insurance_city}, ${data.insurance_state}, ${data.insurance_zip_code} `;

                await conn.sobject("Contact").update({
                        Id: contact_id,
                        Birthdate: data.birth_date,
                        FirstName: `${data.first_name}`,
                        LastName: `${data.last_name}`,
                        Email: data.email,
                        Ethnicity__c: data.ethnicity,
                        Race__c: data.race,
                        Sex__c: data.gender,
                        Zip_Code__c: data.zipcode,
                        Health_Insurance_Carrier_Name__c: data.insurance_provider,
                        Health_Insurance_Carrier_Phone_Number__c: data.provider_phone_number,
                        Health_Insurance_Policy_Group_Number__c: data.policy_group_number,
                        Health_Insurance_Carrier_Address__c: carrierAddress,
                        Image_From_Amazon__c: true,
                        Signature_URL__c: signature ,
                        Uploadimageurl__c : userImage ,
                        Insurancecardimageurl__c: insuranceFrontImage ,
                        Health_Insurance_Policy_Number_Member_ID__c: data.health_insurance_policy_member_id !== null && data.health_insurance_policy_member_id !== "" ? data.health_insurance_policy_member_id.slice(0,18) : null,
                        // Primary_Insurance_City__c: data.insurance_city,
                        // Primary_Insurance_State__c: data.insurance_state,
                        // Primary_Insurance_Zip__c: data.insurance_zip_code,
                        MailingStreet: data.address_line1,
                        MailingCity: data.city,
                        MailingState: data.state,
                        // MailingCountry: data.country,
                        MailingPostalCode: data.zipcode,
                        SSN__c: data.ssn_number !== null ? data.ssn_number.slice(0,9) : undefined,
                        Driver_s_License_Number__c: data.license_number !== null ? data.license_number.slice(0,50) : undefined,
                        Passport_Number__c: data.passport_number !== null ? data.passport_number.slice(0, 35) : undefined
                    }, function (err, ret) {
                        if (err || !ret.success) { return console.error(err, ret); }
                        console.log('Updated Successfully : ' + ret.id);
                        // console.log(`Step 14`)
                        // ...
                    }
                );

                resolve("success");
            } catch (error) {
                console.log("error at updateContact=====>" + error)
                resolve(null);
            }
        })
    },
    fetchRecordTypes: (objectType) => {
        return new Promise(async (resolve, reject) => {
            try {
                let recordTypeQuery = await conn.query("SELECT Id,Name from RecordType where sObjectType='" + objectType + "'");
                resolve(recordTypeQuery);
            } catch (error) {
                console.log("error at fetchRecordTypes=====>" + error)
                resolve(null);
            }
        })
    },
    createTestResult: (data, testTypes, body) => {
        return new Promise(async (resolve, reject) => {
            try {
                // create a test result
                if(testTypes.length > 0){
                    for(let testType of testTypes){
                        // console.log(`Testtype ===> ${JSON.stringify(testType)}`)
                        let amountPaid = testType.is_paid_type === true ? testType.price : 0 ;
                        let { accuityId, physician_order, not_covered } = body;

                        // console.log(`Location Testtype Salesforce id===> ${testType.location_test_type_ref}`)
                        // Check the test type code for CAB Test
                        if(testType.test_type.code.includes("CAB")){
                            await module.exports.createCabTestResult(data, testType, body);
                        }else{                            
                            if(testType.location_test_type_ref.indexOf(',') > -1){
                                let fetchSalesforceIds = testType.location_test_type_ref.split(',');
                                if(fetchSalesforceIds.length > 0){
                                    for(let currentSalesforceId of fetchSalesforceIds){
                                        let salesforceId = currentSalesforceId.trim();
                                        await conn.sobject("Test_Result__c").insert(
                                            {
                                                Patient__c: data.Id,
                                                Test_Type__c: salesforceId,
                                                Amount_Paid__c: amountPaid,
                                                Acuity_Appointment_ID__c: accuityId !== undefined && accuityId !== null ? accuityId : null,
                                                Exposed_to_COVID_or_Physician_Order__c: physician_order !== undefined && physician_order !== null ? (physician_order === true || physician_order === "true") ? 'Yes' : null : null,
                                                I_am_not_covered_under_health_insurance__c: not_covered !== undefined && not_covered !== null ? (not_covered === true || not_covered === "true") ? 'Yes' : null : null
                                            }, function (err, ret) {
                                                if (err || !ret.success) { return console.error(err, ret); }
                                                console.log('Test Result Created Successfully : ' + ret.id);
                                            }
                                        )
                                    }
                                }

                            }else{
                                await conn.sobject("Test_Result__c").insert(
                                    {
                                        Patient__c: data.Id,
                                        Test_Type__c: testType.location_test_type_ref,
                                        Amount_Paid__c: amountPaid,
                                        Acuity_Appointment_ID__c: accuityId !== undefined && accuityId !== null ? accuityId : null,
                                        Exposed_to_COVID_or_Physician_Order__c: physician_order !== undefined && physician_order !== null ? (physician_order === true || physician_order === "true") ? 'Yes' : null : null,
                                        I_am_not_covered_under_health_insurance__c: not_covered !== undefined && not_covered !== null ? (not_covered === true || not_covered === "true") ? 'Yes' : null : null
                                    }, function (err, ret) {
                                        if (err || !ret.success) { return console.error(err, ret); }
                                        console.log('Test Result Created Successfully : ' + ret.id);
                                    }
                                )
                            }
                        }

                        // let testResultObj = await conn.sobject("Test_Result__c").insert(
                        //     {
                        //         Patient__c: data.Id,
                        //         Test_Type__c: testType.location_test_type_ref,
                        //         Amount_Paid__c: amountPaid,
                        //         Acuity_Appointment_ID__c: accuityId !== undefined && accuityId !== null ? accuityId : null
                        //     }, function (err, ret) {
                        //         if (err || !ret.success) { return console.error(err, ret); }
                        //         console.log('Test Result Created Successfully : ' + ret.id);
                        //     }
                        // )
                    }
                }

                resolve("success");

            } catch (error) {
                console.log("error at createTestResult=====>" + error)
                resolve(null);
            }
        })
    },

    createCabTestResult: (data, testType, body)=> {
        return new Promise(async (resolve, reject) => {
            try {
                /*
                if(testTypes.length > 0){
                    for(let testType of testTypes){
                        let amountPaid = testType.is_paid_type === true ? testType.price : 0 ;
                        let { accuityId } = body;
                        if(testType.location_test_type_ref.indexOf(',') > -1){
                            let fetchSalesforceIds = testType.location_test_type_ref.split(',');
                            if(fetchSalesforceIds.length > 0){
                                for(let currentSalesforceId of fetchSalesforceIds){
                                    let salesforceId = currentSalesforceId.trim();
                                    await conn.sobject("CAB_Test_Result__c").insert({
                                            Patient__c: data.Id,
                                            Test_Type__c: salesforceId,
                                            Amount_Paid__c: amountPaid,
                                            Acuity_Appointment_ID__c: accuityId !== undefined && accuityId !== null ? accuityId : null
                                        }, function (err, ret) {
                                            if (err || !ret.success) { return console.error(err, ret); }
                                            console.log('Cab Test Result Created Successfully : ' + ret.id);
                                        }
                                    )
                                }
                            }
                        }else{
                            await conn.sobject("CAB_Test_Result__c").insert({
                                    Patient__c: data.Id,
                                    Test_Type__c: testType.location_test_type_ref,
                                    Amount_Paid__c: amountPaid,
                                    Acuity_Appointment_ID__c: accuityId !== undefined && accuityId !== null ? accuityId : null
                                }, function (err, ret) {
                                    if (err || !ret.success) { return console.error(err, ret); }
                                    console.log('Cab Test Result Created Successfully : ' + ret.id);
                                }
                            )
                        }
                    }
                }
                */
                let amountPaid = testType.is_paid_type === true ? testType.price : 0 ;
                let { accuityId, physician_order, not_covered } = body;
                if(testType.location_test_type_ref.indexOf(',') > -1){
                    let fetchSalesforceIds = testType.location_test_type_ref.split(',');
                    if(fetchSalesforceIds.length > 0){
                        for(let currentSalesforceId of fetchSalesforceIds){
                            let salesforceId = currentSalesforceId.trim();
                            await conn.sobject("CAB_Test_Result__c").insert({
                                    Patient__c: data.Id,
                                    Test_Type__c: salesforceId,
                                    Amount_Paid__c: amountPaid,
                                    Acuity_Appointment_ID__c: accuityId !== undefined && accuityId !== null ? accuityId : null,
                                    Exposed_to_COVID_or_Physician_Order__c: physician_order !== undefined && physician_order !== null ? (physician_order === true || physician_order === "true") ? 'Yes' : null : null,
                                    I_am_not_covered_under_health_insurance__c: not_covered !== undefined && not_covered !== null ? (not_covered === true || not_covered === "true") ? 'Yes' : null : null
                                }, function (err, ret) {
                                    if (err || !ret.success) { return console.error(err, ret); }
                                    console.log('Cab Test Result Created Successfully : ' + ret.id);
                                }
                            )
                        }
                    }
                }else{
                    await conn.sobject("CAB_Test_Result__c").insert({
                            Patient__c: data.Id,
                            Test_Type__c: testType.location_test_type_ref,
                            Amount_Paid__c: amountPaid,
                            Acuity_Appointment_ID__c: accuityId !== undefined && accuityId !== null ? accuityId : null,
                            Exposed_to_COVID_or_Physician_Order__c: physician_order !== undefined && physician_order !== null ? (physician_order === true || physician_order === "true") ? 'Yes' : null : null,
                            I_am_not_covered_under_health_insurance__c: not_covered !== undefined && not_covered !== null ? (not_covered === true || not_covered === "true") ? 'Yes' : null : null
                        }, function (err, ret) {
                            if (err || !ret.success) { return console.error(err, ret); }
                            console.log('Cab Test Result Created Successfully : ' + ret.id);
                        }
                    )
                }

                resolve("success");

            } catch (error) {
                console.log("error at createCabTestResult=====>" + error)
                resolve(null);
            }
        });
    },
    fetchTestResultByContactId: (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                if(id === null){
                    resolve([]);
                }
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve([]);
                }
                let testtypes = await conn.query("SELECT Id, Name FROM Test_Type__c");

                if (testtypes.records.length === 0) {
                    resolve([]);
                }

                let testResults = await conn.query("SELECT Id, Name, Tube_Number__c, Test_Type_Name2__c, Status__c, Result_Date_Sent__c, Result_Sent_Date__c, Collection_Date__c, Pre_registration_Date__c, CreatedDate, Result__c, Test_Type__c, Patient__c, Result_link1__c FROM Test_Result__c WHERE Patient__c = '" + id + "'")

                if (testResults.records.length === 0) {
                    resolve([]);
                }

                let testResultArray = [];
                for (let test of testResults.records) {
                    let findTestType = testtypes.records.find(x => x.Id === test.Test_Type__c);
                    if (findTestType !== undefined) {
                        let testObj = {}
                        testObj.test_result_id = test.Id;
                        testObj.test_name = test.Name;
                        testObj.status = test.Status__c;
                        testObj.result = test.Result__c;
                        testObj.tube_number = test.Tube_Number__c;
                        testObj.test_type_name = test.Test_Type_Name2__c;
                        testObj.collection_date = test.Collection_Date__c;
                        testObj.registration_date = test.Pre_registration_Date__c;
                        testObj.test_type = findTestType.Name;
                        testObj.download_url = test.Result_link1__c;
                        
                        testResultArray.push(testObj);
                    }
                }
                resolve(testResultArray);
            } catch (error) {
                console.log("error at fetchTestResultByContactId=====>" + error)
                resolve(null);
            }
        })
    },

    fetchTestResultByPhoneNumberOrEmail: (phone, email, birthDate) => {
        return new Promise(async (resolve, reject) => {
            try {
                if((phone === null && email === null) || birthDate === null){
                    resolve([]);
                }
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve([]);
                }
                let testtypes = await conn.query("SELECT Id, Name FROM Test_Type__c");

                if (testtypes.records.length === 0) {
                    resolve([]);
                }

                let processedBirthDate = moment(birthDate).format('YYYY-MM-DD');

                let fetchContacts = null;
                if(phone !== null){
                    fetchContacts = await conn.query("SELECT Id, Name, Birthdate FROM Contact WHERE Phone_number_text__c LIKE '%" + phone + "' AND Birthdate = "+processedBirthDate+" ");
                }

                if(email !== null){
                    fetchContacts = await conn.query("SELECT Id, Name, Birthdate FROM Contact WHERE Email LIKE '" + email + "' AND Birthdate = "+processedBirthDate+" ");
                }


                console.log(`FetchContacts ==> ${JSON.stringify(fetchContacts.records)}`)
                let contactIds = [];
                if(fetchContacts !== null && fetchContacts.totalSize > 0){
                    // console.log(`FetchContacts ==> ${JSON.stringify(fetchContacts.records)}`)
                    contactIds = _.pluck(fetchContacts.records, 'Id');
                    // console.log("('" + contactIds.join("','") + "')");
                    let testResults = await conn.query("SELECT Id, Name, Tube_Number__c, Test_Type_Name2__c, Status__c, Result_Date_Sent__c, Result_Sent_Date__c, Collection_Date__c, Pre_registration_Date__c, CreatedDate, Result__c, Test_Type__c, Patient__c, Result_link1__c FROM Test_Result__c WHERE Patient__c IN ('" + contactIds.join("','") + "') ");
                    if (testResults.records.length === 0) {
                        resolve([]);
                    }
    
                    let testResultArray = [];
                    for (let test of testResults.records) {
                        let findTestType = testtypes.records.find(x => x.Id === test.Test_Type__c);
                        let findContact = fetchContacts.records.find(y => y.Id === test.Patient__c);
                        if (findTestType !== undefined) {
                            let testObj = {}
                            testObj.test_result_id = test.Id;
                            testObj.test_name = test.Name;
                            testObj.status = test.Status__c;
                            testObj.result = test.Result__c;
                            testObj.tube_number = test.Tube_Number__c;
                            testObj.test_type_name = test.Test_Type_Name2__c;
                            testObj.collection_date = test.Collection_Date__c;
                            testObj.registration_date = test.Pre_registration_Date__c;
                            testObj.test_type = findTestType.Name;
                            testObj.download_url = test.Result_link1__c;
                            testObj.patient_name = findContact !== undefined ? findContact.Name : '' ;
                            testObj.patient_id = test.Patient__c;
                            
                            testResultArray.push(testObj);
                        }
                    }
                    resolve(testResultArray);
                }else{
                    resolve([]);
                }

                

                // resolve(fetchContacts);

                // let testResults = await conn.query("SELECT Id, Name, Tube_Number__c, Test_Type_Name2__c, Status__c, Result_Date_Sent__c, Result_Sent_Date__c, Collection_Date__c, Pre_registration_Date__c, CreatedDate, Result__c, Test_Type__c, Patient__c, Result_link1__c FROM Test_Result__c WHERE Patient__c = '" + id + "'")

                // if (testResults.records.length === 0) {
                //     resolve([]);
                // }

                // let testResultArray = [];
                // for (let test of testResults.records) {
                //     let findTestType = testtypes.records.find(x => x.Id === test.Test_Type__c);
                //     if (findTestType !== undefined) {
                //         let testObj = {}
                //         testObj.test_result_id = test.Id;
                //         testObj.test_name = test.Name;
                //         testObj.status = test.Status__c;
                //         testObj.result = test.Result__c;
                //         testObj.tube_number = test.Tube_Number__c;
                //         testObj.test_type_name = test.Test_Type_Name2__c;
                //         testObj.collection_date = test.Collection_Date__c;
                //         testObj.registration_date = test.Pre_registration_Date__c;
                //         testObj.test_type = findTestType.Name;
                //         testObj.download_url = test.Result_link1__c;
                        
                //         testResultArray.push(testObj);
                //     }
                // }
                // resolve(testResultArray);
            } catch (error) {
                console.log("error at fetchTestResultByContactId=====>" + error)
                resolve(null);
            }
        })
    },

    fetchCABTestResultByPhoneNumberOrEmail: (phone, email, birthDate) => {
        return new Promise(async (resolve, reject) => {
            try {
                if((phone === null && email === null) || birthDate === null){
                    resolve([]);
                }
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve([]);
                }
                let testtypes = await conn.query("SELECT Id, Name FROM Test_Type__c");

                if (testtypes.records.length === 0) {
                    resolve([]);
                }

                let processedBirthDate = moment(birthDate).format('YYYY-MM-DD');

                let fetchContacts = null;
                if(phone !== null){
                    fetchContacts = await conn.query("SELECT Id, Name, Birthdate FROM Contact WHERE Phone_number_text__c LIKE '%" + phone + "' AND Birthdate = "+processedBirthDate+" ");
                }

                if(email !== null){
                    fetchContacts = await conn.query("SELECT Id, Name, Birthdate FROM Contact WHERE Email LIKE '" + email + "' AND Birthdate = "+processedBirthDate+" ");
                }


                console.log(`FetchContacts ==> ${JSON.stringify(fetchContacts.records)}`)
                let contactIds = [];
                if(fetchContacts !== null && fetchContacts.totalSize > 0){
                    // console.log(`FetchContacts ==> ${JSON.stringify(fetchContacts.records)}`)
                    contactIds = _.pluck(fetchContacts.records, 'Id');
                    // console.log("('" + contactIds.join("','") + "')");
                    // let testResults = await conn.query("SELECT Id, Name, Tube_Number__c, Test_Type_Name2__c, Status__c, Result_Date_Sent__c, Result_Sent_Date__c, Collection_Date__c, Pre_registration_Date__c, CreatedDate, Result__c, Test_Type__c, Patient__c, Result_link1__c FROM Test_Result__c WHERE Patient__c IN ('" + contactIds.join("','") + "') ");

                    let testResults = await conn.query("SELECT Id, Name, Tube_Number__c, Test_Type_Name2__c, Status__c, Result_Date_Sent__c, Result_Sent_Date__c, Collection_Date__c, Test_Type__c, COVID__c, Flu_A__c, Flu_B__c, Result_hyperlink__c, Patient__c, Result_link1__c, Pre_registration_Date__c FROM CAB_Test_Result__c WHERE Patient__c IN ('" + contactIds.join("','") + "') ");
                    if (testResults.records.length === 0) {
                        resolve([]);
                    }
    
                    let testResultArray = [];
                    for (let test of testResults.records) {
                        let findTestType = testtypes.records.find(x => x.Id === test.Test_Type__c);
                        let findContact = fetchContacts.records.find(y => y.Id === test.Patient__c);
                        if (findTestType !== undefined) {
                            let testObj = {}
                            testObj.test_result_id = test.Id;
                            testObj.test_name = test.Name;
                            testObj.status = test.Status__c;
                            testObj.result = test.COVID__c;
                            testObj.flu_a = test.Flu_A__c;
                            testObj.flu_b = test.Flu_B__c;
                            testObj.tube_number = test.Tube_Number__c;
                            testObj.test_type_name = test.Test_Type_Name2__c;
                            // testObj.test_type_name = `CAB - ${test.Test_Type_Name2__c}`;
                            testObj.collection_date = test.Collection_Date__c;
                            testObj.registration_date = test.Pre_registration_Date__c;
                            testObj.test_type = findTestType.Name;
                            testObj.download_url = test.Result_link1__c;
                            testObj.patient_name = findContact !== undefined ? findContact.Name : '' ;
                            testObj.patient_id = test.Patient__c;
                            
                            testResultArray.push(testObj);
                        }
                    }
                    resolve(testResultArray);
                }else{
                    resolve([]);
                }

            } catch (error) {
                console.log("error at fetchCABTestResultByPhoneNumberOrEmail=====>" + error)
                resolve(null);
            }
        });
    },

    updateTestTupeNumber: (test_tube_number, test_result_id, isCabTest) => {
        return new Promise(async (resolve, reject) => {
            try {
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve(null);
                }

                if(isCabTest === true){
                    await conn.sobject("CAB_Test_Result__c").update({
                        Id: test_result_id,
                        Tube_Number__c: test_tube_number
                    }, function (err, ret) {
                        if (err || !ret.success) { return console.error(err, ret); }
                        console.log('Updated Successfully : ' + ret.id);
                        // console.log(`Step 14`)
                        // ...
                    });
                } else {
                    await conn.sobject("Test_Result__c").update({
                        Id: test_result_id,
                        Tube_Number__c: test_tube_number
                    }, function (err, ret) {
                        if (err || !ret.success) { return console.error(err, ret); }
                        console.log('Updated Successfully : ' + ret.id);
                        // console.log(`Step 14`)
                        // ...
                    });
                }
                

                resolve("success");
            } catch (error) {
                console.log("error at updateTestTupeNumber=====>" + error)
                resolve(null);
            }
        })
    },

    fetchContactFromSalesforce: (phoneNumber, birthDate) => {
        return new Promise(async (resolve, reject) => {
            try {
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve(null);
                }
                

                let recordTypeQuery = await conn.query("SELECT Id, Name, Sex__c, Phone_number_text__c, Birthdate, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE Phone_number_text__c LIKE '%" + phoneNumber + "' AND Birthdate = "+birthDate+" ");
                console.log(`RE --> ${JSON.stringify(recordTypeQuery)}`)
                resolve(recordTypeQuery);

            } catch (error) {
                console.log("Error at fetchContactFromSalesforce=====>" + error)
                resolve(null);
            }
        });
    },

    fetchContactFromSalesforceUsingEmail: (email, birthDate) => {
        return new Promise(async (resolve, reject) => {
            try {
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve(null);
                }

                let recordTypeQuery = await conn.query("SELECT Id, Name, Sex__c, Phone_number_text__c, MobilePhone, Birthdate, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE Email LIKE '" + email + "' AND Birthdate = "+birthDate+" ");
                resolve(recordTypeQuery);

            } catch (error) {
                console.log("Error at fetchContactFromSalesforceUsingEmail=====>" + error)
                resolve(null);
            }
        });
    },

    fetchContactFromSalesforceById: (contactId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve(null);
                }

                let recordTypeQuery = await conn.query("SELECT Id, Name, Sex__c, Phone_number_text__c, MobilePhone, Birthdate, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE Id = '" + contactId + "'");
                resolve(recordTypeQuery);

            } catch (error) {
                console.log("Error at fetchContactFromSalesforce=====>" + error)
                resolve(null);
            }
        });
    },

    updateQRCodeInContact: (currentRecordId, QRCode)=> {
        return new Promise(async (resolve, reject)=> {
            try {
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve(null);
                }

                await conn.sobject("Contact").update({
                    Id: currentRecordId, 
                    QR_Code__c: QRCode
                }, function(err, ret) {
                    if (err || !ret.success) { return console.error(err, ret); }
                    console.log('Updated Successfully : ' + ret.id);
                    
                });

                resolve("success");
            } catch (error) {
                
            }
        });
    },
    fetchEmptyTestTubeRecords: (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                if(id === null){
                    resolve([]);
                }
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve([]);
                }
                let testtypes = await conn.query("SELECT Id, Name FROM Test_Type__c");

                if (testtypes.records.length === 0) {
                    resolve([]);
                }

                let testResults = await conn.query("SELECT Id, Name, Status__c, Tube_Number__c, Result_Date_Sent__c, Result_Sent_Date__c, Collection_Date__c, Pre_registration_Date__c, CreatedDate, Result__c, Test_Type__c,Patient__c FROM Test_Result__c WHERE Patient__c = '" + id + "'")

                let cabTestResults = await conn.query("SELECT Id, Name, Tube_Number__c, Test_Type_Name2__c, Status__c, Result_Date_Sent__c, Result_Sent_Date__c, Collection_Date__c, Test_Type__c, COVID__c, Flu_A__c, Flu_B__c, Result_hyperlink__c, Patient__c, Result_link1__c, Pre_registration_Date__c FROM CAB_Test_Result__c WHERE Patient__c = '" + id + "'");

                if (testResults.records.length === 0 && cabTestResults.records.length === 0 ) {
                    resolve([]);
                }
                let findNotFilledTestTubeRecords = testResults.records.filter(x=> x.Tube_Number__c === null)
                let testResultArray = [];

                for (let test of findNotFilledTestTubeRecords) {
                    let findTestType = testtypes.records.find(x => x.Id === test.Test_Type__c);
                    if (findTestType !== undefined) {
                        let testObj = {}
                        testObj.test_result_id = test.Id;
                        testObj.test_name = test.Name;
                        testObj.status = test.Status__c;
                        testObj.collection_date = test.Collection_Date__c;
                        testObj.registeration_date = test.Pre_registration_Date__c;
                        testObj.test_type = findTestType.Name;
                        testObj.isCabTest = false;
                        testResultArray.push(testObj);
                    }
                }

                let findNotFilledCabTestTubeRecords = cabTestResults.records.filter(x=> x.Tube_Number__c === null)
                for (let test of findNotFilledCabTestTubeRecords) {
                    let findTestType = testtypes.records.find(x => x.Id === test.Test_Type__c);
                    if (findTestType !== undefined) {
                        let testObj = {}
                        testObj.test_result_id = test.Id;
                        testObj.test_name = test.Name;
                        testObj.status = test.Status__c;
                        testObj.collection_date = test.Collection_Date__c;
                        testObj.registeration_date = test.Pre_registration_Date__c;
                        testObj.test_type = findTestType.Name;
                        testObj.isCabTest = true;
                        testResultArray.push(testObj);
                    }
                }
                resolve(testResultArray);
            } catch (error) {
                console.log("error at fetchTestResultByContactId=====>" + error)
                resolve(null);
            }
        })
    },
    updateCurrentContact: ()=> {
        return new Promise(async (resolve, reject) => {
            try {
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve([]);
                }

                // let result = await conn.sobject("Contact").update({
                //     Id: '003q000001D2e0XAAR',
                //     FirstName: "Purusoth",
                //     LastName: "Madhavan",
                //     MailingStreet: 'No.28/60, periar salai, annai sathya nagar',
                //     MailingCity: 'Chennai',
                //     MailingState: 'Tamilnadu',
                //     MailingCountry: 'India',
                //     MailingPostalCode: '60001'
                // }, function (err, ret) {
                //     if (err || !ret.success) { return console.error(err, ret); }
                //     console.log('Updated Successfully : ' + ret.id);
                //     // console.log(`Step 14`)
                //     // ...
                // });

                let result = await conn.query("SELECT Id, Name, FirstName, LastName, Sex__c, Phone_number_text__c, MobilePhone, Birthdate, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE CreatedDate  >=  LAST_N_DAYS:2");

                resolve(result);
            } catch (error) {
                console.log("error at updateCurrentContact=====>" + error)
                resolve(null);
            }
        });
    },
    
    updateSMSsent: (test_result_id) => {
        return new Promise(async (resolve, reject) => {
            try {
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve(null);
                }

                await conn.sobject("Test_Result__c").update({
                    Id: test_result_id,
                    Status__c: 'Result Sent'
                }, function (err, ret) {
                    if (err || !ret.success) { return console.error(err, ret); }
                    console.log('Updated Successfully : ' + ret.id);
                    // console.log(`Step 14`)
                    // ...
                });
                resolve("success");
            } catch (error) {
                console.log("error at updateSMSsent=====>" + error)
                resolve(null);
            }
        })
    },

    bulkSMSsent: (testResultArray) => {
        return new Promise(async (resolve, reject) => {
            try {
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve(null);
                }

                await conn.sobject("Test_Result__c").update(testResultArray, function (err, rets) {
                    if (err) { return console.error(err); }
                    console.log('Bulk SMS - Updated Successfully : ' + JSON.stringify(rets));
                    // console.log(`Step 14`)
                    // ...
                });
                resolve("success");
            } catch (error) {
                console.log("error at bulkSMSsent=====>" + error)
                resolve(null);
            }
        })
    },

    testPRL: () => {
        return new Promise(async (resolve, reject) => {
            try {
                // console.log(`Array ==> ${JSON.stringify(testResultArray)}\n`)
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve(null);
                }

                let arr = [{
                    "tube_number": "LV5003013972",
                    "result": "Negative"
                }]

                let tubeNumbers = _.pluck('tube_number');
                let records = [];

                // let salesforceTestResultRecord = await conn.query("SELECT Id, Tube_Number__c, LastModifiedDate, CreatedDate FROM Test_Result__c WHERE LastModifiedDate = LAST_N_DAYS:1  ORDER BY CreatedDate");
                // let salesforceTestResultRecord = await conn.query("SELECT Id, Tube_Number__c, LastModifiedDate, CreatedDate FROM Test_Result__c WHERE Tube_Number__c = 'LV5003013972' ");
                let salesforceTestResultRecord = await conn.query("SELECT Id, Tube_Number__c, LastModifiedDate, CreatedDate, Collection_Date__c FROM Test_Result__c WHERE LastModifiedDate = LAST_N_DAYS:4 AND Tube_Number__c IN ('LV5003013972')");
                // let salesforceTestResultRecord = await conn.query("SELECT Id, Tube_Number__c, LastModifiedDate, CreatedDate, Collection_Date__c FROM Test_Result__c WHERE Tube_Number__c IN ('LV5003013972')").on("record", function(record) {
                //     records.push(record);
                //   })
                //   .on("end", function() {
                //     console.log("total in database : " + salesforceTestResultRecord.totalSize+'----'+records.length);
                //     console.log("total fetched : " + salesforceTestResultRecord.totalFetched);
                //   })
                //   .on("error", function(err) {
                //     console.error(err);
                //   })
                //   .run({ autoFetch : true, maxFetch : 20000 });

                resolve(salesforceTestResultRecord);
            }catch(e){
                resolve(null);
            }
        });
    },

    updatePRLReport: (testResultArray)=> {
        return new Promise(async (resolve, reject) => {
            try {
                // console.log(`Array ==> ${JSON.stringify(testResultArray)}\n`)
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve(null);
                }

                if(testResultArray.length > 0){
                    let pluckTubeNumbers = _.pluck(testResultArray, 'tube_number');
                    let tubeNumbers = pluckTubeNumbers.join('\',\'');

                    // let salesforceTestResultRecord = await conn.query("SELECT Id, Tube_Number__c FROM Test_Result__c WHERE CreatedDate  >=  LAST_N_DAYS:5");
                    let salesforceTestResultRecord = await conn.query("SELECT Id, Tube_Number__c, LastModifiedDate, CreatedDate, Collection_Date__c FROM Test_Result__c WHERE LastModifiedDate = LAST_N_DAYS:6 AND Tube_Number__c IN ('"+tubeNumbers+"')");
                    // let salesforceTestResultRecord = await conn.query("SELECT Id, Tube_Number__c FROM Test_Result__c WHERE LastModifiedDate  >=  LAST_N_DAYS:5");
                    console.log(`salesforceTestResultRecord ==> ${salesforceTestResultRecord !== null ? salesforceTestResultRecord.totalSize : 'Not found' }`)
                    if(salesforceTestResultRecord !== null && salesforceTestResultRecord.totalSize > 0 ){
                        let lastModifiedTestResults = salesforceTestResultRecord.records;
                        let constructResultsToUpdate = [];

                        for(let testResult of testResultArray){
                            let findTestResult = await lastModifiedTestResults.find(result => result.Tube_Number__c === testResult.tube_number);

                            if(findTestResult !== undefined){
                                let constructTestResultObj = {};
                                constructTestResultObj.Id = findTestResult.Id;
                                constructTestResultObj.Status__c = 'Result Available';
                                constructTestResultObj.Result__c = testResult.result;
                                constructTestResultObj.Lab__c = 'Pandemic Response Lab';
                                constructResultsToUpdate.push(constructTestResultObj);
                            }
                        }

                        console.log(`constructResultsToUpdate ==> ${JSON.stringify(constructResultsToUpdate)}`)
                        let createChunk = _.chunk(constructResultsToUpdate, 50);
                        for(let resultsToUpdateChunk of createChunk){
                            await conn.sobject("Test_Result__c").update(resultsToUpdateChunk, function (err, rets) {
                                if (err) { return console.error(err); }
        
                                console.log('SFTP - Bulk Test Result - Updated Successfully : ' + JSON.stringify(rets));
                                // console.log(`Step 14`)
                                // ...
                            });
                        }
                    }
                }
                
                
                /*
                for(let testResult of testResultArray){
                    // console.log(`TestResult ==> ${JSON.stringify(testResult)} \n`);

                    let salesforceTestResultRecord = await conn.query("SELECT Id, Tube_Number__c FROM Test_Result__c WHERE Tube_Number__c = '" + testResult.tube_number + "' AND CreatedDate  >=  LAST_N_DAYS:10");
                    // console.log(`SalesForce Record ===> ${JSON.stringify(salesforceTestResultRecord)}`)

                    if(salesforceTestResultRecord.totalSize > 0){
                        let salesforceRecordId = salesforceTestResultRecord.records[0].Id;

                        await conn.sobject("Test_Result__c").update({
                            Id: salesforceRecordId,
                            //Tube_Number__c: testResult.tube_number,
                            Status__c: 'Result Available',
                            Result__c: testResult.result
                        }, function (err, ret) {
                            if (err || !ret.success) { return console.error(err, ret); }
                            console.log('Updated Successfully : ' + ret.id);
                            // console.log(`Step 14`)
                            // ...
                        });
                    }                    
                }
                */
                resolve("Done");

            } catch (error) {
                console.log("error at updatePRLReport=====>" + error)
                resolve(null);
            }
        });
    },

    fetchQueryResult: ()=> {
        return new Promise(async (resolve, reject) => {
            try {
                let login = await module.exports.loginSalesforce();

                if (login === null) {
                    resolve([]);
                }

                // let result = await conn.query("SELECT Id, Name, FirstName, LastName, Sex__c, Phone_number_text__c, MobilePhone, Birthdate, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE CreatedDate  >=  LAST_N_DAYS:2");

                let result = await conn.query("SELECT Id, Name, FirstName, LastName, Sex__c, Phone_number_text__c, MobilePhone, Birthdate, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c FROM Contact WHERE Name LIKE '%Thomas%'");

                // let result = await conn.query("SELECT Id, Name, FirstName, LastName, Sex__c, Phone_number_text__c, MobilePhone, Birthdate, Email, MailingAddress, Zip_Code__c, HealthCloudGA__Age__c, Passport_Number__c, SSN__c, Driver_s_License_or_Passport_Number__c, Ethnicity__c, Race__c, QR_Code__c, (SELECT Id, Name, Status__c, Result_Date_Sent__c, Result_Sent_Date__c, Collection_Date__c, Pre_registration_Date__c, CreatedDate, Result__c, Test_Type__c, Patient__c FROM Contact.Test_Results__r) FROM Contact")
                resolve(result);
            } catch (error) {
                console.log("error at updateCurrentContact=====>" + error)
                resolve(null);
            }
        });
    }

}