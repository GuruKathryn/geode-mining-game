# Geode Mining Game

A fun, interactive web game where players discover and collect various types of geodes by clicking on a sparkling cave background. Players can fuse geodes to create rarer ones, track achievements, compete on leaderboards, and earn bonus points through referrals.

## Features

- **Geode Discovery**: Click on the cave background to discover geodes of varying rarities
- **Geode Collection**: View and manage your collection of discovered geodes
- **Fusion System**: Combine multiple geodes to create rarer, more valuable ones
- **Achievements**: Complete various challenges to earn bonus points
- **Leaderboards**: Compete with other players globally and with friends
- **Referral System**: Invite friends to earn bonus points from their discoveries
- **User Authentication**: Register and login to save your progress
- **Energy System**: Energy regenerates over time, limiting mining sessions
- **Dark Mode**: Toggle between light and dark themes
- **Sound Effects**: Enjoy immersive audio feedback

## Tech Stack

### Backend
- Node.js
- Express
- TypeScript
- PostgreSQL
- JSON Web Tokens (JWT) for authentication

### Frontend
- React
- Redux Toolkit
- TypeScript
- Styled Components
- Howler.js for sound effects

## Project Structure

```
geode-mining-game/
├── backend/                 # Backend server code
│   ├── src/
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── utils/           # Utility functions
│   │   ├── db/              # Database connection and migrations
│   │   └── index.ts         # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/                # Frontend React application
    ├── public/              # Static assets
    │   └── assets/
    │       ├── geodes/      # Geode images
    │       └── sounds/      # Sound effects
    └── src/
        ├── components/      # React components
        │   ├── animations/  # Animation components
        │   ├── auth/        # Authentication components
        │   ├── game/        # Game-specific components
        │   ├── layout/      # Layout components
        │   ├── modals/      # Modal components
        │   ├── notifications/ # Notification components
        │   └── ui/          # UI components
        ├── hooks/           # Custom React hooks
        ├── store/           # Redux store
        │   └── slices/      # Redux slices
        ├── styles/          # Global styles
        └── App.tsx          # Main App component
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL database

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/gurukathryn/geode-mining-game.git
   cd geode-mining-game
   ```

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=3001
   DATABASE_URL=postgres://username:password@localhost:5432/geode_mining
   JWT_SECRET=your_jwt_secret
   ```

4. Run database migrations:
   ```
   npm run migrate
   ```

5. Install frontend dependencies:
   ```
   cd ../frontend
   npm install
   ```

6. Create a `.env` file in the frontend directory:
   ```
   REACT_APP_API_URL=http://localhost:3001/api
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm run dev
   ```

2. In a separate terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```

3. Open your browser and navigate to `http://localhost:3000`

## Game Mechanics

### Geode Rarity Levels

- **Common**: Basic geodes, no point value
- **Uncommon**: Slightly rare geodes, low point value
- **Rare**: Hard to find geodes, medium point value
- **Epic**: Very rare geodes, high point value
- **Legendary**: Extremely rare geodes, very high point value

### Fusion System

Combine multiple geodes of the same type to create rarer geodes. For example:
- 5 Common geodes → 1 Uncommon geode
- 3 Uncommon geodes → 1 Rare geode
- 2 Rare geodes → 1 Epic geode
- 2 Epic geodes → 1 Legendary geode

### Energy System

- Each click consumes 1 energy
- Energy regenerates over time (1 energy every 5 minutes)
- Maximum energy depends on player level

### Referral Bonuses

- When your friend plays, you get 10% of their points
- When your friend's friend plays, you get 2.5% of their points

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Icons from [Font Awesome](https://fontawesome.com/)
- Sound effects from [Freesound](https://freesound.org/)
