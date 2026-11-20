
const { User, sequelize } = require('../models');
const { Op } = require('sequelize');

// Allowed roles and statuses
const ALLOWED_ROLES = ['admin', 'librarian', 'reader'];
const ALLOWED_CREATE_ROLES = ['admin', 'librarian', 'reader'];
const ALLOWED_STATUSES = ['active', 'locked'];

/**
 * Helper: Create an error with HTTP status code
 */
function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

/**
 * Helper: Validate user ID
 */
function validateUserId(id) {
    const userId = Number(id);

    if (!Number.isInteger(userId) || userId <= 0) {
        throw createError('ID người dùng không hợp lệ.', 400);
    }

    return userId;
}

/**
 * Get all users with optional filters (role, status)
 * Admin only - enforce permission in route middleware.
 */
async function getAllUsers({ role, status } = {}) {
    const where = {};

    if (role) {
        if (!ALLOWED_ROLES.includes(role)) {
            throw createError('Role không hợp lệ.', 400);
        }

        where.role = role;
    }

    if (status) {
        if (!ALLOWED_STATUSES.includes(status)) {
            throw createError('Status không hợp lệ.', 400);
        }

        where.status = status;
    }

    return await User.findAll({
        where,
        attributes: { exclude: ['passwordHash'] },
        order: [['created_at', 'DESC']],
    });
}

/**
 * Get a single user by ID with permission check
 *
 * Admin: can view any user.
 * Other users: can only view their own account.
 */
async function getUserById(id, currentUser) {
    const userId = validateUserId(id);

    if (
        currentUser.role !== 'admin' &&
        userId !== Number(currentUser.id)
    ) {
        throw createError('Forbidden', 403);
    }

    const user = await User.findByPk(userId, {
        attributes: { exclude: ['passwordHash'] },
    });

    if (!user) {
        throw createError('Không tìm thấy người dùng.', 404);
    }

    return user;
}

/**
 * Create a librarian or admin account
 * Admin only - enforce permission in route middleware.
 */
async function createUser({
    username,
    email,
    password,
    fullName,
    phone,
    role,
}) {
    const allowedRoles = ALLOWED_CREATE_ROLES;

    if (!allowedRoles.includes(role)) {
        throw createError(
            'Admin chỉ có thể tạo tài khoản librarian hoặc admin.',
            400
        );
    }

    const normalizedUsername =
        typeof username === 'string' ? username.trim() : '';

    const normalizedEmail =
        typeof email === 'string' ? email.trim().toLowerCase() : '';

    const normalizedFullName =
        typeof fullName === 'string' ? fullName.trim() : '';

    if (
        !normalizedUsername ||
        !normalizedEmail ||
        typeof password !== 'string' ||
        !password ||
        !normalizedFullName
    ) {
        throw createError(
            'Vui lòng điền đầy đủ: username, email, mật khẩu và họ tên.',
            400
        );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
        throw createError('Email không hợp lệ.', 400);
    }

    // Check duplicate username
    const existingUsername = await User.findOne({
        where: { username: normalizedUsername },
    });

    if (existingUsername) {
        throw createError('Tên đăng nhập đã tồn tại.', 409);
    }

    // Check duplicate email
    const existingEmail = await User.findOne({
        where: { email: normalizedEmail },
    });

    if (existingEmail) {
        throw createError('Email đã được sử dụng.', 409);
    }

    try {
        const user = await User.create({
            username: normalizedUsername,
            email: normalizedEmail,
            passwordHash: password,
            fullName: normalizedFullName,
            phone,
            role,
            status: 'active',
        });

        return {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role,
            status: user.status,
        };
    } catch (error) {
        // Database unique constraints are the final protection
        // against simultaneous duplicate registrations.
        if (error.name === 'SequelizeUniqueConstraintError') {
            throw createError(
                'Username hoặc email đã được sử dụng.',
                409
            );
        }

        throw error;
    }
}

/**
 * Toggle status of a user (active <-> locked)
 *
 * Cannot lock or unlock the currently logged-in account.
 */
