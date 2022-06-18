'use strict';
module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('Users', {
			id: {
				allowNull: false,
				autoIncrement: true,
				primaryKey: true,
				type: Sequelize.INTEGER
			},
			country_code: {
				type: Sequelize.STRING,
				allowNull: true
			},
			hashed_phone_number: {
				type: Sequelize.STRING,
				allowNull: true
			},
			verification_code: {
				type: Sequelize.STRING,
				allowNull: true
			},
			email: {
				type: Sequelize.STRING,
				allowNull: true
			},
			hashed_password: {
				type: Sequelize.STRING,
				allowNull: true
			},
			salt: {
				type: Sequelize.STRING,
				allowNull: true
			},
			internal_user: {
				type: Sequelize.BOOLEAN,
				allowNull: true,
				defaultValue: false
			},
			preferred_login_type: {
				type: Sequelize.STRING,
				allowNull: true,
				defaultValue: 'PN'
			},
			status: {
				type: Sequelize.STRING,
				allowNull: false
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DATE
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DATE
			}
		});
	},
	down: async (queryInterface, Sequelize) => {
		await queryInterface.dropTable('Users');
	}
};