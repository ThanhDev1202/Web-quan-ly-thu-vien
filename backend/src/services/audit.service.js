const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');

/**
 * Get audit logs with pagination and filters (Admin only)
 * @param {Object} options
 * @param {number} options.page     - trang hiện tại (bắt đầu từ 1)
 * @param {number} options.limit    - số bản ghi mỗi trang
 * @param {string} options.action   - lọc theo hành động (phân loại)
 * @param {string} options.dateFrom - lọc từ ngày (ISO string hoặc YYYY-MM-DD)
 * @param {string} options.dateTo   - lọc đến ngày (ISO string hoặc YYYY-MM-DD)
 */
async function getAuditLogs({ page = 1, limit = 20, action, dateFrom, dateTo } = {}) {
  const offset = (page - 1) * limit;
  const where = {};

  if (action) {
    where.action = action;
  }

  if (dateFrom || dateTo) {
    where.created_at = {};
    if (dateFrom) {
      where.created_at[Op.gte] = new Date(dateFrom + 'T00:00:00.000Z');
    }
    if (dateTo) {
      where.created_at[Op.lte] = new Date(dateTo + 'T23:59:59.999Z');
    }
  }

  const { count, rows } = await AuditLog.findAndCountAll({
    where,
    include: [{ model: User, attributes: ['id', 'username', 'fullName', 'role'] }],
    order: [['created_at', 'DESC']],
    limit,
    offset,
  });

  return {
    data: rows,
    pagination: {
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      hasMore: page * limit < count,
    },
  };
}

/**
 * Lấy danh sách các loại action đã có trong DB (để hiển thị bộ lọc)
 */
async function getDistinctActions() {
  const results = await AuditLog.findAll({
    attributes: ['action'],
    group: ['action'],
    order: [['action', 'ASC']],
  });
  return results.map(r => r.action);
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

async function getauditLogsByUserId(userId, limit = 100) {
  return await AuditLog.findAll({
    where: { userId },
    include: [{ model: User, attributes: ['id', 'username', 'fullName', 'role'] }],
    order: [['created_at', 'DESC']],
    limit,
  });
}

module.exports = {
  getAuditLogs,
  getDistinctActions,
  createAuditLog,
  getauditLogsByUserId,
};
