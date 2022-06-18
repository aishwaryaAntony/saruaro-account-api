import db from "../models";
import cryptoJs from "./crypto";
import crypto from "crypto";
import { updateQRCodeInContact, fetchContactFromSalesforceById } from "./salesForceUtils";
const OTP_LENGTH = 6;
module.exports = {
    /**
    * Create verification code and return the code
    */
    createVerificationCode: async () => {
        let code = "";
        while (true) {
            code = crypto
                .randomBytes(Math.ceil(OTP_LENGTH / 2))
                .toString("hex");
            code = parseInt(code, 16)
                .toString()
                .slice(0, OTP_LENGTH);
            let isExist = await db.User.findOne({
                where: {
                    verification_code: code
                }
            });
            if (isExist === null) {
                break;
            }
        }
        return code;
    },
    /**
      * Create QR code
    */
    createRandomString: async () => {
        return new Promise(async (resolve, reject) => {
            var result = '';
            var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            var charactersLength = characters.length;
            for (var i = 0; i < 7; i++) {
                result += characters.charAt(Math.floor(Math.random() * charactersLength));
            }
            resolve(result)
        })
    },
     /**
    * Create new QR code
    */
      createQrCode: async () => {
        let code = "";
        while (true) {
            code = await module.exports.createRandomString();
            let isExist = await db.UserProfile.findOne({
                where: {
                    qr_code: code
                }
            });
            if (isExist === null) {
                break;
            }
        }
        return code;
    },
    /**
    * Create new user account
    */
    createNewUser: async (data, role, contact) => {
        return new Promise(async (resolve, reject) => {
            try {
                let { first_name, last_name, gender, country_code, phone_number, email, birth_date, race, ethnicity,
                    driver_license_number, passport_number, ssn, address_line1, address_line2, city, state, country, zipcode,
                    policy_number, insurance_provider, policy_group_number, provider_phone_number, front_insurance_card_image, back_insurance_card_image,
                    street_address_line1, street_address_line2, provider_city, provider_state, provider_zipcode } = data;

                let resultObj = {};
                let hashed_user_id = null;
                let user_profile_id = null;
                let new_user_profile = null;

                let findRole = await db.Role.findOne({
                    where: {
                        code: role
                    }
                });
                // console.log("findRole=============>"+JSON.stringify(findRole))
                if (findRole === null) {
                    resultObj.message = "Invalid Role";
                    resultObj.payload = null;
                    resolve(resultObj)
                }

                let hashed_country_code = await cryptoJs.hash_from_string(country_code);

                let hashed_phone_number = await cryptoJs.hash_from_string(phone_number);

                let findUser = await db.User.findOne({
                    where: {
                        country_code: hashed_country_code,
                        hashed_phone_number: hashed_phone_number
                    }
                });
                // console.log("findUser=============>"+JSON.stringify(findUser))
                if (findUser === null) {
                    let new_user = await db.User.create({
                        country_code: hashed_country_code,
                        hashed_phone_number: hashed_phone_number,
                        preferred_login_type: email !== null ? 'EM' : 'PN',
                        internal_user: false,
                        status: "ACTIVE"
                    });

                    hashed_user_id = await cryptoJs.hash_from_string(new_user.id);
                } else {
                    hashed_user_id = await cryptoJs.hash_from_string(findUser.id);
                }
                // console.log("hashed_user_id=============>"+hashed_user_id)
                let findUserProfile = await db.UserProfile.findOne({
                    where: {
                        hashed_user_id: hashed_user_id
                    }
                });
                // console.log("findUserProfile=============>"+JSON.stringify(findUserProfile))
                let newQRCode = await module.exports.createQrCode();
                let fetchContact = await fetchContactFromSalesforceById(contact.Id);


                if (findUserProfile === null) {
                    let encrypt_country_code = await cryptoJs.encrypt(country_code);
                    let encrypt_phone_number = await cryptoJs.encrypt(phone_number);

                    // let fetchContact = await fetchContactFromSalesforceById(contact.Id);
                    
                    new_user_profile = await db.UserProfile.create({
                        hashed_user_id,
                        contact_id: contact.Id,
                        first_name,
                        middle_name:null,
                        last_name,
                        gender,
                        country_code: encrypt_country_code,
                        hashed_phone_number: encrypt_phone_number,
                        email,
                        birth_date,
                        race,
                        ethnicity,
                        driver_license_number,
                        passport_number,
                        ssn,
                        address_line1,
                        address_line2,
                        city,
                        state,
                        country,
                        zipcode,
                        qr_code: newQRCode,
                        status: "ACTIVE"
                    });

                    if(fetchContact.totalSize > 0){
                        if(fetchContact.records[0].QR_Code__c === null) {
                            await updateQRCodeInContact(fetchContact.records[0].Id, newQRCode);
                        }
                    }
                    
                    
                    user_profile_id = new_user_profile.id
                } else {
                    new_user_profile = findUserProfile;
                    user_profile_id = findUserProfile.id;
                    if(fetchContact.totalSize > 0){
                        if(fetchContact.records[0].QR_Code__c === null) {
                            await updateQRCodeInContact(fetchContact.records[0].Id, newQRCode);
                        }
                    }
                }
                // console.log("user_profile_id=============>"+user_profile_id)
                let findUserRole = await db.UserRole.findOne({
                    where: {
                        role_id: findRole.id,
                        user_profile_id: user_profile_id
                    }
                });
                // console.log("findUserRole=============>"+JSON.stringify(findUserRole))
                if (findUserRole === null) {
                    await db.UserRole.create({
                        role_id: findRole.id,
                        user_profile_id: user_profile_id,
                        is_default: true,
                        status: "ACTIVE"
                    });
                }
                if(policy_number !== null && policy_number !== undefined){
                    let findUserInsurance = await db.UserInsurance.findOne({
                        where: {
                            policy_number: policy_number
                        }
                    });
    
                    if (findUserInsurance === null) {
                        await db.UserInsurance.create({
                            user_profile_id: user_profile_id,
                            insurance_provider,
                            policy_group_number,
                            provider_phone_number,
                            front_insurance_card_image,
                            back_insurance_card_image,
                            street_address_line1,
                            street_address_line2,
                            city: provider_city,
                            state: provider_state,
                            zipcode: provider_zipcode,
                            status: "ACTIVE"
                        });
                    }
                }
                
                resolve(new_user_profile)
            } catch (error) {
                console.log("error=============>"+error)
                reject(error)
            }
        })
    },

    createAccountInLocalUsingEmail: (recordFromSalesforce, body) => {
        return new Promise(async (resolve, reject) => {
            try {
                // let { country_code, phone } = body;
                let { email } = body;
                let country_code = '+1';
                let phone = recordFromSalesforce.Phone_number_text__c;

                let id = recordFromSalesforce.Id;
                let fetchUserProfile = await db.UserProfile.findOne({
                    where: {
                        contact_id: id
                    }
                });

                let hashed_country_code = await cryptoJs.hash_from_string(country_code);
                let hashed_phone_number = await cryptoJs.hash_from_string(phone);
                let hashed_email = await cryptoJs.hash_from_string(email);

                if(fetchUserProfile === null){
                    
                    let new_user = await db.User.create({
                        country_code: hashed_country_code,
                        hashed_phone_number: hashed_phone_number,
                        email: hashed_email,
                        preferred_login_type: 'EM',
                        internal_user: true,
                        status: "ACTIVE"
                    });

                    let encrypt_country_code = await cryptoJs.encrypt(country_code);
                    let encrypt_phone_number = await cryptoJs.encrypt(phone);
                    let hashed_user_id = await cryptoJs.hash_from_string(new_user.id);
                    let newQRCode = recordFromSalesforce.QR_Code__c !== null ? recordFromSalesforce.QR_Code__c : await module.exports.createQrCode();
                    let findName = recordFromSalesforce.Name !== null ? recordFromSalesforce.Name : "";
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
                    
                    let new_user_profile = await db.UserProfile.create({
                        hashed_user_id,
                        contact_id: id,
                        first_name: firstName,
                        middle_name: null,
                        last_name: lastName,
                        gender: recordFromSalesforce.Sex__c,
                        country_code: encrypt_country_code,
                        hashed_phone_number: encrypt_phone_number,
                        email: recordFromSalesforce.Email,
                        birth_date: recordFromSalesforce.Birthdate,
                        race: recordFromSalesforce.Race__c,
                        ethnicity: recordFromSalesforce.Ethnicity__c,
                        driver_license_number: recordFromSalesforce.Driver_s_License_or_Passport_Number__c,
                        passport_number: recordFromSalesforce.Passport_Number__c,
                        ssn: recordFromSalesforce.SSN__c,
                        address_line1: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.street : null,
                        // address_line2: recordFromSalesforce.Patient_Address_Line_2__c,
                        city: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.city : null,
                        state: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.state : null,
                        country: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.country : null,
                        zipcode: recordFromSalesforce.Zip_Code__c,
                        qr_code: newQRCode,
                        status: "ACTIVE"
                    });

                    if(recordFromSalesforce.QR_Code__c === null) {
                        await updateQRCodeInContact(id, newQRCode);
                    }

                    let findRole = await db.Role.findOne({
                        where: {
                            code: 'CSR'
                        }
                    });

                    await db.UserRole.create({
                        role_id: findRole.id,
                        user_profile_id: new_user_profile.id,
                        is_default: true,
                        status: "ACTIVE"
                    });

                    resolve(new_user);

                }else{

                    //Need to find the user as it had not matched in the user but matched in user profile
                    let fetchAllUsers = await db.User.findAll({});
                    let findUser = null;
                    for(let user of fetchAllUsers){
                        let hashed_user_id = await cryptoJs.hash_from_string(user.id);
                        let fetchProfile = await db.UserProfile.findOne({
                            where: {
                                id: fetchUserProfile.id,
                                hashed_user_id: hashed_user_id
                            }
                        });

                        if(fetchProfile !== null){
                            findUser = user;

                            await db.User.update({
                                country_code: hashed_country_code,
                                hashed_phone_number: hashed_phone_number,
                                email: hashed_email
                            },{
                                where: {
                                    id: user.id
                                }
                            });

                            break;
                        }
                    }
                    
                    resolve(findUser);
                }

            } catch (error) {
                reject(error);
            }
        });
    },

    createAccountInLocal: (recordFromSalesforce, body) => {
        return new Promise(async (resolve, reject) => {
            try {
                let { country_code, phone } = body;
                let id = recordFromSalesforce.Id;
                let fetchUserProfile = await db.UserProfile.findOne({
                    where: {
                        contact_id: id
                    }
                });

                let hashed_country_code = await cryptoJs.hash_from_string(country_code);
                let hashed_phone_number = await cryptoJs.hash_from_string(phone);


                if(fetchUserProfile === null){
                    
                    let new_user = await db.User.create({
                        country_code: hashed_country_code,
                        hashed_phone_number: hashed_phone_number,
                        preferred_login_type: 'PN',
                        internal_user: true,
                        status: "ACTIVE"
                    });

                    let encrypt_country_code = await cryptoJs.encrypt(country_code);
                    let encrypt_phone_number = await cryptoJs.encrypt(phone);
                    let hashed_user_id = await cryptoJs.hash_from_string(new_user.id);
                    let newQRCode = recordFromSalesforce.QR_Code__c !== null ? recordFromSalesforce.QR_Code__c : await module.exports.createQrCode();
                    let findName = recordFromSalesforce.Name !== null ? recordFromSalesforce.Name : "";
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
                    
                    let new_user_profile = await db.UserProfile.create({
                        hashed_user_id,
                        contact_id: id,
                        first_name: firstName,
                        middle_name: null,
                        last_name: lastName,
                        gender: recordFromSalesforce.Sex__c,
                        country_code: encrypt_country_code,
                        hashed_phone_number: encrypt_phone_number,
                        email: recordFromSalesforce.Email,
                        birth_date: recordFromSalesforce.Birthdate,
                        race: recordFromSalesforce.Race__c,
                        ethnicity: recordFromSalesforce.Ethnicity__c,
                        driver_license_number: recordFromSalesforce.Driver_s_License_or_Passport_Number__c,
                        passport_number: recordFromSalesforce.Passport_Number__c,
                        ssn: recordFromSalesforce.SSN__c,
                        address_line1: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.street : null,
                        // address_line2: recordFromSalesforce.Patient_Address_Line_2__c,
                        city: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.city : null,
                        state: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.state : null,
                        country: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.country : null,
                        zipcode: recordFromSalesforce.Zip_Code__c,
                        qr_code: newQRCode,
                        status: "ACTIVE"
                    });

                    if(recordFromSalesforce.QR_Code__c === null) {
                        await updateQRCodeInContact(id, newQRCode);
                    }

                    let findRole = await db.Role.findOne({
                        where: {
                            code: 'CSR'
                        }
                    });

                    await db.UserRole.create({
                        role_id: findRole.id,
                        user_profile_id: new_user_profile.id,
                        is_default: true,
                        status: "ACTIVE"
                    });

                    resolve(new_user);

                }else{

                    //Need to find the user as it had not matched in the user but matched in user profile
                    let fetchAllUsers = await db.User.findAll({});
                    let findUser = null;
                    for(let user of fetchAllUsers){
                        let hashed_user_id = await cryptoJs.hash_from_string(user.id);
                        let fetchProfile = await db.UserProfile.findOne({
                            where: {
                                id: fetchUserProfile.id,
                                hashed_user_id: hashed_user_id
                            }
                        });

                        if(fetchProfile !== null){
                            findUser = user;

                            await db.User.update({
                                country_code: hashed_country_code,
                                hashed_phone_number: hashed_phone_number
                            },{
                                where: {
                                    id: user.id
                                }
                            });

                            break;
                        }
                    }
                    
                    resolve(findUser);
                }

            } catch (error) {
                reject(error);
            }
        });
    },

    createUserProfileInLocal: (recordFromSalesforce, body, userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let { email, country_code, phone } = body;
                let current_country_code = country_code !== undefined ? country_code : '+1';
                let current_phone = phone !== undefined ? phone : recordFromSalesforce.Phone_number_text__c;

                let id = recordFromSalesforce.Id;
                let fetchUserProfile = await db.UserProfile.findOne({
                    where: {
                        contact_id: id
                    }
                });

                let hashed_country_code = await cryptoJs.hash_from_string(country_code);
                let hashed_phone_number = await cryptoJs.hash_from_string(phone);
                // let hashed_email = await cryptoJs.hash_from_string(email);

                if(fetchUserProfile === null){
                    let encrypt_country_code = await cryptoJs.encrypt(current_country_code);
                    let encrypt_phone_number = await cryptoJs.encrypt(current_phone);
                    let hashed_user_id = await cryptoJs.hash_from_string(userId);
                    let newQRCode = recordFromSalesforce.QR_Code__c !== null ? recordFromSalesforce.QR_Code__c : await module.exports.createQrCode();
                    let findName = recordFromSalesforce.Name !== null ? recordFromSalesforce.Name : "";
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
                    
                    let new_user_profile = await db.UserProfile.create({
                        hashed_user_id,
                        contact_id: id,
                        first_name: firstName,
                        middle_name: null,
                        last_name: lastName,
                        gender: recordFromSalesforce.Sex__c,
                        country_code: encrypt_country_code,
                        hashed_phone_number: encrypt_phone_number,
                        email: recordFromSalesforce.Email,
                        birth_date: recordFromSalesforce.Birthdate,
                        race: recordFromSalesforce.Race__c,
                        ethnicity: recordFromSalesforce.Ethnicity__c,
                        driver_license_number: recordFromSalesforce.Driver_s_License_or_Passport_Number__c,
                        passport_number: recordFromSalesforce.Passport_Number__c,
                        ssn: recordFromSalesforce.SSN__c,
                        address_line1: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.street : null,
                        // address_line2: recordFromSalesforce.Patient_Address_Line_2__c,
                        city: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.city : null,
                        state: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.state : null,
                        country: recordFromSalesforce.MailingAddress !== null ? recordFromSalesforce.MailingAddress.country : null,
                        zipcode: recordFromSalesforce.Zip_Code__c,
                        qr_code: newQRCode,
                        status: "ACTIVE"
                    });

                    if(recordFromSalesforce.QR_Code__c === null) {
                        await updateQRCodeInContact(id, newQRCode);
                    }

                    let findRole = await db.Role.findOne({
                        where: {
                            code: 'CSR'
                        }
                    });

                    await db.UserRole.create({
                        role_id: findRole.id,
                        user_profile_id: new_user_profile.id,
                        is_default: true,
                        status: "ACTIVE"
                    });


                    let fetchUser = await db.User.findOne({
                        where: {
                            id: userId
                        }
                    })

                    resolve(fetchUser);
                }else{
                    //Need to find the user as it had not matched in the user but matched in user profile
                    let fetchAllUsers = await db.User.findAll({});
                    let findUser = null;
                    for(let user of fetchAllUsers){
                        let hashed_user_id = await cryptoJs.hash_from_string(user.id);
                        let fetchProfile = await db.UserProfile.findOne({
                            where: {
                                id: fetchUserProfile.id,
                                hashed_user_id: hashed_user_id
                            }
                        });

                        if(fetchProfile !== null){
                            findUser = user;

                            await db.User.update({
                                country_code: hashed_country_code,
                                hashed_phone_number: hashed_phone_number
                            },{
                                where: {
                                    id: user.id
                                }
                            });

                            break;
                        }
                    }
                    
                    resolve(findUser);
                }
                
            } catch (error) {
                reject(error);
            }
        });
    }
}