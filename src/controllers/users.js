import db from '../models';
import jwt from "jsonwebtoken";
import { JWT_PRIVATE_KEY, NODE_ENV, CLIENT_DOMAIN } from "../helpers/constants";
import cryptoJs from "../helpers/crypto";
import { createVerificationCode, createAccountInLocal, createQrCode, createAccountInLocalUsingEmail, createUserProfileInLocal } from "../helpers/accounts";
import { fetchContactFromSalesforce, fetchContactFromSalesforceUsingEmail } from "../helpers/salesForceUtils";
import SMSUtils from "../helpers/smsUtils";
import QRCode from "qrcode";
import { PassThrough } from "stream";
import { send_mail, send_email_with_attachment } from "../helpers/emailUtils";
import { createAndSendQRCode } from "../helpers/qrCodeUtils";
import { createSessionForPayment } from "../helpers/stripeServices";
import moment from "moment";
const path = require("path");
const bcrypt = require('bcryptjs');
const fs = require('fs');
const { Op } = require("sequelize");
const Sequelize = require("sequelize");

exports.login = async (req, res, next) => {
    try {
        let { country_code, phone, email, login_type, date_of_birth } = req.body;

        // User logged in using Email
        if (login_type === 'EM') {
            let hashed_email = await cryptoJs.hash_from_string(email);
            let findUserByEmail = await db.User.findOne({
                where: {
                    email: hashed_email
                }
            });

            let userName = '';

            if (findUserByEmail === null) {
                let fetchMatchedRecord = await fetchContactFromSalesforceUsingEmail(email, date_of_birth);
                if (fetchMatchedRecord.totalSize === 0) {
                    return res.status(200).json({
                        status: "failed",
                        payload: null,
                        message: "Invalid Email",
                    });
                }

                findUserByEmail = await createAccountInLocalUsingEmail(fetchMatchedRecord.records[0], req.body);
                userName = fetchMatchedRecord.records[0].Name;
            } else {
                let hashed_user_id = await cryptoJs.hash_from_string(findUserByEmail.id);

                // added date of birth
                let fetchUserProfile = await db.UserProfile.findOne({
                    where: {
                        // hashed_user_id: hashed_user_id,
                        [Op.and]: [
                            Sequelize.where(Sequelize.fn('date', Sequelize.col('birth_date')), '=', date_of_birth),
                            { hashed_user_id: hashed_user_id }
                        ]
                    }
                });

                if(fetchUserProfile === null){
                    let fetchMatchedUserProfileRecord = await fetchContactFromSalesforceUsingEmail(email, date_of_birth);
                    if (fetchMatchedUserProfileRecord.totalSize === 0) {
                        return res.status(200).json({
                            status: "failed",
                            payload: null,
                            message: "Invalid Email",
                        });
                    }

                    findUserByEmail = await createUserProfileInLocal(fetchMatchedUserProfileRecord.records[0], req.body, findUserByEmail.id);
                    userName = fetchMatchedUserProfileRecord.records[0].Name;
                }

                console.log(`FetchUserProfile ---> ${JSON.stringify(fetchUserProfile)}`)
                userName = `${fetchUserProfile.first_name} ${fetchUserProfile.last_name !== null ? fetchUserProfile.last_name : ''}`
            }

            let emailOtp = NODE_ENV === "development" ? "000000" : await createVerificationCode();
            // let message = "Hi, Please use the verification code to login - " + emailOtp + ".";
            let data = {};
            data.verification_code = emailOtp;
            send_mail('OTP', email, userName, data);

            await db.User.update({
                verification_code: emailOtp
            }, {
                where: {
                    id: findUserByEmail.id
                }
            })

            res.status(200).json({
                status: 'success',
                payload: null,
                message: 'OTP generated successfully'
            });

        } else {
            let hashed_phone_number = await cryptoJs.hash_from_string(phone);
            let hashed_country_code = await cryptoJs.hash_from_string(country_code);

            let findUser = await db.User.findOne({
                where: {
                    country_code: hashed_country_code,
                    hashed_phone_number: hashed_phone_number
                }
            })

            if (findUser === null) {
                // console.log(`Enters 2`)
                let matchedRecordFromSalesforce = await fetchContactFromSalesforce(phone, date_of_birth);
                // console.log(`Matched --> ${JSON.stringify(matchedRecordFromSalesforce)}`)
                if (matchedRecordFromSalesforce.totalSize === 0) {
                    return res.status(200).json({
                        status: "failed",
                        payload: null,
                        message: "Invalid Phone Number",
                    });
                }

                findUser = await createAccountInLocal(matchedRecordFromSalesforce.records[0], req.body);

            }else{
                // console.log(`Enters 2`)
                let hashed_user_id1 = await cryptoJs.hash_from_string(findUser.id);

                // added date of birth
                let fetchUserProfile1 = await db.UserProfile.findOne({
                    where: {
                        // hashed_user_id: hashed_user_id,
                        [Op.and]: [
                            Sequelize.where(Sequelize.fn('date', Sequelize.col('birth_date')), '=', date_of_birth),
                            { hashed_user_id: hashed_user_id1 }
                        ]
                    }
                });

                if(fetchUserProfile1 === null){
                    let fetchMatchedUserProfileRecord1 = await fetchContactFromSalesforce(phone, date_of_birth);
                    if (fetchMatchedUserProfileRecord1.totalSize === 0) {
                        return res.status(200).json({
                            status: "failed",
                            payload: null,
                            message: "Invalid phone number",
                        });
                    }

                    await createUserProfileInLocal(fetchMatchedUserProfileRecord1.records[0], req.body, findUser.id);
                }
            }

            let otp = NODE_ENV === "development" ? "000000" : await createVerificationCode();
            let message = "Hi, Please use the verification code to login - " + otp + ".";
            let phone_number = `${country_code}${phone}`;
            SMSUtils.sendSms(phone_number, message);

            await db.User.update({
                verification_code: otp
            }, {
                where: {
                    id: findUser.id
                }
            })

            res.status(200).json({
                status: 'success',
                payload: null,
                message: 'OTP generated successfully'
            });
        }


    } catch (error) {
        console.log("Error at login ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while login",
        });
    }
};


