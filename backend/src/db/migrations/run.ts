import db from '../index';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('Running database migrations...');

  try {
    // Create migrations table if it doesn't exist
    await db.none(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Get list of applied migrations
    const appliedMigrations = await db.map(
      'SELECT name FROM migrations ORDER BY id',
      [],
      (row: { name: string }) => row.name
    );

    // Get all migration files
    const migrationFiles = fs
      .readdirSync(__dirname)
      .filter(file => file.endsWith('.sql'))
      .sort();

    // Apply migrations that haven't been applied yet
    for (const file of migrationFiles) {
      if (!appliedMigrations.includes(file)) {
        console.log(`Applying migration: ${file}`);
        const migrationPath = path.join(__dirname, file);
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        // Run the migration in a transaction
        await db.tx(async t => {
          await t.none(migrationSql);
          await t.none('INSERT INTO migrations(name) VALUES($1)', [file]);
        });

        console.log(`Migration applied: ${file}`);
      } else {
        console.log(`Migration already applied: ${file}`);
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run migrations
runMigrations();
