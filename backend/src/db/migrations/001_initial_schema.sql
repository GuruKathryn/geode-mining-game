-- Create enum types
CREATE TYPE rarity_type AS ENUM ('common', 'uncommon', 'rare', 'epic', 'legendary');
CREATE TYPE event_type AS ENUM (
  'click', 
  'geode_found', 
  'fusion', 
  'referral_sent', 
  'referral_signup', 
  'referral_bonus',
  'login',
  'energy_refill'
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  referral_code VARCHAR(20) UNIQUE NOT NULL,
  referred_by_id UUID REFERENCES users(id),
  total_points INTEGER NOT NULL DEFAULT 0,
  referral_points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login TIMESTAMP NOT NULL DEFAULT NOW(),
  energy INTEGER NOT NULL DEFAULT 100,
  energy_max INTEGER NOT NULL DEFAULT 100,
  energy_last_refill TIMESTAMP NOT NULL DEFAULT NOW(),
  login_streak INTEGER NOT NULL DEFAULT 0,
  last_daily_login TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Geode types table
CREATE TABLE geode_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  rarity rarity_type NOT NULL,
  base_point_value INTEGER NOT NULL,
  image_url VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  sound_effect_url VARCHAR(255)
);

-- User inventory table
CREATE TABLE user_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  geode_type_id UUID NOT NULL REFERENCES geode_types(id),
  quantity INTEGER NOT NULL DEFAULT 0,
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, geode_type_id)
);

-- Fusion recipes table
CREATE TABLE fusion_recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_geode_id UUID NOT NULL REFERENCES geode_types(id),
  input_quantity INTEGER NOT NULL,
  output_geode_id UUID NOT NULL REFERENCES geode_types(id),
  output_quantity INTEGER NOT NULL DEFAULT 1
);

-- Achievements table
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  threshold INTEGER NOT NULL,
  point_reward INTEGER NOT NULL DEFAULT 0,
  image_url VARCHAR(255)
);

-- User achievements table
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMP,
  notified BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(user_id, achievement_id)
);

-- Analytics events table
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- Referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points_earned INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  level INTEGER NOT NULL DEFAULT 1,
  UNIQUE(referrer_id, referred_id)
);

-- Leaderboard entries table
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  leaderboard_type VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  rank INTEGER,
  UNIQUE(user_id, leaderboard_type)
);

-- Security logs table
CREATE TABLE security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL,
  ip_address VARCHAR(50),
  device_info JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_suspicious BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create indexes for performance
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_referred_by_id ON users(referred_by_id);
CREATE INDEX idx_user_inventory_user_id ON user_inventory(user_id);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX idx_leaderboard_entries_leaderboard_type ON leaderboard_entries(leaderboard_type, score DESC);
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_is_suspicious ON security_logs(is_suspicious);

-- Insert default geode types
INSERT INTO geode_types (name, rarity, base_point_value, image_url, description, sound_effect_url) VALUES
('Rock', 'common', 1, '/assets/geodes/rock.png', 'Just a regular rock. Not worth much, but it''s a start!', '/assets/sounds/rock.mp3'),
('Agate', 'common', 5, '/assets/geodes/agate.png', 'A common agate with subtle banding patterns.', '/assets/sounds/agate.mp3'),
('Quartz', 'common', 10, '/assets/geodes/quartz.png', 'Clear quartz crystal with a glassy luster.', '/assets/sounds/quartz.mp3'),
('Citrine', 'uncommon', 25, '/assets/geodes/citrine.png', 'A vibrant yellow variety of quartz.', '/assets/sounds/citrine.mp3'),
('Amethyst', 'uncommon', 50, '/assets/geodes/amethyst.png', 'Purple variety of quartz, highly prized.', '/assets/sounds/amethyst.mp3'),
('Emerald', 'rare', 100, '/assets/geodes/emerald.png', 'A brilliant green gemstone.', '/assets/sounds/emerald.mp3'),
('Ruby', 'rare', 150, '/assets/geodes/ruby.png', 'A deep red gemstone of remarkable hardness.', '/assets/sounds/ruby.mp3'),
('Sapphire', 'rare', 200, '/assets/geodes/sapphire.png', 'A blue gemstone variety of corundum.', '/assets/sounds/sapphire.mp3'),
('Diamond', 'epic', 500, '/assets/geodes/diamond.png', 'The hardest known natural material.', '/assets/sounds/diamond.mp3'),
('Ammonite', 'epic', 750, '/assets/geodes/ammonite.png', 'An ancient fossil with a spiral shape.', '/assets/sounds/ammonite.mp3'),
('Stardust', 'legendary', 1000, '/assets/geodes/stardust.png', 'Mysterious cosmic material with otherworldly properties.', '/assets/sounds/stardust.mp3'),
('Dragon Egg', 'legendary', 2000, '/assets/geodes/dragon_egg.png', 'An extremely rare crystallized dragon egg.', '/assets/sounds/dragon_egg.mp3');

