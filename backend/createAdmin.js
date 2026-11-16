
const sequelize = require('./src/config/db');
const User = require('./src/models/user');

async function createAdmin() {
    try {
        await sequelize.authenticate();

        const existingAdmin = await User.findOne({
            where: { role: 'admin' }
        });

        if (existingAdmin) {
            console.log('Admin đã tồn tại:', existingAdmin.username);
            return;
        }

        const admin = await User.create({
            username: 'admin',
            email: 'admin@library.com',
            passwordHash: 'Hiep01012006@',
            fullName: 'System Administrator',
            phone: '0123456789',
            role: 'admin',
            status: 'active'
        });

        console.log('Tạo Admin thành công!');
        console.log('Username:', admin.username);
    } catch (error) {
        console.error('Lỗi:', error);
    } finally {
        await sequelize.close();
    }
}

createAdmin();
