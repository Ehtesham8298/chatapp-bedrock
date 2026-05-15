const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  // Try JWT auth first (from logged-in users)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
      req.userId = decoded.userId;
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }

  // Fallback to API key
  const apiKey = req.headers['x-api-key'];
  if (apiKey && apiKey === process.env.API_KEY) {
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized' });
}

module.exports = { authMiddleware };
