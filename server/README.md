# TypeMaster Backend - Multiplayer Racing Server

This is the Node.js/Express backend for the TypeMaster typing application with multiplayer racing features.

## Prerequisites

- **Node.js** 16+ (download from https://nodejs.org)
- **MongoDB** 4.0+ (download from https://www.mongodb.com/try/download/community)
- **npm** (comes with Node.js)

## Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env` file in the server directory with the following:

```
MONGO_URI=mongodb://localhost:27017/typemaster
JWT_SECRET=your_super_secret_jwt_key_change_in_production
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Important:** Change `JWT_SECRET` to a strong random string in production!

### 3. Start MongoDB

**Windows (if installed via MongoDB installer):**
```bash
net start MongoDB
```

Or download MongoDB Community edition and start `mongod.exe`:
```bash
"C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe"
```

**macOS/Linux:**
```bash
brew services start mongodb-community
```

Or manually:
```bash
mongod --dbpath /path/to/data
```

### 4. Start the Backend Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

You should see:
```
✅ MongoDB connected
🚀 Server running on port 5000
📡 WebSocket server ready at ws://localhost:5000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/verify` - Verify token validity

### Races
- `POST /api/races/create` - Create a new race room
- `GET /api/races/:roomId` - Get race details
- `POST /api/races/:roomId/join` - Join a race
- `GET /api/races` - List active races
- `GET /api/races/user/:userId/history` - Get user's race history

### Users
- `GET /api/users/me` - Get current user profile
- `GET /api/users/:userId` - Get user profile
- `PUT /api/users/:userId` - Update profile
- `PUT /api/users/:userId/stats` - Update user stats

### Leaderboards
- `GET /api/leaderboard/global` - Global leaderboard
- `GET /api/leaderboard/friends/:userId` - Friends leaderboard
- `GET /api/leaderboard/rank/:userId` - Get user's rank

### Invitations
- `GET /api/invitations/pending` - Get pending invitations
- `POST /api/invitations/send` - Send invitation
- `POST /api/invitations/:invitationId/accept` - Accept invitation
- `POST /api/invitations/:invitationId/decline` - Decline invitation

## WebSocket Events

### Client → Server
- `race:join` - Join a race room
- `race:ready` - Mark player ready
- `race:input` - Send WPM/accuracy updates
- `race:finish` - Notify race completion

### Server → Client (Broadcast)
- `race:player_joined` - Player joined race
- `race:countdown` - Countdown started
- `race:start` - Race started
- `race:progress` - Player progress update
- `race:player_finished` - Player finished race
- `race:results` - Final race results
- `race:error` - Error occurred

## Troubleshooting

### MongoDB Connection Error
- Ensure MongoDB is running: `mongosh` (MongoDB shell)
- Check connection string in `.env`
- Default: `mongodb://localhost:27017/typemaster`

### Port Already in Use
- Change PORT in `.env` to an available port (e.g., 5001)
- Or kill the process using port 5000:
  - Windows: `netstat -ano | findstr :5000` then `taskkill /PID <PID> /F`
  - macOS/Linux: `lsof -ti:5000 | xargs kill -9`

### CORS Errors
- Ensure `CLIENT_URL` in `.env` matches your frontend URL
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## Database

All user data, races, results, and invitations are stored in MongoDB:

**Collections:**
- `users` - User accounts and profiles
- `races` - Active/completed races
- `raceresults` - Individual race scores
- `invitations` - Race and friend invitations
- `leaderboards` - Cached rankings

To view/manage data:
```bash
mongosh
use typemaster
db.users.find()
db.races.find()
```

## Production Deployment

For production (Heroku, Railway, etc.):

1. Update `JWT_SECRET` to a strong unique value
2. Use MongoDB Atlas (cloud) instead of local MongoDB
3. Set `NODE_ENV=production`
4. Deploy with `npm start`

Example Heroku deployment:
```bash
heroku create typemaster-backend
heroku config:set JWT_SECRET=your_production_key
heroku config:set MONGO_URI=mongodb+srv://user:pwd@cluster.mongodb.net/typemaster
git push heroku main
```

## Development

- **Nodemon** is configured for auto-restart on file changes
- Check logs in console for debugging
- Use MongoDB Compass for GUI database management
- Test WebSocket with `socket.io-client` in browser console
