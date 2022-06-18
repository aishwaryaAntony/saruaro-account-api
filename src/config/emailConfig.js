let nodemailer = require('nodemailer');

import { ADMIN_EMAIL, ADMIN_EMAIL_PASSWORD, TEST_RESULT_EMAIL, TEST_RESULT_EMAIL_PASSWORD } from "../helpers/constants";

// create reusable ViewOption for member email template
module.exports.ViewOption = (transport, hbs) => {
	transport.use('compile', hbs({
		viewEngine: {
			extName: '.html',
			partialsDir: 'src/views',
			layoutsDir: 'src/views',
			defaultLayout: false,
		},
		viewPath: 'src/views',
		extName: '.html'
	}));
}

module.exports.AdminGmailTransport = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: ADMIN_EMAIL,
		pass: ADMIN_EMAIL_PASSWORD
	}
});

module.exports.TestResultGmailTransport = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: TEST_RESULT_EMAIL,
		pass: TEST_RESULT_EMAIL_PASSWORD
	}
});