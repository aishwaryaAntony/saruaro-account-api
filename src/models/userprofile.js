'use strict';
module.exports = (sequelize, DataTypes) => {
	const UserProfile = sequelize.define('UserProfile', {
		member_token: {
			type: DataTypes.UUID,
			allowNull: false,
			defaultValue: DataTypes.UUIDV4
		},
		hashed_user_id: {
			type: DataTypes.STRING,
			allowNull: false
		},
		contact_id: {
			type: DataTypes.STRING,
			allowNull: true
		},
		first_name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		middle_name: {
			type: DataTypes.STRING,
			allowNull: true
		},
		last_name: {
			type: DataTypes.STRING,
			allowNull: true
		},
		gender: {
			type: DataTypes.STRING,
			allowNull: true
		},
		country_code: {
			type: DataTypes.STRING,
			allowNull: true
		},
		hashed_phone_number: {
			type: DataTypes.STRING,
			allowNull: true
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true
		},
		age: {
			type: DataTypes.INTEGER,
			allowNull: true
		},
		birth_date: {
			type: DataTypes.DATE,
			allowNull: true
		},
		race: {
			type: DataTypes.STRING,
			allowNull: true
		},
		ethnicity: {
			type: DataTypes.STRING,
			allowNull: true
		},
		driver_license_number: {
			type: DataTypes.STRING,
			allowNull: true
		},
		passport_number: {
			type: DataTypes.STRING,
			allowNull: true
		},
		ssn: {
			type: DataTypes.STRING,
			allowNull: true
		},
		address_line1: {
			type: DataTypes.STRING,
			allowNull: true
		},
		address_line2: {
			type: DataTypes.STRING,
			allowNull: true
		},
		city: {
			type: DataTypes.STRING,
			allowNull: true
		},
		state: {
			type: DataTypes.STRING,
			allowNull: true
		},
		country: {
			type: DataTypes.STRING,
			allowNull: true
		},
		zipcode: {
			type: DataTypes.STRING,
			allowNull: true
		},
		qr_code: {
			type: DataTypes.STRING,
			allowNull: false
		},
		last_login: {
			type: DataTypes.STRING,
			allowNull: true
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
		}
	}, {});
	UserProfile.associate = function (models) {
		// associations can be defined here
		UserProfile.hasMany(models.UserRole, { as: 'userRoles', foreignKey: 'user_profile_id', sourceKey: 'id' });
		UserProfile.hasMany(models.UserInsurance, { as: 'userInsurances', foreignKey: 'user_profile_id', sourceKey: 'id' });
		UserProfile.hasMany(models.UserAttachment, { as: 'userAttachments', foreignKey: 'user_profile_id', sourceKey: 'id' });
	};
	return UserProfile;
};
