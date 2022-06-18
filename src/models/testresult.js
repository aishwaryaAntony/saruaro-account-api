'use strict';
module.exports = (sequelize, DataTypes) => {
  const TestResult = sequelize.define('TestResult', {
    session_id: {
      type: DataTypes.STRING,
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true
    },
    email:{
      type: DataTypes.STRING,
      allowNull: true
    },
    test_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    payment_status: {
      type: DataTypes.STRING,
      allowNull: true
    },
    is_paid: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    created_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    cancelled_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    transaction_ref: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {});
  TestResult.associate = function (models) {
    // associations can be defined here
    
  };
  return TestResult;
};