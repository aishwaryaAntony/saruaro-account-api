'use strict';

module.exports = (sequelize, DataTypes) => {
	const Role = sequelize.define('Role', {
		code: {
			type: DataTypes.STRING,
			allowNull: false
		},
		name: {
			type: DataTypes.STRING,
			allowNull: false
		},
		status: {
			type: DataTypes.STRING,
			allowNull: false,
		}
	}, {});
	Role.associate = function (models) {
		// associations can be defined here
		Role.hasMany(models.UserRole, { as: 'roles', foreignKey: 'role_id', sourceKey: 'id' });
	};
	return Role;
};