import { Request, Response } from 'express';
import UserModel, { UserCreationData } from '../models/user.model';
import { generateToken } from '../utils/auth';
import AnalyticsModel from '../models/analytics.model';

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, referralCode } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Check if user already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }
    
    // Create user data object
    const userData: UserCreationData = {
      email,
      password,
      referred_by_code: referralCode
    };
    
    // Create user
    const user = await UserModel.create(userData);
    
    // Generate token
    const token = generateToken(user.id, user.email);
    
    // Log login event
    await AnalyticsModel.logEvent(user.id, 'login');
    
    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        referralCode: user.referral_code,
        totalPoints: user.total_points,
        energy: user.energy,
        energyMax: user.energy_max,
        loginStreak: user.login_streak
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isPasswordValid = await UserModel.verifyPassword(user, password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update login time and get streak
    const loginStreak = await UserModel.updateLoginTime(user.id);
    
    // Generate token
    const token = generateToken(user.id, user.email);
    
    // Log login event
    await AnalyticsModel.logEvent(user.id, 'login');
    
    // Return user data and token
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        referralCode: user.referral_code,
        totalPoints: user.total_points,
        energy: user.energy,
        energyMax: user.energy_max,
        loginStreak
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - User is attached by auth middleware
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Find user
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Return user data
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        referralCode: user.referral_code,
        totalPoints: user.total_points,
        referralPoints: user.referral_points,
        energy: user.energy,
        energyMax: user.energy_max,
        loginStreak: user.login_streak
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};
