import { Response } from 'express';
import { AuthRequest } from '../utils/auth';
import GeodeModel from '../models/geode.model';
import AchievementModel from '../models/achievement.model';
import AnalyticsModel from '../models/analytics.model';
import LeaderboardModel from '../models/leaderboard.model';

export const discoverGeode = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Log click event
    await AnalyticsModel.logEvent(userId, 'click');
    
    // Discover geode
    const discoveryResult = await GeodeModel.discoverGeode(userId);
    
    // If no energy, return early
    if (!discoveryResult.geode_id) {
      return res.status(200).json({
        message: 'No energy left',
        discovery: null,
        energy: 0
      });
    }
    
    // Check for achievements
    const completedAchievements = await AchievementModel.checkAchievements(userId);
    
    // Update leaderboards
    await LeaderboardModel.updateLeaderboards();
    
    // Return discovery result
    res.status(200).json({
      message: 'Geode discovered',
      discovery: discoveryResult,
      completedAchievements: completedAchievements.length > 0 ? completedAchievements : null
    });
  } catch (error) {
    console.error('Discover geode error:', error);
    res.status(500).json({ error: 'Failed to discover geode' });
  }
};

export const getUserGeodes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user's geodes
    const geodes = await GeodeModel.getUserGeodes(userId);
    
    res.status(200).json({ geodes });
  } catch (error) {
    console.error('Get user geodes error:', error);
    res.status(500).json({ error: 'Failed to get user geodes' });
  }
};

export const getAllGeodeTypes = async (req: AuthRequest, res: Response) => {
  try {
    // Get all geode types
    const geodeTypes = await GeodeModel.getAllGeodeTypes();
    
    res.status(200).json({ geodeTypes });
  } catch (error) {
    console.error('Get all geode types error:', error);
    res.status(500).json({ error: 'Failed to get geode types' });
  }
};

export const getFusionRecipes = async (req: AuthRequest, res: Response) => {
  try {
    // Get all fusion recipes
    const recipes = await GeodeModel.getFusionRecipes();
    
    res.status(200).json({ recipes });
  } catch (error) {
    console.error('Get fusion recipes error:', error);
    res.status(500).json({ error: 'Failed to get fusion recipes' });
  }
};

export const getUserAvailableFusions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user's available fusions
    const availableFusions = await GeodeModel.getUserAvailableFusions(userId);
    
    res.status(200).json({ availableFusions });
  } catch (error) {
    console.error('Get user available fusions error:', error);
    res.status(500).json({ error: 'Failed to get available fusions' });
  }
};

export const fuseGeodes = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    const { recipeId } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!recipeId) {
      return res.status(400).json({ error: 'Recipe ID is required' });
    }
    
    // Perform fusion
    const success = await GeodeModel.fuseGeodes(userId, recipeId);
    
    if (!success) {
      return res.status(400).json({ error: 'Fusion failed. You may not have enough geodes.' });
    }
    
    // Log fusion event
    await AnalyticsModel.logEvent(userId, 'fusion', { recipeId });
    
    // Check for achievements
    const completedAchievements = await AchievementModel.checkAchievements(userId);
    
    // Get updated geodes
    const geodes = await GeodeModel.getUserGeodes(userId);
    
    // Get updated available fusions
    const availableFusions = await GeodeModel.getUserAvailableFusions(userId);
    
    res.status(200).json({
      message: 'Fusion successful',
      geodes,
      availableFusions,
      completedAchievements: completedAchievements.length > 0 ? completedAchievements : null
    });
  } catch (error) {
    console.error('Fuse geodes error:', error);
    res.status(500).json({ error: 'Failed to fuse geodes' });
  }
};

export const getUserAchievements = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user's achievements
    const achievements = await AchievementModel.getUserAchievements(userId);
    
    res.status(200).json({ achievements });
  } catch (error) {
    console.error('Get user achievements error:', error);
    res.status(500).json({ error: 'Failed to get user achievements' });
  }
};

export const getLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string || 'total_points';
    const limit = parseInt(req.query.limit as string || '100');
    
    // Get global leaderboard
    const leaderboard = await LeaderboardModel.getGlobalLeaderboard(type, limit);
    
    res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get leaderboard' });
  }
};

export const getFriendsLeaderboard = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const type = req.query.type as string || 'total_points';
    
    // Get friends leaderboard
    const leaderboard = await LeaderboardModel.getFriendsLeaderboard(userId, type);
    
    res.status(200).json({ leaderboard });
  } catch (error) {
    console.error('Get friends leaderboard error:', error);
    res.status(500).json({ error: 'Failed to get friends leaderboard' });
  }
};

export const getUserAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Get user's analytics summary
    const summary = await AnalyticsModel.getUserSummary(userId);
    
    // Get referral analytics
    const referralAnalytics = await AnalyticsModel.getReferralAnalytics(userId);
    
    // Get user activity over time
    const activityOverTime = await AnalyticsModel.getUserActivityOverTime(userId);
    
    res.status(200).json({
      summary,
      referralAnalytics,
      activityOverTime
    });
  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({ error: 'Failed to get user analytics' });
  }
};