exports.resend_verification_code = async (req, res, next) => {
    try {
        let { country_code, phone, email, login_type } = req.body;

        // User logged in using Email
        if (login_type === 'EM') {
            let hashed_email = await cryptoJs.hash_from_string(email);
            let findUserByEmail = await db.User.findOne({
                where: {
                    email: hashed_email
                }
            });

            let userName = '';

            if (findUserByEmail !== null) {

                let hashed_user_id = await cryptoJs.hash_from_string(findUserByEmail.id);

                let fetchUserProfile = await db.UserProfile.findOne({
                    where: {
                        hashed_user_id: hashed_user_id,
                    }
                });
                userName = `${fetchUserProfile.first_name} ${fetchUserProfile.last_name !== null ? fetchUserProfile.last_name : ''}`
                let emailOtp = NODE_ENV === "development" ? "000000" : await createVerificationCode();
                let data = {};
                data.verification_code = emailOtp;
                send_mail('OTP', email, userName, data);

                await db.User.update({
                    verification_code: emailOtp
                }, {
                    where: {
                        id: findUserByEmail.id
                    }
                })

            }



            res.status(200).json({
                status: 'success',
                payload: null,
                message: 'OTP generated successfully'
            });

        } else {
            let hashed_phone_number = await cryptoJs.hash_from_string(phone);
            let hashed_country_code = await cryptoJs.hash_from_string(country_code);

            let findUser = await db.User.findOne({
                where: {
                    country_code: hashed_country_code,
                    hashed_phone_number: hashed_phone_number
                }
            })
            if (findUser !== null) {
                let otp = NODE_ENV === "development" ? "000000" : await createVerificationCode();
                let message = "Hi, Please use the verification code to login - " + otp + ".";
                let phone_number = `${country_code}${phone}`;
                SMSUtils.sendSms(phone_number, message);

                await db.User.update({
                    verification_code: otp
                }, {
                    where: {
                        id: findUser.id
                    }
                })
            }



            res.status(200).json({
                status: 'success',
                payload: null,
                message: 'OTP generated successfully'
            });
        }


    } catch (error) {
        console.log("Error at resend OTP ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while resend OTP",
        });
    }
};

