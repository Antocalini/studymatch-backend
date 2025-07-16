// src/middlewares/auth.js
import jwt from 'jsonwebtoken';
import { User } from '../models/Users.js'; // Note the .js extension and named import
import dotenv from 'dotenv';

dotenv.config();

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to the request object (without password field - though not using password here)
      req.user = await User.findById(decoded.id); // Assuming JWT has 'id'
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found.' });
      }
      next();
    } catch (error) {
      console.error('Auth middleware error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token.' });
  }
};

export { protect };