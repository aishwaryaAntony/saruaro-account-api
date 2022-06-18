
var path = require('path');
var MailConfig = require('../config/emailConfig');
var hbs = require('nodemailer-express-handlebars');
var AdminGmailTransport = MailConfig.AdminGmailTransport;
var TestResultGmailTransport = MailConfig.TestResultGmailTransport;

import { ADMIN_EMAIL, TEST_RESULT_EMAIL } from "./constants";

var templateAttachments = [
	{
		filename: 'Logo.png',
		path: path.resolve(__dirname, '../views/logo.png'),
		cid: 'logo'
	}
]

module.exports.send_mail = (template, toAddress, name, data) => {
	try {
		let subject = "";
		let attachments = [];
		let mailTemplate = "";
		let mail_id = null;

		switch (template) {
			case "OTP":
				MailConfig.ViewOption(AdminGmailTransport, hbs);
				subject = "Welcome to Saguaro Bloom";
				attachments = [...templateAttachments];
				mailTemplate = "otpTemplate";
				mail_id = ADMIN_EMAIL;
				break;
			case "PASSWORD":
				MailConfig.ViewOption(AdminGmailTransport, hbs);
				subject = "Welcome to Saguaro Bloom";
				attachments = [...templateAttachments];
				mailTemplate = "passwordTemplate";
				mail_id = ADMIN_EMAIL;
				break;
			case "FORGOT_PASSWORD":
					MailConfig.ViewOption(AdminGmailTransport, hbs);
					subject = "Change Password Request";
					attachments = [...templateAttachments];
					mailTemplate = "forgotPasswordTemplate";
					mail_id = ADMIN_EMAIL;
					break;
			case "TEST_RESULT":
				MailConfig.ViewOption(TestResultGmailTransport, hbs);
				subject = "Test Results";
				// attachments = [...templateAttachments];
				mailTemplate = "testResultTemplate";
				mail_id = TEST_RESULT_EMAIL;
				break;
			default:
				console.log("=====================>Invalid Template")
				break;
		}

		let HelperOptions = {
			from: '"Saguaro Bloom Diagnostics"' + mail_id,
			to: toAddress,
			subject: subject,
			template: mailTemplate,
			context: {
				name: name,
				data: data,
			},
			attachments: attachments
		};

		if (mailTemplate !== "") {
			if(template === "TEST_RESULT"){
				TestResultGmailTransport.sendMail(HelperOptions, (error, info) => {
					if (error) {
						console.log("Email not sent================>" + error);
					} else {
						console.log("=======================>email is send");
					}
				});
			} else {
				AdminGmailTransport.sendMail(HelperOptions, (error, info) => {
					if (error) {
						console.log("Email not sent================>" + error);
					} else {
						console.log("=======================>email is send");
					}
				});
			}
		}
	} catch (ex) {
		console.log("Email error=====================>" + ex)
	}
}

module.exports.send_email_with_attachment = (template, toAddress, name, data, filePath) => {
	try {
		let subject = "";
		let attachments = [];
		let mailTemplate = "";
		let mail_id = null;

		switch (template) {
			case "SFTP":
                MailConfig.ViewOption(AdminGmailTransport, hbs);
				subject = `File from PRL Lab`;
                let excelPath = {
                    filename: data.fileName,
                    path: filePath,
                }
                attachments = [...templateAttachments, excelPath];
                mailTemplate = "fileAttachmentTemplate"
                break;
			case "QRCODE":
				MailConfig.ViewOption(AdminGmailTransport, hbs);
				subject = `Bloom Labs - QR Code`;
				let excelPath1 = {
					filename: data.fileName,
					path: filePath,
				}
				attachments = [...templateAttachments, excelPath1];
				mailTemplate = "qrCodeAttachmentTemplate"
				break;
			default:
				console.log("=====================>Invalid Template")
				break;
		}

		let HelperOptions = {
			from: '"Saguaro Bloom Diagnostics"' + mail_id,
			to: toAddress,
			subject: subject,
			template: mailTemplate,
			context: {
				name: name,
				data: data,
			},
			attachments: attachments
		};

		if (mailTemplate !== "") {
			if(template === "SFTP"){
				AdminGmailTransport.sendMail(HelperOptions, (error, info) => {
					if (error) {
						console.log("Attachment email not sent =>" + error);
					} else {
						console.log("Email sent");
					}
				});
			}else if(template === "QRCODE"){
				AdminGmailTransport.sendMail(HelperOptions, (error, info) => {
					if (error) {
						console.log("QR Code Attachment email not sent =>" + error);
					} else {
						console.log("QR Code Email sent");
					}
				});
			}
		}

	} catch (error) {
		console.log("Email attachment error=====================>" + error)
	}
}


module.exports.asynchronously_send_email_with_attachment = (template, toAddress, name, data, filePath) => {
	return new Promise((resolve, reject) => {
		try {
			let subject = "";
			let attachments = [];
			let mailTemplate = "";
			let mail_id = null;
	
			switch (template) {
				case "SFTP":
					MailConfig.ViewOption(AdminGmailTransport, hbs);
					subject = `File from PRL Lab`;
					let excelPath = {
						filename: data.fileName,
						path: filePath,
					}
					attachments = [...templateAttachments, excelPath];
					mailTemplate = "fileAttachmentTemplate"
					break;
				case "QRCODE":
					MailConfig.ViewOption(AdminGmailTransport, hbs);
					subject = `Bloom Labs - QR Code`;
					let excelPath1 = {
						filename: data.fileName,
						path: filePath,
					}
					attachments = [...templateAttachments, excelPath1];
					mailTemplate = "qrCodeAttachmentTemplate"
					break;
				default:
					console.log("=====================>Invalid Template")
					break;
			}
	
			let HelperOptions = {
				from: '"Saguaro Bloom Diagnostics"' + mail_id,
				to: toAddress,
				subject: subject,
				template: mailTemplate,
				context: {
					name: name,
					data: data,
				},
				attachments: attachments
			};
	
			if (mailTemplate !== "") {
				if(template === "SFTP"){
					AdminGmailTransport.sendMail(HelperOptions, (error, info) => {
						if (error) {
							console.log("Attachment email not sent =>" + error);
							resolve(null);
						} else {
							console.log("Email sent");
							resolve("success");
						}
					});
				}else if(template === "QRCODE"){
					AdminGmailTransport.sendMail(HelperOptions, (error, info) => {
						if (error) {
							console.log("QR Code Attachment email not sent =>" + error);
							resolve(null);
						} else {
							console.log("QR Code Email sent");
							resolve("success");
						}
					});
				}
			}else{
				resolve(null);
			}
	
		} catch (error) {
			console.log("Email attachment error=====================>" + error)
			resolve(null);
		}
	});	
}