exports.internal_user_login = async (req, res, next) => {
    try {
        let { email, password } = req.body;

        let hashed_email = await cryptoJs.hash_from_string(email);

        let findUser = await db.User.findOne({
            where: {
                email: hashed_email
            }
        });

        // if (findUser === null) {
        //     return res.status(200).json({
        //         status: "failed",
        //         payload: null,
        //         message: "invalid phone number",
        //     });
        // }

        if (findUser === null || findUser.get('hashed_password') === null || !bcrypt.compareSync(password, findUser.get('hashed_password'))) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "invalid phone number",
            });
        }

        let hashed_user_id = await cryptoJs.hash_from_string(findUser.id);

        let fetchUserProfile = await db.UserProfile.findOne({
            where: {
                hashed_user_id: hashed_user_id,
            }
        });

        let payload = {};
        payload.user_id = findUser.id;
        payload.first_name = fetchUserProfile.first_name;
        payload.last_name = fetchUserProfile.last_name;
        payload.country_code = fetchUserProfile.country_code;
        payload.phone_number = fetchUserProfile.phone;
        payload.member_token = fetchUserProfile.member_token;
        payload.login_type = findUser.preferred_login_type;

        let token = jwt.sign(payload, JWT_PRIVATE_KEY);

        res.status(200).json({
            status: 'success',
            token: token,
            login_type: findUser.preferred_login_type,
            payload: null,
            message: 'User account logged successfully'
        });

    } catch (error) {
        console.log("Error at login ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while login",
        });
    }
};

exports.verify_authentication_code = async (req, res, next) => {
    try {
        let { country_code, phone, verification_code, email, login_type, date_of_birth } = req.body;

        // console.log(`Body ==> ${JSON.stringify(req.body)}`);

        let findUser = null;

        if (login_type === 'EM') {
            let hashed_email = await cryptoJs.hash_from_string(email);

            findUser = await db.User.findOne({
                where: {
                    email: hashed_email
                }
            });

        } else {
            let hashed_phone_number = await cryptoJs.hash_from_string(phone);
            let hashed_country_code = await cryptoJs.hash_from_string(country_code);

            findUser = await db.User.findOne({
                where: {
                    country_code: hashed_country_code,
                    hashed_phone_number: hashed_phone_number
                }
            });
        }

        if (findUser === null) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "invalid phone number",
            });
        }

        if (findUser.verification_code !== verification_code) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "invalid verification code",
            });
        }

        let hashed_user_id = await cryptoJs.hash_from_string(findUser.id);

        let fetchUserProfile = await db.UserProfile.findOne({
            where: {
                // hashed_user_id: hashed_user_id,
                [Op.and]: [
                    Sequelize.where(Sequelize.fn('date', Sequelize.col('birth_date')), '=', date_of_birth),
                    { hashed_user_id: hashed_user_id }
                ]                
            }
        });

        let payload = {};
        payload.user_id = findUser.id;
        payload.first_name = fetchUserProfile.first_name;
        payload.last_name = fetchUserProfile.last_name;
        payload.country_code = fetchUserProfile.country_code;
        payload.phone_number = fetchUserProfile.phone;
        payload.member_token = fetchUserProfile.member_token;
        payload.login_type = findUser.preferred_login_type;

        let token = jwt.sign(payload, JWT_PRIVATE_KEY);

        await db.User.update({
            verification_code: null
        }, {
            where: {
                id: findUser.id
            }
        });

        res.status(200).json({
            status: 'success',
            token: token,
            login_type: findUser.preferred_login_type,
            payload: null,
            message: 'User account logged successfully'
        });

    } catch (error) {
        console.log("Error at verify otp ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while verify otp",
        });
    }
};

