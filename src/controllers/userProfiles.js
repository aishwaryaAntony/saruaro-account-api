import db from '../models';
import cryptoJs from "../helpers/crypto";
import { updateTestTupeNumber, fetchTestResultByContactId, fetchEmptyTestTubeRecords, findContactUsingQRCode } from "../helpers/salesForceUtils";
const { Op } = require("sequelize");
const Sequelize = require("sequelize");

exports.fetch_all_profile =  async (req, res, next) => {
    try{
        // let fetch_all_profiles = await db.UserProfile.findAll();
        let fetchAllUserProfiles = await db.UserProfile.findAll({
            include: [
                {
                    model: db.UserRole,
                    as: 'userRoles',
                    include: [
                        {
                            model: db.Role,
                            as: 'role',
                        }
                    ]
                }
            ]
        });       

        res.status(200).json({
            status: 'success',
            payload: fetchAllUserProfiles,
            message: 'User Profile fetched successfully'
        }); 

    }catch(error){
        console.log("Error at fetch user profile ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while User Profile",
        }); 
    }
}

exports.fetch_profile_by_qr =  async (req, res, next) => {
    try{
        let { qr_code } = req.params;

        let find_user_profile = await db.UserProfile.findOne({
            where:{
                qr_code: qr_code
            }
        });

        // if (find_user_profile === null) {
        //     return res.status(200).json({
        //         status: "failed",
        //         payload: null,
        //         message: "invalid Qr Code",
        //     });
        // }

        let userName = '';
        if (find_user_profile === null) {
            let fetchContact = await findContactUsingQRCode(qr_code);
            if (fetchContact.totalSize > 0) {
                userName = fetchContact.records[0].Name;
                let firstName = null;
                let lastName = null;

                let splitName = userName.split(" ");
                if(splitName.length > 0){
                    firstName = splitName[0];

                    lastName = splitName.reduce((accumulator, currentvalue, index) => {
                        if(index > 0){
                        accumulator = accumulator + " " + currentvalue
                        }
                        
                        return accumulator;
                    }, "" );
                }
                let constructUserProfile = {};
                constructUserProfile.contact_id = fetchContact.records[0].Id;
                constructUserProfile.first_name = firstName;
                constructUserProfile.last_name = lastName;
                constructUserProfile.email = fetchContact.records[0].Email;
                constructUserProfile.qr_code = fetchContact.records[0].QR_Code__c;
                constructUserProfile.birth_date = fetchContact.records[0].Birthdate;
                constructUserProfile.hashed_phone_number = fetchContact.records[0].Phone_number_text__c;
                find_user_profile = constructUserProfile;
            }else{
                return res.status(200).json({
                    status: "failed",
                    payload: null,
                    message: "invalid Qr Code",
                });
            }
        } else {
            userName = `${find_user_profile.first_name} ${find_user_profile.last_name}`;

            let decrypt_phone_number = await cryptoJs.decrypt(find_user_profile.hashed_phone_number);
            let decrypt_country_code = await cryptoJs.decrypt(find_user_profile.country_code);

            find_user_profile.hashed_phone_number = decrypt_phone_number;
            find_user_profile.country_code = decrypt_country_code;
        }
       

        // console.log("*******************"+JSON.stringify(find_user_profile))

        // let decrypt_phone_number = await cryptoJs.decrypt(find_user_profile.hashed_phone_number);
        // let decrypt_country_code = await cryptoJs.decrypt(find_user_profile.country_code);

        // find_user_profile.hashed_phone_number = decrypt_phone_number;
        // find_user_profile.country_code = decrypt_country_code;
        
        let fetchTestResult = await fetchEmptyTestTubeRecords(find_user_profile.contact_id);
        
        let result = {};
        result.profile = find_user_profile;
        result.test = fetchTestResult;
        // console.log("*******"+JSON.stringify(result))

        res.status(200).json({
            status: 'success',
            payload: result,
            message: 'User Profile fetched successfully'
        }); 

    }catch(error){
        console.log("Error at fetch user profile by qr ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while User Profile",
        }); 
    }
}

