const jwt = require('jsonwebtoken');
const User = require('../../models/User/User');

const userAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization header missing or invalid' });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token: user not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('User auth error:', error);
    return res.status(401).json({ message: 'Unauthorized', error: error.message });
  }
};

module.exports = userAuthMiddleware;