exports.validate_token = async (req, res, next) => {
    try {
        let fetchUserProfile = await db.UserProfile.findOne({
            where: {
                id: req.userData.user_profile_id,
            },
            include: [
                {
                    model: db.UserRole,
                    as: "userRoles",
                    include: [
                        {
                            model: db.Role,
                            as: "role",
                        },
                    ],
                }
            ]
        });

        let decrypt_phone_number = (fetchUserProfile.hashed_phone_number !== null && fetchUserProfile.hashed_phone_number !== undefined) ? await cryptoJs.decrypt(fetchUserProfile.hashed_phone_number) : null;
        let decrypt_country_code = (fetchUserProfile.country_code !== null && fetchUserProfile.country_code !== undefined) ? await cryptoJs.decrypt(fetchUserProfile.country_code) : null;

        fetchUserProfile.hashed_phone_number = decrypt_phone_number;
        fetchUserProfile.country_code = decrypt_country_code;


        res.status(200).json({
            status: 'success',
            payload: fetchUserProfile,
            message: 'Validate user successfully'
        });

    } catch (error) {
        console.log("Error at validate user ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while validate user",
        });
    }
}


exports.find_user_profile = async (req, res, next) => {
    try {
        let { email } = req.params;
        let hashed_email = await cryptoJs.hash_from_string(email);

        let findUser = await db.User.findOne({
            where: {
                email: hashed_email,
            }
        });
        if (findUser === null) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "invalid user",
            });
        }
        let hashed_user_id = await cryptoJs.hash_from_string(findUser.id);

        let fetchUserProfile = await db.UserProfile.findOne({
            where: {
                hashed_user_id: hashed_user_id,
            }
        });
        if (fetchUserProfile === null) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "invalid user",
            });
        }

        res.status(200).json({
            status: 'success',
            payload: fetchUserProfile,
            message: 'search user successfully'
        });

    } catch (error) {
        console.log("Error at find user ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while find user",
        });
    }
}


exports.create_internal_user = async (req, res, next) => {
    try {
        const { first_name, last_name, gender, role_code, email } = req.body;

        let findRole = await db.Role.findOne({
            where: {
                code: role_code
            }
        });

        if (findRole === null) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "invalid role code",
            });
        }

        let hashed_email = await cryptoJs.hash_from_string(email);

        let findUser = await db.User.findOne({
            where: {
                email: hashed_email,
            }
        });
        let hashed_user_id = null;
        if (findUser === null) {
            let new_user = await db.User.create({
                email: hashed_email,
                password: email !== null ? 'Password123' : null,
                preferred_login_type: 'EM',
                internal_user: true,
                status: "ACTIVE"
            });

            hashed_user_id = await cryptoJs.hash_from_string(new_user.id);

            let newQrCode = await createQrCode();

            let new_user_profile = await db.UserProfile.create({
                hashed_user_id,
                first_name,
                last_name,
                gender,
                email,
                qr_code: newQrCode,
                status: "ACTIVE"
            });

            await db.UserRole.create({
                role_id: findRole.id,
                user_profile_id: new_user_profile.id,
                is_default: true,
                status: "ACTIVE"
            });

            let token = Buffer.from(email).toString('base64');
            let data = {};
            data.link = `${CLIENT_DOMAIN}reset-password/${token}`;
            send_mail("PASSWORD", email, `${first_name} ${last_name}`, data);

        } else {

            hashed_user_id = await cryptoJs.hash_from_string(findUser.id)
            let findUserProfile = await db.UserProfile.findOne({
                where: {
                    hashed_user_id: hashed_user_id,
                }
            });

            let findUserRole = await db.UserRole.findOne({
                where: {
                    user_profile_id: findUserProfile.id,
                    role_id: findRole.id
                }
            });

            if (findUserRole === null) {
                await db.UserRole.update({
                    is_default: false,
                }, {
                    where: {
                        user_profile_id: findUserProfile.id,
                    }
                });

                await db.UserRole.create({
                    role_id: findRole.id,
                    user_profile_id: findUserProfile.id,
                    is_default: true,
                    status: "ACTIVE"
                });
            }
        }

        let userProfile = await db.UserProfile.findOne({
            where: {
                hashed_user_id: hashed_user_id,
            },
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
            payload: userProfile,
            message: 'Internal user created successfully'
        });

    } catch (error) {
        console.log("Error at creating internal user ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while creating internal user",
        });
    }
}

