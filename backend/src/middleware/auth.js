
const jwt = require('jsonwebtoken');
require('dotenv').config();

// 1. Verify JWT
function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.trim()) {
        return res.status(401).json({
            message: 'Missing Authorization header'
        });
    }

    // Check Bearer Token format
    const parts = authHeader.trim().split(/\s+/);

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
            message: 'Invalid Authorization format'
        });
    }

    const token = parts[1];

    if (!token) {
        return res.status(401).json({
            message: 'Missing token'
        });
    }

    // Verify JWT
    try {
        const payload = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Check payload
        if (!payload || !payload.id || !payload.role) {
            return res.status(401).json({
                message: 'Invalid token payload'
            });
        }

        req.user = payload;

        next();

    } catch (err) {
        return res.status(401).json({
            message: 'Invalid or expired token'
        });
    }
}


// 2. Authorize Role
function optionalToken(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload;
      } catch (err) {
        // ignore invalid token for public reading
      }
    }
  }
  next();
}

function authorize(...allowedRoles) {
    return (req, res, next) => {

        // Check authentication
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthenticated'
            });
        }

        // Check user role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: 'Forbidden: Insufficient permissions'
            });
        }

        next();
    };
}


module.exports = {
    verifyToken,
    authorize
};

module.exports = { verifyToken, optionalToken, authorize };
