
const { User } = require('../models');
const { Op } = require('sequelize');

// Get all users
async function getAllUsers() {
    return await User.findAll({
        attributes: { exclude: ['passwordHash'] }
    });
}

// Get user by id
async function getUserById(id, currentUser) {
    if (
        currentUser.role !== 'admin' &&
        Number(id) !== Number(currentUser.id)
    ) {
        return { forbidden: true };
    }

    const user = await User.findByPk(id, {
        attributes: { exclude: ['passwordHash'] }
    });

    return { data: user };
}

// Update user
async function updateUser(id, body, currentUser) {
    const data = { ...body };

    // Non-admin cannot change role or status
    if (currentUser.role !== 'admin') {
        delete data.role;
        delete data.status;
    }

    // Non-admin can only update their own profile
    if (
        currentUser.role !== 'admin' &&
        Number(id) !== Number(currentUser.id)
    ) {
        return { forbidden: true };
    }

    // Only allow updating permitted fields
    const allowedFields = ['username', 'email', 'fullName', 'phone'];
    const updateData = {};

    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updateData[field] = data[field];
        }
    }

    // Admin can additionally update role and status
    if (currentUser.role === 'admin') {
        if (data.role !== undefined) updateData.role = data.role;
        if (data.status !== undefined) updateData.status = data.status;
    }

    const [updated] = await User.update(updateData, {
        where: { id }
    });

    return { updated };
}

// Delete user
async function deleteUser(id) {
    return await User.destroy({
        where: { id }
    });
}

// Create user
async function createUser(body) {
    const {
        username,
        email,
        password,
        fullName,
        phone,
        role
    } = body;

    // Validate required fields
    if (!username || !email || !password) {
        const error = new Error('Username, email and password are required');
        error.statusCode = 400;
        throw error;
    }

    // Validate role
    const allowedRoles = ['admin', 'librarian', 'reader'];
    const userRole = role || 'reader';

    if (!allowedRoles.includes(userRole)) {
        const error = new Error('Invalid role');
        error.statusCode = 400;
        throw error;
    }

    // Check duplicate username or email
    const existingUser = await User.findOne({
        where: {
            [Op.or]: [
                { username },
                { email }
            ]
        }
    });

    if (existingUser) {
        const error = new Error('Username or email already exists');
        error.statusCode = 409;
        throw error;
    }

    // Create user - Model hook will hash password
    const user = await User.create({
        username,
        email,
        passwordHash: password,
        fullName,
        phone,
        role: userRole,
        status: 'active'
    });

    // Remove passwordHash before returning
    const userData = user.toJSON();
    delete userData.passwordHash;

    return userData;
}

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    createUser
};