exports.deleteUserProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        let findUserProfile = await db.UserProfile.findOne({
            where: {
                id: id
            }
        });

        if(findUserProfile === null){
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "Unauthorized",
            });
        }

        await db.UserProfile.update({
            status: 'INACTIVE'
        },{
            where: {
                id: findUserProfile.id
            }
        });

        console.log(`Profile --> ${findUserProfile.email}`);
        let createEmailHash = await cryptoJs.hash_from_string(findUserProfile.email);

        await db.User.update({
            status: 'INACTIVE'
        },{
            where: {
                email: createEmailHash
            }
        })


        res.status(200).json({
            status: 'success',
            // payload: userProfile,
            message: 'Internal user created successfully'
        });
    } catch (error) {
        console.log("Error at deleting internal user ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while deleting internal user",
        });
    }
}

exports.reactivateUserProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        let findUserProfile = await db.UserProfile.findOne({
            where: {
                id: id
            }
        });

        if(findUserProfile === null){
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "Unauthorized",
            });
        }

        await db.UserProfile.update({
            status: 'ACTIVE'
        },{
            where: {
                id: findUserProfile.id
            }
        });

        console.log(`Profile --> ${findUserProfile.email}`);
        let createEmailHash = await cryptoJs.hash_from_string(findUserProfile.email);

        await db.User.update({
            status: 'ACTIVE'
        },{
            where: {
                email: createEmailHash
            }
        })


        res.status(200).json({
            status: 'success',
            // payload: userProfile,
            message: 'Internal user reactivated successfully'
        });
    } catch (error) {
        console.log("Error at reactivate internal user ==> " + error);
        res.status(500).json({
            status: "failed",
            payload: {},
            message: "Error while reactivating internal user",
        });
    }
}

exports.authenticate = async (req, res, next) => {
    try {
        let findUser = await db.User.findOne({
            where: {
                id: req.userData.user_id,
            }
        });
        if (findUser === null) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "Unauthorized",
            });
        }

        let hashed_user_id = await cryptoJs.hash_from_string(findUser.id);

        let fetchUserProfile = await db.UserProfile.findOne({
            where: {
                hashed_user_id: hashed_user_id,
            }
        });

        let payload = {};
        payload.user_id = findUser.id;
        payload.first_name = fetchUserProfile.first_name;
        payload.last_name = fetchUserProfile.last_name;
        payload.country_code = fetchUserProfile.country_code;
        payload.phone_number = fetchUserProfile.phone;
        payload.member_token = fetchUserProfile.member_token;
        payload.login_type = findUser.preferred_login_type;
        let token = jwt.sign(payload, JWT_PRIVATE_KEY);

        res.status(200).json({
            status: 'success',
            token: token,
            login_type: findUser.preferred_login_type,
            payload: null,
            message: 'User account logged successfully'
        });

    } catch (error) {
        res.status(500).json({
            status: "failed",
            payload: null,
            message: "Unauthorized",
        });
    }
}

exports.createQRCode = async (req, res, next) => {
    try {
        let { qrCode } = req.params;

        const qrStream = new PassThrough();

        await QRCode.toFileStream(qrStream, qrCode);

        qrStream.pipe(res);
    } catch (error) {
        res.status(200).json({
            status: "failed",
            payload: null,
            message: "Unable to download",
        });
    }
}

exports.sendQRCode = async (req, res, next) => {
    try {
        let { qrCode, email, name, first_name, last_name } = req.body;

        if(qrCode !== undefined && qrCode !== ""){
            let localePath = path.resolve(__dirname, `../../uploads/${name.replace(/\s/g,'')}_QRCode.png`);
            let isSent = await createAndSendQRCode(localePath, req.body);
            console.log(`isSent ==> ${isSent}`)
            if(isSent !== null){
                fs.unlink(localePath, (err => {
                    if (err) console.log(err);
                    else {
                        console.log(`\nDeleted file from: ${localePath}`);
                    }
                })); 
            }

            res.status(200).json({
                status: "success",
                payload: null,
                message: "QR Code sent successfully",
            });
        }else{
            res.status(200).json({
                status: "failed",
                payload: null,
                message: "QR Code is empty",
            });
        }
        
    } catch (error) {
        res.status(200).json({
            status: "failed",
            payload: null,
            message: "Unable to send email",
        });
    }
}

