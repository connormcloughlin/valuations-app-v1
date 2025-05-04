const jwt = require('jsonwebtoken');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token.' });
  }
};

/**
 * Middleware to check admin role
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
  }
  next();
};

/**
 * Middleware to check surveyor role
 */
const isSurveyor = (req, res, next) => {
  if (!req.user || req.user.role !== 'surveyor') {
    return res.status(403).json({ message: 'Access denied. Surveyor privileges required.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isAdmin,
  isSurveyor
}; 