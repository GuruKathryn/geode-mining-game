import { v4 as uuidv4 } from 'uuid';
import db from '../db';
import bcrypt from 'bcrypt';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  referral_code: string;
  referred_by_id?: string;
  total_points: number;
  referral_points: number;
  created_at: Date;
  last_login: Date;
  energy: number;
  energy_max: number;
  energy_last_refill: Date;
  login_streak: number;
  last_daily_login: Date;
}

export interface UserCreationData {
  email: string;
  password: string;
  referred_by_code?: string;
}

class UserModel {
  /**
   * Create a new user
   */
  async create(userData: UserCreationData): Promise<User> {
    try {
      // Generate password hash
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);
      
      // Generate unique referral code
      const referralCode = this.generateReferralCode();
      
      // Find referrer if referral code provided
      let referredById = null;
      if (userData.referred_by_code) {
        const referrer = await db.oneOrNone(
          'SELECT id FROM users WHERE referral_code = $1',
          [userData.referred_by_code]
        );
        if (referrer) {
          referredById = referrer.id;
        }
      }
      
      // Create user
      const user = await db.one(
        `INSERT INTO users (
          email, password_hash, referral_code, referred_by_id,
          energy, energy_max, energy_last_refill
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [
          userData.email,
          passwordHash,
          referralCode,
          referredById,
          parseInt(process.env.ENERGY_MAX || '100'),
          parseInt(process.env.ENERGY_MAX || '100')
        ]
      );
      
      // If user was referred, create referral record
      if (referredById) {
        await db.none(
          'INSERT INTO referrals (referrer_id, referred_id, created_at) VALUES ($1, $2, NOW())',
          [referredById, user.id]
        );
        
        // Log referral signup event
        await db.none(
          `INSERT INTO analytics_events (user_id, event_type, created_at, metadata)
           VALUES ($1, 'referral_signup', NOW(), $2)`,
          [
            user.id,
            { referrer_id: referredById }
          ]
        );
      }
      
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }
  
  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE id = $1', [id]);
      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }
  
  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE email = $1', [email]);
      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }
  
  /**
   * Find user by referral code
   */
  async findByReferralCode(code: string): Promise<User | null> {
    try {
      const user = await db.oneOrNone('SELECT * FROM users WHERE referral_code = $1', [code]);
      return user;
    } catch (error) {
      console.error('Error finding user by referral code:', error);
      throw error;
    }
  }
  
  /**
   * Update user's last login time and check login streak
   */
  async updateLoginTime(id: string): Promise<number> {
    try {
      // Update last login time
      await db.none('UPDATE users SET last_login = NOW() WHERE id = $1', [id]);
      
      // Check and update login streak
      const streak = await db.func('check_login_streak', [id]);
      return streak[0].check_login_streak;
    } catch (error) {
      console.error('Error updating login time:', error);
      throw error;
    }
  }
  
  /**
   * Verify password for user
   */
  async verifyPassword(user: User, password: string): Promise<boolean> {
    try {
      return await bcrypt.compare(password, user.password_hash);
    } catch (error) {
      console.error('Error verifying password:', error);
      throw error;
    }
  }
  
  /**
   * Generate a unique referral code
   */
  private generateReferralCode(): string {
    // Generate a code based on timestamp and random characters
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${timestamp.substring(timestamp.length - 3)}${random}`.toUpperCase();
  }
}

export default new UserModel();
