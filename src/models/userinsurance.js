'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserInsurance = sequelize.define('UserInsurance', {
    user_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    insurance_provider: {
      type: DataTypes.STRING,
      allowNull: false
    },
    policy_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    policy_group_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    provider_phone_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    front_insurance_card_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    back_insurance_card_image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    street_address_line1: {
      type: DataTypes.STRING,
      allowNull: true
    },
    street_address_line2: {
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
    zipcode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status:{
      type: DataTypes.STRING,
      allowNull: true 
    }
  }, {});
  UserInsurance.associate = function (models) {
    // associations can be defined here
    UserInsurance.belongsTo(models.UserProfile, { as: 'userProfile', foreignKey: 'user_profile_id', targetKey: 'id' });
  };
  return UserInsurance;
};