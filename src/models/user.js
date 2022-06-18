'use strict';
const bcrypt = require('bcryptjs');

module.exports = (sequelize, DataTypes) => {
	const User = sequelize.define('User', {
		country_code: {
			type: DataTypes.STRING,
			allowNull: true
		},
		hashed_phone_number: {
			type: DataTypes.STRING,
			allowNull: true
		},
		verification_code: {
			type: DataTypes.STRING,
			allowNull: true
		},
		email: {
			type: DataTypes.STRING,
			allowNull: true
		},
		password: {
			type: DataTypes.VIRTUAL,
			allowNull: true,
			defaultValue: null,
			validate: {
				len: [8, 100]
			},
			set: function (value) {
				if (value !== null) {
					var salt = bcrypt.genSaltSync(10);
					var hashed_password = bcrypt.hashSync(value, salt);

					this.setDataValue('password', value);
					this.setDataValue('salt', salt);
					this.setDataValue('hashed_password', hashed_password);
				}
			}
		},
		hashed_password: {
			type: DataTypes.STRING,
			allowNull: true
		},
		salt: {
			type: DataTypes.STRING,
			allowNull: true
		},
		internal_user: {
			type: DataTypes.BOOLEAN,
			allowNull: true,
			defaultValue: false
		},
		preferred_login_type: {
			type: DataTypes.STRING,
			allowNull: true,
			defaultValue: 'PN'
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
		}
	}, {});

	return User;
};