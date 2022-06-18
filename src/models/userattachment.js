'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserAttachment = sequelize.define('UserAttachment', {
    user_profile_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    attachment_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    file_name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    content_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {});
  UserAttachment.associate = function (models) {
    // associations can be defined here
    UserAttachment.belongsTo(models.UserProfile, { as: 'userProfile', foreignKey: 'user_profile_id', targetKey: 'id' });
  };
  return UserAttachment;
};