import db from '../db';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  type: string;
  threshold: number;
  point_reward: number;
  image_url?: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  completed: boolean;
  completed_at?: Date;
  notified: boolean;
  achievement?: Achievement; // Joined data
}

class AchievementModel {
  /**
   * Get all achievements
   */
  async getAllAchievements(): Promise<Achievement[]> {
    try {
      return await db.manyOrNone('SELECT * FROM achievements ORDER BY threshold');
    } catch (error) {
      console.error('Error getting all achievements:', error);
      throw error;
    }
  }
  
  /**
   * Get achievement by ID
   */
  async getAchievementById(id: string): Promise<Achievement | null> {
    try {
      return await db.oneOrNone('SELECT * FROM achievements WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error getting achievement by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      return await db.manyOrNone(`
        SELECT ua.*, a.name, a.description, a.type, a.threshold, a.point_reward, a.image_url
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1
        ORDER BY ua.completed_at DESC
      `, [userId]);
    } catch (error) {
      console.error('Error getting user achievements:', error);
      throw error;
    }
  }
  
  /**
   * Get user's completed achievements
   */
  async getUserCompletedAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      return await db.manyOrNone(`
        SELECT ua.*, a.name, a.description, a.type, a.threshold, a.point_reward, a.image_url
        FROM user_achievements ua
        JOIN achievements a ON ua.achievement_id = a.id
        WHERE ua.user_id = $1 AND ua.completed = true
        ORDER BY ua.completed_at DESC
      `, [userId]);
    } catch (error) {
      console.error('Error getting user completed achievements:', error);
      throw error;
    }
  }
  
  /**
   * Get user's pending achievements
   */
  async getUserPendingAchievements(userId: string): Promise<UserAchievement[]> {
    try {
      // Get all achievements
      const allAchievements = await this.getAllAchievements();
      
      // Get user's achievements
      const userAchievements = await this.getUserAchievements(userId);
      
      // Create a map of achievement IDs that the user has
      const userAchievementMap = new Map<string, UserAchievement>();
      userAchievements.forEach(ua => {
        userAchievementMap.set(ua.achievement_id, ua);
      });
      
      // Create pending achievements for those the user doesn't have yet
      const pendingAchievements: UserAchievement[] = [];
      
      for (const achievement of allAchievements) {
        if (!userAchievementMap.has(achievement.id)) {
          pendingAchievements.push({
            id: '',
            user_id: userId,
            achievement_id: achievement.id,
            completed: false,
            notified: false,
            achievement
          });
        } else if (!userAchievementMap.get(achievement.id)!.completed) {
          // Include incomplete achievements
          const ua = userAchievementMap.get(achievement.id)!;
          ua.achievement = achievement;
          pendingAchievements.push(ua);
        }
      }
      
      return pendingAchievements;
    } catch (error) {
      console.error('Error getting user pending achievements:', error);
      throw error;
    }
  }
  
  /**
   * Check and update user achievements
   */
  async checkAchievements(userId: string): Promise<string[]> {
    try {
      const achievementIds = await db.map(
        'SELECT * FROM check_achievements($1)',
        [userId],
        (row: any) => row.check_achievements
      );
      
      // Get achievement details for the completed achievements
      const completedAchievements = [];
      
      if (achievementIds && achievementIds.length > 0) {
        for (const id of achievementIds) {
          const achievement = await this.getAchievementById(id);
          if (achievement) {
            completedAchievements.push(achievement);
          }
        }
      }
      
      return achievementIds || [];
    } catch (error) {
      console.error('Error checking achievements:', error);
      throw error;
    }
  }
  
  /**
   * Mark achievement as notified
   */
  async markAsNotified(userId: string, achievementId: string): Promise<void> {
    try {
      await db.none(
        'UPDATE user_achievements SET notified = true WHERE user_id = $1 AND achievement_id = $2',
        [userId, achievementId]
      );
    } catch (error) {
      console.error('Error marking achievement as notified:', error);
      throw error;
    }
  }
}

export default new AchievementModel();
