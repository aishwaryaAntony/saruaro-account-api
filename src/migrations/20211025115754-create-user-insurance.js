'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserInsurances', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_profile_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      insurance_provider: {
        type: Sequelize.STRING,
        allowNull: false
      },
      policy_number: {
        type: Sequelize.STRING,
        allowNull: false
      },
      policy_group_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      provider_phone_number: {
        type: Sequelize.STRING,
        allowNull: true
      },
      front_insurance_card_image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      back_insurance_card_image: {
        type: Sequelize.STRING,
        allowNull: true
      },
      street_address_line1: {
        type: Sequelize.STRING,
        allowNull: true
      },
      street_address_line2: {
        type: Sequelize.STRING,
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      state: {
        type: Sequelize.STRING,
        allowNull: true
      },
      zipcode: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('UserInsurances');
  }
};