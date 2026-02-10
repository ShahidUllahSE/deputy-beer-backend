import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): any => {
  const token = req.headers.authorization?.split(' ')[1] || req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId && !decoded._id && !decoded.id) {
      return res.status(400).json({ message: 'Invalid token structure, user ID missing.' });
    }

    req.body.userId = decoded.userId || decoded._id || decoded.id;
    next();
  } catch (error) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }
};
