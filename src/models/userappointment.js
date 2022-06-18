'use strict';

module.exports = (sequelize, DataTypes) => {
	const UserAppointment = sequelize.define('UserAppointment', {
		first_name: {
			allowNull: false,
			type: DataTypes.STRING
		},
		last_name: {
			allowNull: false,
			type: DataTypes.STRING
		},
		phone_number: {
			allowNull: true,
			type: DataTypes.STRING
		},
		country_code: {
			allowNull: true,
			type: DataTypes.STRING
		},
		email: {
			allowNull: true,
			type: DataTypes.STRING
		},
		location_id: {
			allowNull: false,
			type: DataTypes.INTEGER
		},
		location_test_type_id: {
			allowNull: false,
			type: DataTypes.INTEGER
		},
		test_type_id: {
			allowNull: false,
			type: DataTypes.INTEGER
		},
		appointment_date: {
			allowNull: false,
			type: DataTypes.DATEONLY
		},
		appointment_time: {
			allowNull: false,
			type: DataTypes.DATE
		},
		acuity_appointment_id: {
			allowNull: false,
			type: DataTypes.STRING
		},
		status: {
			allowNull: false,
			type: DataTypes.STRING
		}
	}, {});
	UserAppointment.associate = function (models) {
		// associations can be defined here
	};
	return UserAppointment;
};