exports.resetPassword = async (req, res, next) => {
    try {
        let { token, password } = req.body;

        let email = Buffer.from(token, 'base64').toString()
        let hashed_email = await cryptoJs.hash_from_string(email);

        await db.User.update({
            password: password,
        }, {
            where: {
                email: hashed_email
            }
        });


        res.status(200).json({
            status: 'success',
            payload: null,
            message: 'User password updated successfully'
        });

    } catch (error) {
        console.log("Error at updating user password==> " + error);
        res.status(500).json({
            status: "failed",
            payload: null,
            message: "Unable to updated user password",
        });
    }
}


exports.forgotPassword = async (req, res, next) => {
    try {
        let { email } = req.body;

        let hashed_email = await cryptoJs.hash_from_string(email);

        let findUser = await db.User.findOne({
            where: {
                email: hashed_email,
            }
        });

        if (findUser === null) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "User doesn't exist",
            });
        }

        let hashed_user_id = await cryptoJs.hash_from_string(findUser.id);

        let fetchUserProfile = await db.UserProfile.findOne({
            where: {
                hashed_user_id: hashed_user_id,
            }
        });


        let token = Buffer.from(email).toString('base64');
        let data = {};
        data.link = `${CLIENT_DOMAIN}reset-password/${token}`;
        send_mail("FORGOT_PASSWORD", email, `${fetchUserProfile.first_name} ${fetchUserProfile.last_name}`, data);

        res.status(200).json({
            status: 'success',
            payload: null,
            message: 'User mail send successfully'
        });

    } catch (error) {
        console.log("Error at updating send mail==> " + error);
        res.status(500).json({
            status: "failed",
            payload: null,
            message: "Unable to send mail",
        });
    }
}

exports.createPaymentSession = async (req, res) => {
    try {
        let { testTypes, isLoggedIn } = req.body;
        // console.log(`Body ==> ${JSON.stringify(testTypes)}`);
        let createSession = await createSessionForPayment(testTypes, isLoggedIn);

        if (createSession === null) {
            res.status(200).json({
                status: "failed",
                payload: null,
                message: "Unable to create payment session",
            });
        }

        res.status(200).json({
            status: 'success',
            payload: createSession,
            message: 'Session created successfully'
        });

    } catch (error) {
        res.status(200).json({
            status: "failed",
            payload: null,
            message: "Unable to create payment session",
        });
    }
}

exports.fetchUserContacts = async (req, res, next) => {
    try {
        const { user_id, member_token } = req.userData;
        // console.log(`Saved --> ${JSON.stringify(req.userData)}`)
        let findUser = await db.User.findOne({
            where: {
                id: user_id,
            }
        });

        if (findUser === null) {
            return res.status(200).json({
                status: "failed",
                payload: null,
                message: "Unauthorized",
            });
        }

        let hashed_user_id = await cryptoJs.hash_from_string(findUser.id);

        let fetchUserProfile = await db.UserProfile.findOne({
            where: {
                hashed_user_id: hashed_user_id,
                member_token: member_token
            }
        });

        // console.log(`${findUser.preferred_login_type} ==> fetchUserProfile ===> \n${JSON.stringify(fetchUserProfile)}`);
        let fetchContacts = null;
        let date_of_birth = moment(fetchUserProfile.birth_date).format('YYYY-MM-DD');
        if (findUser.preferred_login_type === 'EM') {
            fetchContacts = await fetchContactFromSalesforceUsingEmail(fetchUserProfile.email, date_of_birth);
        } else {
            let phoneNumber = await cryptoJs.decrypt(fetchUserProfile.hashed_phone_number);
            
            fetchContacts = await fetchContactFromSalesforce(phoneNumber, date_of_birth);
        }

        // console.log(`Contacts ===> ${JSON.stringify(fetchContacts)}`);

        if (fetchContacts.totalSize > 0) {
            res.status(200).json({
                status: 'success',
                payload: fetchContacts.records,
                message: 'Contacts fetched successfully'
            });
        } else {
            res.status(200).json({
                status: 'failed',
                payload: null,
                message: 'Error while fetching contacts'
            });
        }

    } catch (error) {
        res.status(200).json({
            status: "failed",
            payload: null,
            message: "Unable to fetch contacts",
        });
    }
}