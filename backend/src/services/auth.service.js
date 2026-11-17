const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Check email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check password format
function isValidPassword(password) {
  // Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

// REGISTER
async function register({ username, email, password, fullName, phone, role, status }) {
  // 1. Kiểm tra username đã tồn tại
  const existingUsername = await User.findOne({
    where: { username },
  });

  if (existingUsername) {
    const error = new Error('Username already exists');
    error.statusCode = 400;
    throw error;
  }

  // 2. Kiểm tra email đã tồn tại
  const existingEmail = await User.findOne({
    where: { email },
  });

  if (existingEmail) {
    const error = new Error('Email already exists');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidEmail(email)) {
    const error = new Error('Invalid email format');
    error.statusCode = 400;
    throw error;
  }

  if (!isValidPassword(password)) {
    const error = new Error(
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character'
    );
    error.statusCode = 400;
    throw error;
  }

  // 3. Tạo tài khoản mới
  const user = await User.create({
    username,
    email,
    passwordHash: password,
    fullName,
    phone,
    role: 'reader',
    status: 'active',
  });

  // 4. Trả về thông tin user
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    status: user.status,
  };
}

// LOGIN
async function login({ email, password }) {
  // 1. Kiểm tra email
  if (!email || typeof email !== 'string' || !email.trim()) {
    const error = new Error('Email is required');
    error.statusCode = 400;
    throw error;
  }

  // 2. Kiểm tra password
  if (!password || typeof password !== 'string' || !password.trim()) {
    const error = new Error('Password is required');
    error.statusCode = 400;
    throw error;
  }

  // 3. Tìm user theo email
  const user = await User.findOne({
    where: { email: email.trim() },
  });

  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 4. Kiểm tra mật khẩu
  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // 5. Kiểm tra trạng thái tài khoản
  if (user.status !== 'active') {
    const error = new Error('Account is locked');
    error.statusCode = 403;
    throw error;
  }

  // 6. Kiểm tra JWT_SECRET
  if (!process.env.JWT_SECRET) {
    const error = new Error('JWT_SECRET is not configured');
    error.statusCode = 500;
    throw error;
  }

  // 7. Tạo JWT
  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '8h',
    }
  );

  // 8. Trả về token và thông tin user
  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      role: user.role,
    },
  };
}

// LOGOUT
async function logout() {
  return {
    message: 'Logout successful',
  };
}

// CHANGE PASSWORD
async function changePassword(userID, oldPassword, newPassword) {
  const user = await User.findByPk(userID);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  // So sánh mật khẩu cũ với hash trong database
  const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Current password is invalid');
    error.statusCode = 400;
    throw error;
  }

  // Kiểm tra mật khẩu mới
  if (!isValidPassword(newPassword)) {
    const error = new Error('New password is invalid');
    error.statusCode = 400;
    throw error;
  }

  // Hash mật khẩu mới
  user.passwordHash = newPassword;
  await user.save();

  return {
    message: 'Password changed successfully',
  };
}

module.exports = {
  isValidEmail,
  isValidPassword,
  register,
  login,
  logout,
  changePassword,
  ChangePassword: changePassword, // alias for backwards compatibility
};