exports.update_qr_code =  async (req, res, next) => {
    try{
        let { qr_code } = req.params;
        
        let { test_tube_number, test_result_id, isCabTest } = req.body;

        let find_user_profile = await db.UserProfile.findOne({
            where:{
                qr_code: qr_code
            }
        });

        // if (find_user_profile === null) {
        //     return res.status(200).json({
        //         status: "failed",
        //         payload: null,
        //         message: "invalid Qr Code",
        //     });
        // }
        let test_result = await updateTestTupeNumber(test_tube_number, test_result_id, isCabTest);

        let userName = "";
        if (find_user_profile === null) {
            let fetchContact = await findContactUsingQRCode(qr_code);
            if (fetchContact.totalSize > 0) {
                userName = fetchContact.records[0].Name;
                let firstName = null;
                let lastName = null;

                let splitName = userName.split(" ");
                if(splitName.length > 0){
                    firstName = splitName[0];

                    lastName = splitName.reduce((accumulator, currentvalue, index) => {
                        if(index > 0){
                        accumulator = accumulator + " " + currentvalue
                        }
                        
                        return accumulator;
                    }, "" );
                }
                let constructUserProfile = {};
                constructUserProfile.contact_id = fetchContact.records[0].Id;
                constructUserProfile.first_name = firstName;
                constructUserProfile.last_name = lastName;
                constructUserProfile.email = fetchContact.records[0].Email;
                constructUserProfile.qr_code = fetchContact.records[0].QR_Code__c;
                constructUserProfile.birth_date = fetchContact.records[0].Birthdate;
                constructUserProfile.hashed_phone_number = fetchContact.records[0].Phone_number_text__c;
                find_user_profile = constructUserProfile;
            }else{
                return res.status(200).json({
                    status: "failed",
                    payload: null,
                    message: "invalid Qr Code",
                });
            }
        } else {
            userName = `${find_user_profile.first_name} ${find_user_profile.last_name}`;

            let decrypt_phone_number = await cryptoJs.decrypt(find_user_profile.hashed_phone_number);
            let decrypt_country_code = await cryptoJs.decrypt(find_user_profile.country_code);
            find_user_profile.hashed_phone_number = decrypt_phone_number;
            find_user_profile.country_code = decrypt_country_code;
        }

        // let decrypt_phone_number = await cryptoJs.decrypt(find_user_profile.hashed_phone_number);
        // let decrypt_country_code = await cryptoJs.decrypt(find_user_profile.country_code);
        // find_user_profile.hashed_phone_number = decrypt_phone_number;
        // find_user_profile.country_code = decrypt_country_code;
        
        let fetchTestResult = await fetchEmptyTestTubeRecords(find_user_profile.contact_id);
        
        let result = {};
        result.profile = find_user_profile;
        result.test = fetchTestResult;


        if (test_result === null) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "invalid User",
            });
        }

        res.status(200).json({
            status: 'success',
            payload: result,
            message: 'Test Tube updated successfully'
        });

    }catch(error){
        console.log("Error at fetch by id locations  ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while by id locations",
        }); 
    }
}

exports.fetch_all_internal_profile =  async (req, res, next) => {
    try{
        let fetchAllUserProfiles = await db.UserProfile.findAll({
            include: [
                {
                    model: db.UserRole,
                    as: 'userRoles',
                    required: true,
                    include: [
                        {
                            model: db.Role,
                            as: 'role',
                            required: true,
                            where:{
                                code: {
                                    [Op.ne]: "CSR"
                                }
                            }
                        }
                    ]
                }
            ]
        });       

        res.status(200).json({
            status: 'success',
            payload: fetchAllUserProfiles,
            message: 'User Profile fetched successfully'
        }); 

    }catch(error){
        console.log("Error at fetch user profile ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while User Profile",
        }); 
    }
}