import { Request, Response, NextFunction } from 'express';
import UserModel from '../models/user.model';
import * as jwt from 'jsonwebtoken';

// JWT secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Interface for decoded JWT token
export interface DecodedToken {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

// Interface for request with user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

/**
 * Generate JWT token for user
 */
export const generateToken = (userId: string, email: string): string => {
  try {
    // @ts-ignore - Ignoring type issues with jwt.sign
    return jwt.sign(
      { userId, email },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Failed to generate authentication token');
  }
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): DecodedToken | null => {
  try {
    // @ts-ignore - Ignoring type issues with jwt.verify
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch (error) {
    console.error('Error verifying token:', error);
    return null;
  }
};

/**
 * Authentication middleware
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    // Check if user exists
    const user = await UserModel.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * Rate limiting middleware for security
 */
export const rateLimit = (maxRequests: number, timeWindow: number) => {
  const requests = new Map<string, { count: number, firstRequest: number }>();
  
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    if (!requests.has(ip)) {
      requests.set(ip, { count: 1, firstRequest: now });
      return next();
    }
    
    const requestData = requests.get(ip)!;
    
    // Reset if time window has passed
    if (now - requestData.firstRequest > timeWindow) {
      requests.set(ip, { count: 1, firstRequest: now });
      return next();
    }
    
    // Increment count
    requestData.count++;
    
    // Check if limit exceeded
    if (requestData.count > maxRequests) {
      return res.status(429).json({ error: 'Too many requests, please try again later' });
    }
    
    next();
  };
};

/**
 * Security logging middleware
 */
export const securityLogger = (req: AuthRequest, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const userId = req.user?.id;
  
  // Log security event (could be expanded to write to database)
  console.log(`Security: ${new Date().toISOString()} | IP: ${ip} | User: ${userId || 'anonymous'} | UA: ${userAgent}`);
  
  next();
};
