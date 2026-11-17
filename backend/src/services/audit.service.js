const { AuditLog, User } = require('../models');

/**
 * Get recent audit logs (Admin only)
 */
async function getAuditLogs(limit = 100) {
  return await AuditLog.findAll({
    include: [{ model: User, attributes: ['id', 'username', 'fullName', 'role'] }],
    order: [['created_at', 'DESC']],
    limit,
  });
}

/**
 * Create a manual or automatic audit log entry
 */
async function createAuditLog({ userId, action, description }) {
  if (!action) {
    const error = new Error('action là bắt buộc.');
    error.statusCode = 400;
    throw error;
  }

  return await AuditLog.create({
    userId: userId || null,
    action,
    description,
  });
}

module.exports = {
  getAuditLogs,
  createAuditLog,
};
