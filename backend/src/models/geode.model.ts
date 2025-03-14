import db from '../db';

export type RarityType = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface GeodeType {
  id: string;
  name: string;
  rarity: RarityType;
  base_point_value: number;
  image_url: string;
  description: string;
  sound_effect_url?: string;
}

export interface UserGeode {
  id: string;
  user_id: string;
  geode_type_id: string;
  quantity: number;
  last_updated: Date;
  geode?: GeodeType; // Joined data
}

export interface DiscoveryResult {
  geode_id: string;
  geode_name: string;
  rarity: string;
  points_earned: number;
}

class GeodeModel {
  /**
   * Get all geode types
   */
  async getAllGeodeTypes(): Promise<GeodeType[]> {
    try {
      return await db.manyOrNone('SELECT * FROM geode_types ORDER BY base_point_value');
    } catch (error) {
      console.error('Error getting all geode types:', error);
      throw error;
    }
  }
  
  /**
   * Get geode type by ID
   */
  async getGeodeTypeById(id: string): Promise<GeodeType | null> {
    try {
      return await db.oneOrNone('SELECT * FROM geode_types WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error getting geode type by ID:', error);
      throw error;
    }
  }
  
  /**
   * Get user's geode inventory
   */
  async getUserGeodes(userId: string): Promise<UserGeode[]> {
    try {
      return await db.manyOrNone(`
        SELECT ui.*, gt.name, gt.rarity, gt.base_point_value, gt.image_url, gt.description, gt.sound_effect_url
        FROM user_inventory ui
        JOIN geode_types gt ON ui.geode_type_id = gt.id
        WHERE ui.user_id = $1 AND ui.quantity > 0
        ORDER BY gt.base_point_value DESC
      `, [userId]);
    } catch (error) {
      console.error('Error getting user geodes:', error);
      throw error;
    }
  }
  
  /**
   * Discover a new geode for user
   */
  async discoverGeode(userId: string): Promise<DiscoveryResult> {
    try {
      const result = await db.one('SELECT * FROM discover_geode($1)', [userId]);
      return result;
    } catch (error) {
      console.error('Error discovering geode:', error);
      throw error;
    }
  }
  
  /**
   * Get fusion recipes
   */
  async getFusionRecipes(): Promise<any[]> {
    try {
      return await db.manyOrNone(`
        SELECT 
          fr.*,
          input_gt.name as input_name,
          input_gt.rarity as input_rarity,
          input_gt.image_url as input_image_url,
          output_gt.name as output_name,
          output_gt.rarity as output_rarity,
          output_gt.image_url as output_image_url
        FROM fusion_recipes fr
        JOIN geode_types input_gt ON fr.input_geode_id = input_gt.id
        JOIN geode_types output_gt ON fr.output_geode_id = output_gt.id
        ORDER BY input_gt.base_point_value
      `);
    } catch (error) {
      console.error('Error getting fusion recipes:', error);
      throw error;
    }
  }
  
  /**
   * Get fusion recipes available for a user
   */
  async getUserAvailableFusions(userId: string): Promise<any[]> {
    try {
      return await db.manyOrNone(`
        SELECT 
          fr.*,
          input_gt.name as input_name,
          input_gt.rarity as input_rarity,
          input_gt.image_url as input_image_url,
          output_gt.name as output_name,
          output_gt.rarity as output_rarity,
          output_gt.image_url as output_image_url,
          ui.quantity as user_quantity,
          CASE WHEN ui.quantity >= fr.input_quantity THEN true ELSE false END as can_fuse
        FROM fusion_recipes fr
        JOIN geode_types input_gt ON fr.input_geode_id = input_gt.id
        JOIN geode_types output_gt ON fr.output_geode_id = output_gt.id
        LEFT JOIN user_inventory ui ON fr.input_geode_id = ui.geode_type_id AND ui.user_id = $1
        ORDER BY can_fuse DESC, input_gt.base_point_value
      `, [userId]);
    } catch (error) {
      console.error('Error getting user available fusions:', error);
      throw error;
    }
  }
  
  /**
   * Perform fusion for a user
   */
  async fuseGeodes(userId: string, recipeId: string): Promise<boolean> {
    try {
      const result = await db.one('SELECT fuse_geodes($1, $2) as success', [userId, recipeId]);
      return result.success;
    } catch (error) {
      console.error('Error fusing geodes:', error);
      throw error;
    }
  }
}

export default new GeodeModel();