-- Insert default fusion recipes
INSERT INTO fusion_recipes (input_geode_id, input_quantity, output_geode_id, output_quantity) VALUES
((SELECT id FROM geode_types WHERE name = 'Rock'), 5, (SELECT id FROM geode_types WHERE name = 'Agate'), 1),
((SELECT id FROM geode_types WHERE name = 'Agate'), 3, (SELECT id FROM geode_types WHERE name = 'Quartz'), 1),
((SELECT id FROM geode_types WHERE name = 'Quartz'), 3, (SELECT id FROM geode_types WHERE name = 'Citrine'), 1),
((SELECT id FROM geode_types WHERE name = 'Citrine'), 3, (SELECT id FROM geode_types WHERE name = 'Amethyst'), 1),
((SELECT id FROM geode_types WHERE name = 'Amethyst'), 3, (SELECT id FROM geode_types WHERE name = 'Emerald'), 1),
((SELECT id FROM geode_types WHERE name = 'Emerald'), 3, (SELECT id FROM geode_types WHERE name = 'Ruby'), 1),
((SELECT id FROM geode_types WHERE name = 'Ruby'), 3, (SELECT id FROM geode_types WHERE name = 'Sapphire'), 1),
((SELECT id FROM geode_types WHERE name = 'Sapphire'), 3, (SELECT id FROM geode_types WHERE name = 'Diamond'), 1),
((SELECT id FROM geode_types WHERE name = 'Diamond'), 3, (SELECT id FROM geode_types WHERE name = 'Ammonite'), 1),
((SELECT id FROM geode_types WHERE name = 'Ammonite'), 3, (SELECT id FROM geode_types WHERE name = 'Stardust'), 1),
((SELECT id FROM geode_types WHERE name = 'Stardust'), 3, (SELECT id FROM geode_types WHERE name = 'Dragon Egg'), 1);

-- Insert default achievements
INSERT INTO achievements (name, description, type, threshold, point_reward, image_url) VALUES
('First Click', 'Click on the cave for the first time', 'clicks', 1, 10, '/assets/achievements/first_click.png'),
('Dedicated Miner', 'Click 100 times', 'clicks', 100, 50, '/assets/achievements/dedicated_miner.png'),
('Mining Expert', 'Click 1,000 times', 'clicks', 1000, 200, '/assets/achievements/mining_expert.png'),
('Mining Legend', 'Click 10,000 times', 'clicks', 10000, 500, '/assets/achievements/mining_legend.png'),
('First Geode', 'Find your first geode', 'collection', 1, 10, '/assets/achievements/first_geode.png'),
('Collector', 'Collect 10 different types of geodes', 'collection', 10, 100, '/assets/achievements/collector.png'),
('Master Collector', 'Collect all types of geodes', 'collection', 12, 500, '/assets/achievements/master_collector.png'),
('First Fusion', 'Complete your first fusion', 'fusion', 1, 20, '/assets/achievements/first_fusion.png'),
('Fusion Expert', 'Complete 10 fusions', 'fusion', 10, 100, '/assets/achievements/fusion_expert.png'),
('Fusion Master', 'Complete 50 fusions', 'fusion', 50, 300, '/assets/achievements/fusion_master.png'),
('First Referral', 'Refer your first friend', 'referral', 1, 50, '/assets/achievements/first_referral.png'),
('Social Butterfly', 'Refer 5 friends', 'referral', 5, 200, '/assets/achievements/social_butterfly.png'),
('Influencer', 'Refer 20 friends', 'referral', 20, 500, '/assets/achievements/influencer.png'),
('First Login Streak', 'Login for 3 consecutive days', 'streak', 3, 30, '/assets/achievements/first_streak.png'),
('Weekly Devotion', 'Login for 7 consecutive days', 'streak', 7, 100, '/assets/achievements/weekly_devotion.png'),
('Monthly Dedication', 'Login for 30 consecutive days', 'streak', 30, 500, '/assets/achievements/monthly_dedication.png');

