'use strict';
module.exports = (sequelize, DataTypes) => {
  const UserRole = sequelize.define('UserRole', {
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    user_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    is_default:{
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});
  UserRole.associate = function (models) {
    // associations can be defined here
    UserRole.belongsTo(models.Role, { as: 'role', foreignKey: 'role_id', targetKey: 'id' });
    UserRole.belongsTo(models.UserProfile, { as: 'userProfile', foreignKey: 'user_profile_id', targetKey: 'id' });
  };
  return UserRole;
};