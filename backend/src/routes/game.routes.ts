import express, { RequestHandler } from 'express';
import * as gameController from '../controllers/game.controller';
import { authenticate, rateLimit } from '../utils/auth';

const router = express.Router();

// Apply authentication to all game routes
router.use(authenticate as RequestHandler);

// Apply rate limiting to game routes
const gameRateLimit = rateLimit(60, 60 * 1000); // 60 requests per minute
const clickRateLimit = rateLimit(10, 1000); // 10 clicks per second

// Geode discovery route (with stricter rate limiting)
router.post('/discover', clickRateLimit as RequestHandler, gameController.discoverGeode as RequestHandler);

// Get user's geodes
router.get('/geodes', gameRateLimit as RequestHandler, gameController.getUserGeodes as RequestHandler);

// Get all geode types
router.get('/geode-types', gameRateLimit as RequestHandler, gameController.getAllGeodeTypes as RequestHandler);

// Get fusion recipes
router.get('/fusion-recipes', gameRateLimit as RequestHandler, gameController.getFusionRecipes as RequestHandler);

// Get user's available fusions
router.get('/available-fusions', gameRateLimit as RequestHandler, gameController.getUserAvailableFusions as RequestHandler);

// Fuse geodes
router.post('/fuse', gameRateLimit as RequestHandler, gameController.fuseGeodes as RequestHandler);

// Get user's achievements
router.get('/achievements', gameRateLimit as RequestHandler, gameController.getUserAchievements as RequestHandler);

// Get global leaderboard
router.get('/leaderboard', gameRateLimit as RequestHandler, gameController.getLeaderboard as RequestHandler);

// Get friends leaderboard
router.get('/friends-leaderboard', gameRateLimit as RequestHandler, gameController.getFriendsLeaderboard as RequestHandler);

// Get user's analytics
router.get('/analytics', gameRateLimit as RequestHandler, gameController.getUserAnalytics as RequestHandler);

export default router;
