const { User } = require('../models');

/**
 * Get all users with optional filters (role, status)
 */
async function getAllUsers({ role, status } = {}) {
  const where = {};
  if (role) where.role = role;
  if (status) where.status = status;

  return await User.findAll({
    where,
    attributes: { exclude: ['passwordHash'] },
    order: [['created_at', 'DESC']],
  });
}

/**
 * Get a single user by id with permission check
 */
async function getUserById(id, currentUser) {
  if (currentUser.role !== 'admin' && Number(id) !== currentUser.id) {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findByPk(id, {
    attributes: { exclude: ['passwordHash'] },
  });

  if (!user) {
    const error = new Error('Không tìm thấy người dùng');
    error.statusCode = 404;
    throw error;
  }

  return user;
}

/**
 * Create a librarian or admin account (Admin only)
 */
async function createUser({ username, email, password, fullName, phone, role }) {
  const allowedRoles = ['librarian', 'admin'];
  if (!allowedRoles.includes(role)) {
    const error = new Error('Admin chỉ có thể tạo tài khoản librarian hoặc admin.');
    error.statusCode = 400;
    throw error;
  }

  if (!username || !email || !password || !fullName) {
    const error = new Error('Vui lòng điền đầy đủ: username, email, mật khẩu và họ tên.');
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate username
  const existingUsername = await User.findOne({ where: { username } });
  if (existingUsername) {
    const error = new Error('Tên đăng nhập đã tồn tại.');
    error.statusCode = 400;
    throw error;
  }

  // Check duplicate email
  const existingEmail = await User.findOne({ where: { email } });
  if (existingEmail) {
    const error = new Error('Email đã được sử dụng.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.create({
    username,
    email,
    passwordHash: password, // hook beforeCreate hashes it
    fullName,
    phone,
    role,
    status: 'active',
  });

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
  };
}

/**
 * Toggle status of a user (active <-> locked)
 */
async function toggleUserStatus(id, currentUserId) {
  if (Number(id) === currentUserId) {
    const error = new Error('Không thể thay đổi trạng thái tài khoản của chính mình.');
    error.statusCode = 400;
    throw error;
  }

  const user = await User.findByPk(id);
  if (!user) {
    const error = new Error('Không tìm thấy người dùng');
    error.statusCode = 404;
    throw error;
  }

  const newStatus = user.status === 'active' ? 'locked' : 'active';
  await user.update({ status: newStatus });

  return {
    message: `Tài khoản "${user.username}" đã được ${newStatus === 'locked' ? 'khóa' : 'mở khóa'} thành công.`,
    status: newStatus,
  };
}

/**
 * Update user information
 */
async function updateUser(id, updateData, currentUser) {
  const data = { ...updateData };

  // Readers & librarians cannot change their own role or status
  if (currentUser.role !== 'admin') {
    delete data.role;
    delete data.status;
  }

  if (Number(id) !== currentUser.id && currentUser.role !== 'admin') {
    const error = new Error('Forbidden');
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findByPk(id);
  if (!user) {
    const error = new Error('Không tìm thấy người dùng');
    error.statusCode = 404;
    throw error;
  }

  await user.update(data);

  return {
    message: 'Cập nhật thành công.',
  };
}

/**
 * Delete user (Admin only)
 */
async function deleteUser(id, currentUserId) {
  if (Number(id) === currentUserId) {
    const error = new Error('Không thể xóa tài khoản của chính mình.');
    error.statusCode = 400;
    throw error;
  }

  const deleted = await User.destroy({ where: { id } });
  if (!deleted) {
    const error = new Error('Không tìm thấy người dùng');
    error.statusCode = 404;
    throw error;
  }

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
