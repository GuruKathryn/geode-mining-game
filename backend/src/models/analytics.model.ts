import db from '../db';

export type EventType = 'click' | 'geode_found' | 'fusion' | 'referral_sent' | 'referral_signup' | 'referral_bonus' | 'login' | 'energy_refill';

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: EventType;
  created_at: Date;
  metadata?: any;
}

export interface AnalyticsSummary {
  total_clicks: number;
  total_geodes_found: number;
  total_fusions: number;
  total_referrals: number;
  total_logins: number;
  average_session_length?: number;
  most_common_geode?: string;
  most_active_hour?: number;
}

class AnalyticsModel {
  /**
   * Log an analytics event
   */
  async logEvent(userId: string, eventType: EventType, metadata?: any): Promise<void> {
    try {
      await db.none(
        `INSERT INTO analytics_events (user_id, event_type, created_at, metadata)
         VALUES ($1, $2, NOW(), $3)`,
        [userId, eventType, metadata || {}]
      );
    } catch (error) {
      console.error('Error logging analytics event:', error);
      throw error;
    }
  }
  
  /**
   * Get user's analytics events
   */
  async getUserEvents(userId: string, limit: number = 100): Promise<AnalyticsEvent[]> {
    try {
      return await db.manyOrNone(`
        SELECT * FROM analytics_events
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `, [userId, limit]);
    } catch (error) {
      console.error('Error getting user analytics events:', error);
      throw error;
    }
  }
  
  /**
   * Get user's analytics summary
   */
  async getUserSummary(userId: string): Promise<AnalyticsSummary> {
    try {
      const summary = await db.one(`
        SELECT
          (SELECT COUNT(*) FROM analytics_events WHERE user_id = $1 AND event_type = 'click') as total_clicks,
          (SELECT COUNT(*) FROM analytics_events WHERE user_id = $1 AND event_type = 'geode_found') as total_geodes_found,
          (SELECT COUNT(*) FROM analytics_events WHERE user_id = $1 AND event_type = 'fusion') as total_fusions,
          (SELECT COUNT(*) FROM analytics_events WHERE user_id = $1 AND event_type = 'referral_sent') as total_referrals,
          (SELECT COUNT(*) FROM analytics_events WHERE user_id = $1 AND event_type = 'login') as total_logins
      `, [userId]);
      
      // Get most common geode
      const mostCommonGeode = await db.oneOrNone(`
        SELECT gt.name, COUNT(*) as count
        FROM analytics_events ae
        JOIN geode_types gt ON (ae.metadata->>'geode_id')::UUID = gt.id
        WHERE ae.user_id = $1 AND ae.event_type = 'geode_found'
        GROUP BY gt.name
        ORDER BY count DESC
        LIMIT 1
      `, [userId]);
      
      // Get most active hour
      const mostActiveHour = await db.oneOrNone(`
        SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
        FROM analytics_events
        WHERE user_id = $1
        GROUP BY hour
        ORDER BY count DESC
        LIMIT 1
      `, [userId]);
      
      return {
        ...summary,
        most_common_geode: mostCommonGeode?.name,
        most_active_hour: mostActiveHour?.hour
      };
    } catch (error) {
      console.error('Error getting user analytics summary:', error);
      throw error;
    }
  }
  
  /**
   * Get global analytics summary
   */
  async getGlobalSummary(): Promise<AnalyticsSummary> {
    try {
      const summary = await db.one(`
        SELECT
          (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'click') as total_clicks,
          (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'geode_found') as total_geodes_found,
          (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'fusion') as total_fusions,
          (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'referral_sent') as total_referrals,
          (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'login') as total_logins
      `);
      
      // Get most common geode
      const mostCommonGeode = await db.oneOrNone(`
        SELECT gt.name, COUNT(*) as count
        FROM analytics_events ae
        JOIN geode_types gt ON (ae.metadata->>'geode_id')::UUID = gt.id
        WHERE ae.event_type = 'geode_found'
        GROUP BY gt.name
        ORDER BY count DESC
        LIMIT 1
      `);
      
      // Get most active hour
      const mostActiveHour = await db.oneOrNone(`
        SELECT EXTRACT(HOUR FROM created_at) as hour, COUNT(*) as count
        FROM analytics_events
        GROUP BY hour
        ORDER BY count DESC
        LIMIT 1
      `);
      
      // Get average session length (time between login and last activity)
      const avgSessionLength = await db.oneOrNone(`
        WITH login_events AS (
          SELECT user_id, created_at as login_time
          FROM analytics_events
          WHERE event_type = 'login'
        ),
        last_events AS (
          SELECT user_id, created_at as last_time,
                 ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
          FROM analytics_events
        ),
        sessions AS (
          SELECT le.user_id, le.login_time, lae.last_time,
                 EXTRACT(EPOCH FROM (lae.last_time - le.login_time)) as session_length
          FROM login_events le
          JOIN last_events lae ON le.user_id = lae.user_id
          WHERE lae.rn = 1
        )
        SELECT AVG(session_length) as avg_session_length
        FROM sessions
        WHERE session_length > 0 AND session_length < 86400 -- Filter out sessions longer than a day
      `);
      
      return {
        ...summary,
        most_common_geode: mostCommonGeode?.name,
        most_active_hour: mostActiveHour?.hour,
        average_session_length: avgSessionLength?.avg_session_length
      };
    } catch (error) {
      console.error('Error getting global analytics summary:', error);
      throw error;
    }
  }
  
  /**
   * Get referral analytics
   */
  async getReferralAnalytics(userId: string): Promise<any> {
    try {
      return await db.one(`
        SELECT
          (SELECT COUNT(*) FROM referrals WHERE referrer_id = $1) as total_referrals,
          (SELECT SUM(points_earned) FROM referrals WHERE referrer_id = $1) as total_points_earned,
          (SELECT COUNT(*) FROM referrals r
           JOIN users u ON r.referred_id = u.id
           WHERE r.referrer_id = $1 AND u.login_streak > 0) as active_referrals
      `, [userId]);
    } catch (error) {
      console.error('Error getting referral analytics:', error);
      throw error;
    }
  }
  
  /**
   * Get user activity over time
   */
  async getUserActivityOverTime(userId: string, days: number = 30): Promise<any[]> {
    try {
      return await db.manyOrNone(`
        WITH days AS (
          SELECT generate_series(
            date_trunc('day', NOW() - interval '${days} days'),
            date_trunc('day', NOW()),
            interval '1 day'
          ) as day
        ),
        daily_events AS (
          SELECT date_trunc('day', created_at) as day, COUNT(*) as event_count
          FROM analytics_events
          WHERE user_id = $1
          AND created_at >= NOW() - interval '${days} days'
          GROUP BY day
        )
        SELECT d.day, COALESCE(de.event_count, 0) as event_count
        FROM days d
        LEFT JOIN daily_events de ON d.day = de.day
        ORDER BY d.day
      `, [userId]);
    } catch (error) {
      console.error('Error getting user activity over time:', error);
      throw error;
    }
  }
}

export default new AnalyticsModel();
