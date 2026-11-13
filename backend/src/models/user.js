const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    fullName: {
        type: DataTypes.STRING(150),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20)
    },
    role: {
        type: DataTypes.ENUM('admin', 'librarian', 'reader'),
        allowNull: false,
        defaultValue: 'reader'
    },
    status: {
        type: DataTypes.ENUM('active', 'locked'),
        defaultValue: 'active'
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,

    indexes: [
        {
            unique: true,
            name: 'users_username_unique',
            fields: ['username']
        },
        {
            unique: true,
            name: 'users_email_unique',
            fields: ['email']
        }
    ]
});

User.beforeCreate(async (user) => {
  user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
});
User.beforeUpdate(async (user) => {
  if (user.changed('passwordHash')) {
    user.passwordHash = await bcrypt.hash(user.passwordHash, 12);
  }
});

User.prototype.validatePassword = function (password) {
  return bcrypt.compareSync(password, this.passwordHash);
};

module.exports = User;