-- Create stored procedures for game mechanics

-- Refresh user energy procedure
CREATE OR REPLACE FUNCTION refresh_user_energy(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_record RECORD;
    current_energy INTEGER;
    time_passed INTERVAL;
    energy_to_add INTEGER;
BEGIN
    SELECT * INTO user_record FROM users WHERE id = user_id;
    
    time_passed := NOW() - user_record.energy_last_refill;
    energy_to_add := FLOOR(EXTRACT(EPOCH FROM time_passed) / 3600 * 5); -- 5 energy per hour
    
    current_energy := LEAST(user_record.energy_max, user_record.energy + energy_to_add);
    
    IF current_energy > user_record.energy THEN
        UPDATE users 
        SET energy = current_energy, 
            energy_last_refill = CASE 
                WHEN energy_to_add > 0 THEN NOW() 
                ELSE energy_last_refill 
            END
        WHERE id = user_id;
    END IF;
    
    RETURN current_energy;
END;
$$ LANGUAGE plpgsql;

-- Discover geode procedure
CREATE OR REPLACE FUNCTION discover_geode(user_id UUID)
RETURNS TABLE(geode_id UUID, geode_name VARCHAR, rarity TEXT, points_earned INTEGER) AS $$
DECLARE
    random_val FLOAT;
    selected_rarity rarity_type;
    selected_geode_id UUID;
    points INTEGER;
BEGIN
    -- Refresh user energy first
    PERFORM refresh_user_energy(user_id);
    
    -- Check if user has energy
    IF (SELECT energy FROM users WHERE id = user_id) <= 0 THEN
        RETURN QUERY SELECT NULL::UUID, 'No Energy'::VARCHAR, NULL::TEXT, 0;
        RETURN;
    END IF;
    
    -- Reduce energy
    UPDATE users SET energy = energy - 1 WHERE id = user_id;
    
    -- Random number for geode discovery
    random_val := random();
    
    -- Determine rarity based on probability
    IF random_val < 0.50 THEN
        selected_rarity := 'common';
    ELSIF random_val < 0.80 THEN
        selected_rarity := 'uncommon';
    ELSIF random_val < 0.95 THEN
        selected_rarity := 'rare';
    ELSIF random_val < 0.99 THEN
        selected_rarity := 'epic';
    ELSE
        selected_rarity := 'legendary';
    END IF;
    
    -- Select a random geode of the determined rarity
    SELECT id INTO selected_geode_id 
    FROM geode_types 
    WHERE rarity = selected_rarity 
    ORDER BY random() 
    LIMIT 1;
    
    -- Get point value
    SELECT base_point_value INTO points 
    FROM geode_types 
    WHERE id = selected_geode_id;
    
    -- Apply any user bonuses (e.g., streak bonus)
    SELECT points * (1 + (LEAST(login_streak, 7) * 0.05)) 
    INTO points 
    FROM users 
    WHERE id = user_id;
    
    -- Add to user inventory
    INSERT INTO user_inventory (user_id, geode_type_id, quantity)
    VALUES (user_id, selected_geode_id, 1)
    ON CONFLICT (user_id, geode_type_id) 
    DO UPDATE SET quantity = user_inventory.quantity + 1;
    
    -- Add points to user
    UPDATE users SET total_points = total_points + points WHERE id = user_id;
    
    -- Log the event
    INSERT INTO analytics_events (user_id, event_type, created_at, metadata)
    VALUES (user_id, 'geode_found', NOW(), jsonb_build_object(
        'geode_id', selected_geode_id,
        'points', points
    ));
    
    -- Return the result
    RETURN QUERY 
    SELECT 
        gt.id, 
        gt.name, 
        gt.rarity::TEXT, 
        points
    FROM geode_types gt
    WHERE gt.id = selected_geode_id;
END;
$$ LANGUAGE plpgsql;

-- Fuse geodes procedure
CREATE OR REPLACE FUNCTION fuse_geodes(
    user_id UUID, 
    recipe_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
    recipe_record RECORD;
    user_has_enough BOOLEAN;
BEGIN
    -- Get recipe details
    SELECT * INTO recipe_record FROM fusion_recipes WHERE id = recipe_id;
    
    -- Check if user has enough input geodes
    SELECT EXISTS (
        SELECT 1 FROM user_inventory 
        WHERE user_id = fuse_geodes.user_id 
        AND geode_type_id = recipe_record.input_geode_id
        AND quantity >= recipe_record.input_quantity
    ) INTO user_has_enough;
    
    IF NOT user_has_enough THEN
        RETURN FALSE;
    END IF;
    
    -- Begin transaction
    BEGIN
        -- Remove input geodes
        UPDATE user_inventory 
        SET quantity = quantity - recipe_record.input_quantity
        WHERE user_id = fuse_geodes.user_id 
        AND geode_type_id = recipe_record.input_geode_id;
        
        -- Add output geodes
        INSERT INTO user_inventory (user_id, geode_type_id, quantity)
        VALUES (fuse_geodes.user_id, recipe_record.output_geode_id, recipe_record.output_quantity)
        ON CONFLICT (user_id, geode_type_id) 
        DO UPDATE SET quantity = user_inventory.quantity + recipe_record.output_quantity;
        
        -- Log the event
        INSERT INTO analytics_events (user_id, event_type, created_at, metadata)
        VALUES (fuse_geodes.user_id, 'fusion', NOW(), jsonb_build_object(
            'recipe_id', recipe_id,
            'input_geode_id', recipe_record.input_geode_id,
            'input_quantity', recipe_record.input_quantity,
            'output_geode_id', recipe_record.output_geode_id,
            'output_quantity', recipe_record.output_quantity
        ));
        
        RETURN TRUE;
    EXCEPTION WHEN OTHERS THEN
        ROLLBACK;
        RETURN FALSE;
    END;
END;
$$ LANGUAGE plpgsql;

-- Process referral points procedure
CREATE OR REPLACE FUNCTION process_referral_points(
    user_id UUID, 
    points_earned INTEGER
) RETURNS VOID AS $$
DECLARE
    direct_referrer_id UUID;
    indirect_referrer_id UUID;
    direct_bonus INTEGER;
    indirect_bonus INTEGER;
BEGIN
    -- Find direct referrer
    SELECT referred_by_id INTO direct_referrer_id 
    FROM users 
    WHERE id = user_id;
    
    IF direct_referrer_id IS NOT NULL THEN
        -- Calculate direct referral bonus (25%)
        direct_bonus := FLOOR(points_earned * 0.25);
        
        -- Award points to direct referrer
        UPDATE users 
        SET total_points = total_points + direct_bonus,
            referral_points = referral_points + direct_bonus
        WHERE id = direct_referrer_id;
        
        -- Log the event
        INSERT INTO analytics_events (user_id, event_type, created_at, metadata)
        VALUES (direct_referrer_id, 'referral_bonus', NOW(), jsonb_build_object(
            'referred_user_id', user_id,
            'points_earned', points_earned,
            'bonus_points', direct_bonus,
            'level', 1
        ));
        
        -- Find indirect referrer (level 2)
        SELECT referred_by_id INTO indirect_referrer_id 
        FROM users 
        WHERE id = direct_referrer_id;
        
        IF indirect_referrer_id IS NOT NULL THEN
            -- Calculate indirect referral bonus (10%)
            indirect_bonus := FLOOR(points_earned * 0.1);
            
            -- Award points to indirect referrer
            UPDATE users 
            SET total_points = total_points + indirect_bonus,
                referral_points = referral_points + indirect_bonus
            WHERE id = indirect_referrer_id;
            
            -- Log the event
            INSERT INTO analytics_events (user_id, event_type, created_at, metadata)
            VALUES (indirect_referrer_id, 'referral_bonus', NOW(), jsonb_build_object(
                'referred_user_id', user_id,
                'points_earned', points_earned,
                'bonus_points', indirect_bonus,
                'level', 2
            ));
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Check and update login streak procedure
CREATE OR REPLACE FUNCTION check_login_streak(user_id UUID) RETURNS INTEGER AS $$
DECLARE
    last_login TIMESTAMP;
    current_streak INTEGER;
    time_since_last_login INTERVAL;
BEGIN
    -- Get user's last login and current streak
    SELECT last_daily_login, login_streak INTO last_login, current_streak
    FROM users
    WHERE id = user_id;
    
    -- Calculate time since last login
    time_since_last_login := NOW() - last_login;
    
    -- If last login was more than 48 hours ago, reset streak
    IF EXTRACT(EPOCH FROM time_since_last_login) > 172800 THEN -- 48 hours in seconds
        UPDATE users SET login_streak = 1, last_daily_login = NOW()
        WHERE id = user_id;
        RETURN 1;
    -- If last login was more than 24 hours ago but less than 48, increment streak
    ELSIF EXTRACT(EPOCH FROM time_since_last_login) > 86400 THEN -- 24 hours in seconds
        UPDATE users SET login_streak = login_streak + 1, last_daily_login = NOW()
        WHERE id = user_id;
        RETURN current_streak + 1;
    -- Otherwise, return current streak without updating
    ELSE
        RETURN current_streak;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Check achievements procedure
CREATE OR REPLACE FUNCTION check_achievements(user_id UUID) RETURNS SETOF UUID AS $$
DECLARE
    achievement_record RECORD;
    achievement_completed BOOLEAN;
BEGIN
    -- Loop through all achievements
    FOR achievement_record IN SELECT * FROM achievements LOOP
        -- Check if achievement is already completed
        IF EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = check_achievements.user_id 
            AND achievement_id = achievement_record.id 
            AND completed = TRUE
        ) THEN
            CONTINUE;
        END IF;
        
        -- Check if achievement criteria is met based on type
        CASE achievement_record.type
            WHEN 'clicks' THEN
                SELECT COUNT(*) >= achievement_record.threshold INTO achievement_completed
                FROM analytics_events
                WHERE user_id = check_achievements.user_id AND event_type = 'click';
                
            WHEN 'collection' THEN
                SELECT COUNT(DISTINCT geode_type_id) >= achievement_record.threshold INTO achievement_completed
                FROM user_inventory
                WHERE user_id = check_achievements.user_id AND quantity > 0;
                
            WHEN 'fusion' THEN
                SELECT COUNT(*) >= achievement_record.threshold INTO achievement_completed
                FROM analytics_events
                WHERE user_id = check_achievements.user_id AND event_type = 'fusion';
                
            WHEN 'referral' THEN
                SELECT COUNT(*) >= achievement_record.threshold INTO achievement_completed
                FROM referrals
                WHERE referrer_id = check_achievements.user_id;
                
            WHEN 'streak' THEN
                SELECT login_streak >= achievement_record.threshold INTO achievement_completed
                FROM users
                WHERE id = check_achievements.user_id;
                
            ELSE
                achievement_completed := FALSE;
        END CASE;
        
        -- If achievement is completed, update user_achievements and award points
        IF achievement_completed THEN
            -- Insert or update user achievement
            INSERT INTO user_achievements (user_id, achievement_id, completed, completed_at)
            VALUES (check_achievements.user_id, achievement_record.id, TRUE, NOW())
            ON CONFLICT (user_id, achievement_id) 
            DO UPDATE SET completed = TRUE, completed_at = NOW();
            
            -- Award points
            UPDATE users 
            SET total_points = total_points + achievement_record.point_reward
            WHERE id = check_achievements.user_id;
            
            -- Return the achievement ID
            RETURN NEXT achievement_record.id;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Update leaderboard procedure
CREATE OR REPLACE FUNCTION update_leaderboard() RETURNS VOID AS $$
BEGIN
    -- Update total points leaderboard
    INSERT INTO leaderboard_entries (user_id, leaderboard_type, score, updated_at)
    SELECT id, 'total_points', total_points, NOW()
    FROM users
    ON CONFLICT (user_id, leaderboard_type) 
    DO UPDATE SET score = EXCLUDED.score, updated_at = EXCLUDED.updated_at;
    
    -- Update referral points leaderboard
    INSERT INTO leaderboard_entries (user_id, leaderboard_type, score, updated_at)
    SELECT id, 'referral_points', referral_points, NOW()
    FROM users
    ON CONFLICT (user_id, leaderboard_type) 
    DO UPDATE SET score = EXCLUDED.score, updated_at = EXCLUDED.updated_at;
    
    -- Update ranks for total points
    WITH ranked_users AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
        FROM leaderboard_entries
        WHERE leaderboard_type = 'total_points'
    )
    UPDATE leaderboard_entries le
    SET rank = ru.new_rank
    FROM ranked_users ru
    WHERE le.id = ru.id AND le.leaderboard_type = 'total_points';
    
    -- Update ranks for referral points
    WITH ranked_users AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC) as new_rank
        FROM leaderboard_entries
        WHERE leaderboard_type = 'referral_points'
    )
    UPDATE leaderboard_entries le
    SET rank = ru.new_rank
    FROM ranked_users ru
    WHERE le.id = ru.id AND le.leaderboard_type = 'referral_points';
END;
$$ LANGUAGE plpgsql;
