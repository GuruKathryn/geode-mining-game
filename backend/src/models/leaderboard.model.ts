import db from '../db';

export interface LeaderboardEntry {
  id: string;
  user_id: string;
  leaderboard_type: string;
  score: number;
  updated_at: Date;
  rank: number;
  user_email?: string; // Joined data
  user_referral_code?: string; // Joined data
}

class LeaderboardModel {
  /**
   * Update leaderboards
   */
  async updateLeaderboards(): Promise<void> {
    try {
      await db.none('SELECT update_leaderboard()');
    } catch (error) {
      console.error('Error updating leaderboards:', error);
      throw error;
    }
  }
  
  /**
   * Get global leaderboard
   */
  async getGlobalLeaderboard(type: string = 'total_points', limit: number = 100): Promise<LeaderboardEntry[]> {
    try {
      return await db.manyOrNone(`
        SELECT le.*, u.email as user_email, u.referral_code as user_referral_code
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        WHERE le.leaderboard_type = $1
        ORDER BY le.score DESC
        LIMIT $2
      `, [type, limit]);
    } catch (error) {
      console.error('Error getting global leaderboard:', error);
      throw error;
    }
  }
  
  /**
   * Get user's rank
   */
  async getUserRank(userId: string, type: string = 'total_points'): Promise<LeaderboardEntry | null> {
    try {
      return await db.oneOrNone(`
        SELECT * FROM leaderboard_entries
        WHERE user_id = $1 AND leaderboard_type = $2
      `, [userId, type]);
    } catch (error) {
      console.error('Error getting user rank:', error);
      throw error;
    }
  }
  
  /**
   * Get user's friends leaderboard
   */
  async getFriendsLeaderboard(userId: string, type: string = 'total_points'): Promise<LeaderboardEntry[]> {
    try {
      return await db.manyOrNone(`
        WITH friends AS (
          -- Users who referred this user
          SELECT referred_by_id as friend_id FROM users WHERE id = $1
          UNION
          -- Users referred by this user
          SELECT referred_id as friend_id FROM referrals WHERE referrer_id = $1
          UNION
          -- Include the user themselves
          SELECT $1 as friend_id
        )
        SELECT le.*, u.email as user_email, u.referral_code as user_referral_code
        FROM leaderboard_entries le
        JOIN users u ON le.user_id = u.id
        WHERE le.user_id IN (SELECT friend_id FROM friends)
        AND le.leaderboard_type = $2
        ORDER BY le.score DESC
      `, [userId, type]);
    } catch (error) {
      console.error('Error getting friends leaderboard:', error);
      throw error;
    }
  }
  
  /**
   * Get leaderboard around user
   */
  async getLeaderboardAroundUser(userId: string, type: string = 'total_points', range: number = 5): Promise<LeaderboardEntry[]> {
    try {
      const userRank = await this.getUserRank(userId, type);
      
      if (!userRank) {
        return [];
      }
      
      return await db.manyOrNone(`
        WITH ranked_users AS (
          SELECT le.*, u.email as user_email, u.referral_code as user_referral_code,
                 ROW_NUMBER() OVER (ORDER BY le.score DESC) as row_num
          FROM leaderboard_entries le
          JOIN users u ON le.user_id = u.id
          WHERE le.leaderboard_type = $1
        ),
        user_row AS (
          SELECT row_num FROM ranked_users WHERE user_id = $2
        )
        SELECT ru.*
        FROM ranked_users ru, user_row ur
        WHERE ru.row_num BETWEEN (ur.row_num - $3) AND (ur.row_num + $3)
        ORDER BY ru.score DESC
      `, [type, userId, range]);
    } catch (error) {
      console.error('Error getting leaderboard around user:', error);
      throw error;
    }
  }
}

export default new LeaderboardModel();