async function toggleUserStatus(id, currentUserId) {
    const userId = validateUserId(id);

    if (userId === Number(currentUserId)) {
        throw createError(
            'Không thể thay đổi trạng thái tài khoản của chính mình.',
            400
        );
    }

    return await sequelize.transaction(async (transaction) => {
        const user = await User.findByPk(userId, {
            transaction,
            lock: transaction.LOCK.UPDATE,
        });

        if (!user) {
            throw createError('Không tìm thấy người dùng.', 404);
        }

        if (!ALLOWED_STATUSES.includes(user.status)) {
            throw createError(
                'Trạng thái tài khoản hiện tại không hợp lệ.',
                409
            );
        }

        const newStatus =
            user.status === 'active' ? 'locked' : 'active';

        await user.update(
            { status: newStatus },
            { transaction }
        );

        return {
            message: `Tài khoản "${user.username}" đã được ${
                newStatus === 'locked' ? 'khóa' : 'mở khóa'
            } thành công.`,
            status: newStatus,
        };
    });
}

/**
 * Update user information
 *
 * Allowed fields:
 * - username
 * - email
 * - fullName
 * - phone
 * - role (Admin only)
 * - status (Admin only)
 *
 * Users can only update their own profile.
 * Admin can update other users.
 */
async function updateUser(id, updateData, currentUser) {
    const userId = validateUserId(id);

    const isAdmin = currentUser.role === 'admin';
    const isOwnAccount = userId === Number(currentUser.id);

    if (!isAdmin && !isOwnAccount) {
        throw createError('Forbidden', 403);
    }

    const user = await User.findByPk(userId);

    if (!user) {
        throw createError('Không tìm thấy người dùng.', 404);
    }

    // Only accept explicitly allowed fields
    const allowedFields = [
        'username',
        'email',
        'fullName',
        'phone',
    ];

    const data = {};

    for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
            data[field] = updateData[field];
        }
    }

    // Only Admin can update role and status
    if (isAdmin) {
        if (updateData.role !== undefined) {
            if (!ALLOWED_ROLES.includes(updateData.role)) {
                throw createError('Role không hợp lệ.', 400);
            }

            data.role = updateData.role;
        }

        if (updateData.status !== undefined) {
            if (!ALLOWED_STATUSES.includes(updateData.status)) {
                throw createError('Status không hợp lệ.', 400);
            }

            data.status = updateData.status;
        }
    } else if (
        updateData.role !== undefined ||
        updateData.status !== undefined
    ) {
        throw createError(
            'Bạn không có quyền thay đổi role hoặc status.',
            403
        );
    }

    // Prevent an Admin from changing their own role/status
    if (
        isOwnAccount &&
        (data.role !== undefined || data.status !== undefined)
    ) {
        throw createError(
            'Không thể thay đổi role hoặc status của chính mình.',
            400
        );
    }

    if (Object.keys(data).length === 0) {
        throw createError('Không có thông tin hợp lệ để cập nhật.', 400);
    }

    // Normalize and validate fields
    if (data.username !== undefined) {
        if (
            typeof data.username !== 'string' ||
            !data.username.trim()
        ) {
            throw createError('Username không hợp lệ.', 400);
        }

        data.username = data.username.trim();

        const existingUsername = await User.findOne({
            where: {
                username: data.username,
                id: { [Op.ne]: userId },
            },
        });

        if (existingUsername) {
            throw createError('Tên đăng nhập đã tồn tại.', 409);
        }
    }

    if (data.email !== undefined) {
        if (typeof data.email !== 'string') {
            throw createError('Email không hợp lệ.', 400);
        }

        data.email = data.email.trim().toLowerCase();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
            throw createError('Email không hợp lệ.', 400);
        }

        const existingEmail = await User.findOne({
            where: {
                email: data.email,
                id: { [Op.ne]: userId },
            },
        });

        if (existingEmail) {
            throw createError('Email đã được sử dụng.', 409);
        }
    }

    if (data.fullName !== undefined) {
        if (
            typeof data.fullName !== 'string' ||
            !data.fullName.trim()
        ) {
            throw createError('Họ tên không hợp lệ.', 400);
        }

        data.fullName = data.fullName.trim();
    }

    try {
        await user.update(data);

        return {
            message: 'Cập nhật thông tin thành công.',
        };
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            throw createError(
                'Username hoặc email đã được sử dụng.',
                409
            );
        }

        throw error;
    }
}

/**
 * Delete user (Admin only)
 *
 * Cannot delete the currently logged-in account.
 */
async function deleteUser(id, currentUserId) {
    const userId = validateUserId(id);

    if (userId === Number(currentUserId)) {
        throw createError(
            'Không thể xóa tài khoản của chính mình.',
            400
        );
    }

    const user = await User.findByPk(userId);

    if (!user) {
        throw createError('Không tìm thấy người dùng.', 404);
    }

    await user.destroy();

    return {
        message: 'Đã xóa tài khoản thành công.',
    };
}

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    toggleUserStatus,
    updateUser,
    deleteUser,
};
