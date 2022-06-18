// Parse command line arguments using yargs
var argv = require("yargs")
	.command("master", "Load DB", function (yargs) { })
	.help("help").argv;
var command = argv._[0];
import Excel from "exceljs";
import db from "../src/models";
import cryptoJs from "../src/helpers/crypto";
import { createQrCode } from "../src/helpers/accounts"

const loadMasterTable = filename => {
	return new Promise(async (resolve, reject) => {
		try {
			let workbook = new Excel.Workbook();
			console.log("File name => " + filename);
			await workbook.xlsx.readFile(filename).then(() => {
				console.log("\n==================Master tables started loading====================\n");
				loadRoles(workbook).then(role => {
					loadUsers(workbook).then(user => {
						console.log("==================Master tables loaded successfully====================\n");
						resolve("Success");
					});
				});
			});
		} catch (error) {
			reject(error);
		}
	});
};

const loadRoles = workbook => {
	return new Promise((resolve, reject) => {
		let worksheet = workbook.getWorksheet("roles");
		let lastRow = worksheet.lastRow;
		let isRejected = false;
		let roleArray = [];

		try {
			worksheet.eachRow({ includeEmpty: true }, async (row, rowNumber) => {
				if (rowNumber > 1) {
					let roleObj = {};
					roleObj.code = row.getCell(1).value;
					roleObj.name = row.getCell(2).value;
					roleObj.status = row.getCell(3).value;
					roleArray.push(roleObj);

					if (row === lastRow) {
						if (!isRejected === true) {
							for (let role of roleArray) {
								const { name, code, status } = role;
								let findRole = await db.Role.findOne({
									where: {
										code: code
									}
								});
								if (findRole === null) {
									await db.Role.create({
										name,
										code,
										status
									});
								}

							}
							resolve("Role table loaded successfully");
						}
					}
				}
			});
		} catch (error) {
			resolve(error);
			console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!===> " + error);
		}
	});
};

const loadUsers = workbook => {
	return new Promise((resolve, reject) => {
		let worksheet = workbook.getWorksheet("users");
		let lastRow = worksheet.lastRow;
		let isRejected = false;
		let userArray = [];

		try {
			worksheet.eachRow({ includeEmpty: true }, async (row, rowNumber) => {
				if (rowNumber > 1) {
					let userObj = {};
					userObj.first_name = row.getCell(1).value;
					userObj.last_name = row.getCell(2).value;
					userObj.gender = row.getCell(3).value;
					userObj.role_code = row.getCell(4).value;
					userObj.email = row.getCell(5).value;
					userArray.push(userObj);

					if (row === lastRow) {
						if (!isRejected === true) {
							for (let user of userArray) {
								const { first_name,last_name, gender, role_code, email } = user;

								let findRole = await db.Role.findOne({
									where: {
										code: role_code
									}
								});
								
								let hashed_email = null;
								if(email !== null){
									hashed_email = await cryptoJs.hash_from_string(email);
								}
								
								let findUser = await db.User.findOne({
									where: {
										email: hashed_email,
									}
								});
								
								if (findRole !== null && findUser === null) {

									let new_user = await db.User.create({
										email: hashed_email,
										password: email !== null ? 'Password123' : null,
										preferred_login_type: email !== null ? 'EM' : 'PN',
										internal_user: email !== null ? true : false,
										status: "ACTIVE"
									});
									
									let hashed_user_id = await cryptoJs.hash_from_string(new_user.id);
									
									let newQrCode = await createQrCode();


									let new_user_profile = await db.UserProfile.create({
										hashed_user_id,
										first_name,
										last_name,
										gender,
										email:email,
										qr_code:newQrCode,
										status: "ACTIVE"
									});

									await db.UserRole.create({
										role_id: findRole.id,
										user_profile_id: new_user_profile.id,
										is_default: true,
										status: "ACTIVE"
									});
								}

							}
							resolve("Role table loaded successfully");
						}
					}
				}
			});
		} catch (error) {
			resolve(error);
			console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!===> " + error);
		}
	});
};

if (command === "master") {
	try {
		console.log("Loading data from " + argv._[1]);
		if (argv._[1] !== undefined && argv._[1] !== "") {
			loadMasterTable(argv._[1]).then(result => {
				process.exit();
			});
		}
	} catch (error) {
		console.log("error=================>" + error);
	}
}
