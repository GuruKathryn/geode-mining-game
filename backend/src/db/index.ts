import pgPromise from 'pg-promise';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Database connection configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'geode_mining_game',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

// Initialize pg-promise
const pgp = pgPromise();

// Create the database instance
const db = pgp(config);

// Test the connection
db.connect()
  .then(obj => {
    console.log('Database connection successful');
    obj.done(); // release the connection
  })
  .catch(error => {
    console.error('Database connection error:', error.message || error);
  });

export default db;
export { pgp };
