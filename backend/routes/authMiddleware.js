import jwt from 'jsonwebtoken';

export default function (req, res, next) {
  // Get token from the header
  const token = req.header('x-auth-token');

  // Check if not token
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Verify token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.id; // Add user ID to the request object
    next();
  } catch (e) {
    res.status(400).json({ msg: 'Token is not valid' });
  }
}