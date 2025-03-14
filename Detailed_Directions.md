# Detailed Directions for Setting Up the Geode Mining Game on a VPS

This guide will walk you through setting up the Geode Mining Game on a Virtual Private Server (VPS) step by step. These instructions are designed to be easy to follow, even if you've never coded before.

## Table of Contents

1. [Getting a VPS](#1-getting-a-vps)
2. [Connecting to Your VPS](#2-connecting-to-your-vps)
3. [Setting Up the Server Environment](#3-setting-up-the-server-environment)
4. [Installing PostgreSQL Database](#4-installing-postgresql-database)
5. [Setting Up the Database](#5-setting-up-the-database)
6. [Getting the Game Code](#6-getting-the-game-code)
7. [Setting Up the Backend](#7-setting-up-the-backend)
8. [Setting Up the Frontend](#8-setting-up-the-frontend)
9. [Running the Game](#9-running-the-game)
10. [Making Your Game Accessible Online](#10-making-your-game-accessible-online)
11. [Maintaining Your Game](#11-maintaining-your-game)

## 1. Getting a VPS

A VPS (Virtual Private Server) is like renting a computer in the cloud that runs all the time.

1. Choose a VPS provider. Some popular options include:
   - DigitalOcean (www.digitalocean.com)
   - Linode (www.linode.com)
   - Vultr (www.vultr.com)
   - AWS Lightsail (aws.amazon.com/lightsail)

2. Sign up for an account and create a new VPS (often called a "Droplet" or "Instance").

3. Recommended specifications:
   - Operating System: Ubuntu 22.04 LTS
   - RAM: At least 2GB
   - CPU: 1-2 cores
   - Storage: At least 25GB SSD

4. Set up SSH keys or a password for your VPS (follow the provider's instructions).

5. Note down your VPS's IP address, which will look something like: `123.456.789.012`

## 2. Connecting to Your VPS

### On Windows:

1. Download and install PuTTY (https://www.putty.org/)
2. Open PuTTY
3. Enter your VPS IP address in the "Host Name" field
4. Click "Open"
5. Log in with your username (usually "root") and password

### On Mac or Linux:

1. Open Terminal
2. Type: `ssh root@your_vps_ip_address` (replace "your_vps_ip_address" with your actual VPS IP)
3. Type "yes" if asked about fingerprints
4. Enter your password when prompted

## 3. Setting Up the Server Environment

Once you're connected to your VPS, you'll need to set up the environment for running the game. Copy and paste these commands one by one:

```bash
# Update your system
apt update
apt upgrade -y

# Install Node.js (version 16)
curl -fsSL https://deb.nodesource.com/setup_16.x | bash -
apt install -y nodejs

# Check Node.js and npm versions
node -v  # Should show v16.x.x
npm -v   # Should show 8.x.x

# Install build tools
apt install -y build-essential

# Install Git
apt install -y git

# Install Nginx (web server)
apt install -y nginx

# Start Nginx and enable it to run at startup
systemctl start nginx
systemctl enable nginx

# Install PM2 (process manager for Node.js)
npm install -g pm2
```

## 4. Installing PostgreSQL Database

PostgreSQL is the database that will store all the game data, like user accounts and geode collections.

```bash
# Install PostgreSQL
apt install -y postgresql postgresql-contrib

# Check PostgreSQL status
systemctl status postgresql

# If it's not running, start it
systemctl start postgresql
systemctl enable postgresql
```

## 5. Setting Up the Database

Now you'll create a database and user for the game:

```bash
# Switch to the postgres user
sudo -i -u postgres

# Create a database for the game
createdb geode_mining_game

# Enter the PostgreSQL command line
psql

# Create a database user (change 'your_secure_password' to a strong password)
CREATE USER geode_user WITH ENCRYPTED PASSWORD 'your_secure_password';

# Grant privileges to the user
GRANT ALL PRIVILEGES ON DATABASE geode_mining_game TO geode_user;

# Exit the PostgreSQL command line
\q

# Exit the postgres user shell
exit
```

Make sure to remember the password you set for 'geode_user' as you'll need it later!

## 6. Getting the Game Code

Now you'll download the game code to your server:

```bash
# Create a directory for the game
mkdir -p /var/www/geode-mining-game

# Navigate to that directory
cd /var/www/geode-mining-game

# Clone the game repository (if you have a GitHub repository)
# Replace with your actual repository URL
git clone https://github.com/gurukathryn/geode-mining-game.git .

# If you don't have a GitHub repository, you'll need to upload your files using SFTP
# (Instructions for that would be separate)
```

## 7. Setting Up the Backend

Now you'll set up the backend server:

```bash
# Navigate to the backend directory
cd /var/www/geode-mining-game/backend

# Install dependencies
npm install

# Create an environment file
nano .env
```

In the nano editor, paste the following (replace 'your_secure_password' with the password you created earlier):

```
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=geode_mining_game
DB_USER=geode_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=choose_a_very_long_random_string_here
JWT_EXPIRES_IN=7d

# Game Configuration
ENERGY_REGEN_RATE=5
ENERGY_MAX=100
REFERRAL_DIRECT_BONUS_RATE=0.25
REFERRAL_INDIRECT_BONUS_RATE=0.1
```

Save and exit by pressing Ctrl+X, then Y, then Enter.

Now run the database migrations to set up the tables:

```bash
# Build the TypeScript code
npm run build

# Run the database migrations
node dist/db/migrations/run.js
```

## 8. Setting Up the Frontend

Now you'll set up the frontend:

```bash
# Navigate to the frontend directory
cd /var/www/geode-mining-game/frontend

# Install dependencies
npm install

# Create an environment file
nano .env
```

In the nano editor, paste the following (replace 'your_vps_ip_address' with your actual VPS IP):

```
REACT_APP_API_URL=http://your_vps_ip_address:3001/api
```

Save and exit by pressing Ctrl+X, then Y, then Enter.

Now build the frontend:

```bash
# Build the frontend
npm run build
```

## 9. Running the Game

Now you'll set up the servers to run continuously:

```bash
# Navigate back to the backend directory
cd /var/www/geode-mining-game/backend

# Start the backend server with PM2
pm2 start dist/index.js --name geode-backend

# Set up Nginx to serve the frontend
nano /etc/nginx/sites-available/geode-game
```

In the nano editor, paste the following:

```nginx
server {
    listen 80;
    server_name your_vps_ip_address;  # Replace with your VPS IP or domain name

    location / {
        root /var/www/geode-mining-game/frontend/build;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Save and exit by pressing Ctrl+X, then Y, then Enter.

Now enable the site and restart Nginx:

```bash
# Create a symbolic link to enable the site
ln -s /etc/nginx/sites-available/geode-game /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# If the test is successful, restart Nginx
systemctl restart nginx

# Make sure PM2 starts on system boot
pm2 startup
# Run the command that PM2 gives you

# Save the PM2 process list
pm2 save
```

## 10. Making Your Game Accessible Online

Your game should now be running and accessible at your VPS IP address. For a more professional setup, you can:

1. Register a domain name (e.g., from Namecheap, GoDaddy, etc.)
2. Point your domain to your VPS IP address (follow your domain registrar's instructions)
3. Update your Nginx configuration to use your domain name
4. Set up HTTPS with Let's Encrypt for security:

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get a certificate and configure Nginx
certbot --nginx -d yourdomain.com

# Follow the prompts
```

## 11. Maintaining Your Game

Here are some basic maintenance commands:

```bash
# View backend logs
pm2 logs geode-backend

# Restart the backend
pm2 restart geode-backend

# Update the game (if you have a Git repository)
cd /var/www/geode-mining-game
git pull
cd backend
npm install
npm run build
pm2 restart geode-backend
cd ../frontend
npm install
npm run build
systemctl restart nginx
```

## Database Tables Explanation

The game uses several tables in the PostgreSQL database:

1. **users** - Stores user information like email, password, points, energy, etc.
2. **geode_types** - Contains all the different types of geodes in the game
3. **user_inventory** - Tracks which geodes each user has collected
4. **fusion_recipes** - Defines how geodes can be combined to create rarer ones
5. **achievements** - Lists all possible achievements in the game
6. **user_achievements** - Tracks which achievements each user has completed
7. **analytics_events** - Records game events for analysis
8. **referrals** - Tracks user referrals and bonuses
9. **leaderboard_entries** - Stores user rankings
10. **security_logs** - Records login attempts and other security events

These tables are automatically created when you run the database migrations.

## Congratulations!

You've successfully set up the Geode Mining Game on your VPS! Players can now access your game by visiting your VPS IP address or domain name in their web browser.

If you encounter any issues, check the logs using `pm2 logs geode-backend` for backend errors or look at `/var/log/nginx/error.log` for Nginx errors.
