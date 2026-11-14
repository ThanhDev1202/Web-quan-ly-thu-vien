
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

//check email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

//check password format
function isValidPassword(password) {
    // Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
}

// REGISTER
async function register({ username, email, password, fullName, phone, role, status }) {
    // 1. Kiểm tra username đã tồn tại
    const existingUsername = await User.findOne({
        where: { username }
    });

    if (existingUsername) {
        throw new Error('Username already exists');
    }

    // 2. Kiểm tra email đã tồn tại
    const existingEmail = await User.findOne({
        where: { email }
    });

    if (existingEmail) {
        throw new Error('Email already exists');
    }
    
   if (!isValidEmail(email)) {
        throw new Error('Invalid email format');
    }

    if( !isValidPassword(password)) {
        throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character');
    }

    // 3. Tạo tài khoản mới
    const user = await User.create({
        username,
        email,
        passwordHash: password,
        fullName,
        phone,
        role: 'reader',
        status: 'active'
    });

    // 4. Trả về thông tin user
    return {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        status: user.status
    };
}

// LOGIN


async function login({ email, password }) {
//1. Kiểm tra email và password có tồn tại không
      if (!email || !email.trim()) {
        throw new Error('Email is required');
    }
    if (!password || !password.trim()) {
        throw new Error('Password is required');
    }

    // 2. Tìm user theo email
    const user = await User.findOne({
        where: { email }
    }); 
    // 3.kiểm tra user
    if (!user) {
        throw new Error('Invalid email or password');
    }
    // 4. Kiểm tra password
    const isMatch = await bcrypt.compare(
        password,
        user.passwordHash
    );



    if (!isMatch) {
        throw new Error('Invalid email or password');
    }

if (user.status !== 'active') {
        throw new Error('Account is locked');
    }

    // 4. Kiểm tra JWT_SECRET
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    // 5. Tạo JWT
    const token = jwt.sign(
        {
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '8h'
        }
    );

    // 6. Trả token và thông tin user
    return {
        token,
        user: {
            id: user.id,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            role: user.role
        }
    };
}

// LOGOUT
async function logout() {
    return {
        message: 'Logout successful'
    };
}

module.exports = {
    register,
    login,
    logout
};
