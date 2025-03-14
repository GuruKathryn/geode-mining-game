import express, { RequestHandler } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticate, rateLimit, securityLogger } from '../utils/auth';

const router = express.Router();

// Apply rate limiting to auth routes
const authRateLimit = rateLimit(10, 60 * 1000); // 10 requests per minute

// Register route
router.post('/register', authRateLimit as RequestHandler, securityLogger as RequestHandler, authController.register as RequestHandler);

// Login route
router.post('/login', authRateLimit as RequestHandler, securityLogger as RequestHandler, authController.login as RequestHandler);

// Get profile route (requires authentication)
router.get('/profile', authenticate as RequestHandler, authController.getProfile as RequestHandler);

export default router;
