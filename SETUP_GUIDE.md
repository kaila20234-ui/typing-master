# TypeMaster Racing Competition Feature - Setup Guide

## 🚀 Quick Start

### Step 1: Set Up MongoDB

**Windows:**
1. Download MongoDB Community: https://www.mongodb.com/try/download/community
2. Install using the MSI installer
3. MongoDB runs as a service automatically

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Linux (Ubuntu):**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg --dearmor | sudo tee /usr/share/keyrings/mongodb-server.gpg > /dev/null
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### Step 2: Install Backend Dependencies

```bash
cd server
npm install
```

### Step 3: Start Backend Server

```bash
cd server
npm run dev
```

Expected output:
```
✅ MongoDB connected
🚀 Server running on port 5000
📡 WebSocket server ready at ws://localhost:5000
```

### Step 4: Install Frontend Dependencies

In a **new terminal**, in the app folder:

```bash
cd app
npm install
npm run dev
```

App will be available at: http://localhost:5173

## 📋 Architecture Overview

```
TypeMaster Multiplayer Racing
├── Frontend (React + Vite)
│   ├── RaceHub.tsx        → Create/join races, invite codes
│   ├── LiveRace.tsx       → Live race UI with participants
│   ├── lib/api.ts         → API client for backend calls
│   └── lib/socket.ts      → WebSocket client for real-time updates
│
└── Backend (Express + MongoDB)
    ├── Models/
    │   ├── User.js        → User accounts & friends
    │   ├── Race.js        → Race rooms & participants
    │   ├── RaceResult.js  → Individual race scores
    │   └── Invitation.js  → Race & friend invites
    ├── Routes/
    │   ├── auth.js        → Register/Login endpoints
    │   ├── race.js        → Race creation/joining
    │   ├── user.js        → User profiles
    │   └── leaderboard.js → Rankings
    └── Socket/
        └── raceHandler.js → Real-time race events
```

## 🎮 How It Works

### Creating a Race
1. User clicks "Create Race" in RaceHub
2. Enters race text, difficulty, and player limit
3. Backend creates race room with unique `roomId`
4. User gets invite code to share with friends
5. Frontend connects via WebSocket

### Joining a Race
1. User enters invite code or selects from active races
2. Backend validates and adds user to participants
3. WebSocket broadcasts "player_joined" to all
4. All players see updated participant list

### During Race
1. All players see same text at same time
2. Frontend sends WPM/accuracy every 100ms
3. WebSocket broadcasts progress to all players
4. Everyone sees live leaderboard updating
5. First to finish gets position #1, etc.

### Race Results
1. When player finishes, backend validates and calculates position
2. Result saved to database
3. User stats updated (bestWpm, totalRaces, etc.)
4. Leaderboard updated
5. All players see final standings

## 🔌 Integration with Existing App

### Modified from Original App
Currently, the main `App.tsx` uses localStorage-only auth. To integrate racing:

1. **Auth System** → Move to JWT tokens
2. **New Tab** → Add "Races" tab in main navigation
3. **Socket Connection** → Initialize on app load
4. **UI Components** → Import and use RaceHub/LiveRace

### Optional: Full Integration

For a complete integration, you would:
1. Update `App.tsx` to import/use new race components
2. Add "Races" tab alongside Lessons/Practice/Endless/Arcade
3. Migrate auth from localStorage to JWT
4. Initialize socket connection on app start

## 🧪 Manual Testing

### Test 1: Create Account & Login
```
1. Open http://localhost:5173
2. (Currently uses localStorage demo auth - update to new JWT system)
3. Should show user profile
```

### Test 2: Create Race
```
1. Create race with some text
2. Share invite code shown in popup
```

### Test 3: Join Race (Two Browsers)
```
1. Open http://localhost:5173 in Browser #1
2. Open http://localhost:5173 in Browser #2
3. Browser #1: Create race, get code
4. Browser #2: Enter code to join
5. Both should see each other listed as participants
```

### Test 4: Run Race
```
1. Both browsers mark "Ready"
2. Countdown: 3... 2... 1... GO!
3. Type on one browser
4. Other browser should see live WPM updates
5. First to finish gets position #1
6. Final leaderboard shows all positions
```

## 📊 Database

View your data with MongoDB Compass or shell:

```bash
# Open MongoDB shell
mongosh

# Use typemaster database
use typemaster

# View collections
show collections

# Example queries
db.users.find()                    # All users
db.races.find()                    # All races
db.raceresults.find()              # All race scores
db.leaderboards.find()             # Rankings

# Count
db.users.countDocuments()
db.raceresults.countDocuments()
```

## 🐛 Debugging

### Check Backend
```bash
# In terminal where backend is running
# Should see: 
# ✅ [connection] mongodb connected
# 🚀 Server running on port 5000
```

### Check Socket Connection
```javascript
// In browser console (when connected to race)
// Should see:
// ✅ WebSocket connected
// race:join event sent
```

### Check API Calls
```javascript
// In browser console
// Should see Network tab with POST to http://localhost:5000/api/...
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| Can't connect to MongoDB | mongod not running | Start MongoDB service |
| Port 5000 in use | Another app using it | Change PORT in .env to 5001 |
| CORS error | Frontend/backend URL mismatch | Check CLIENT_URL in .env |
| Socket connection failed | Socket not initialized | Call socketClient.connect() |
| Token invalid | JWT expired | Clear localStorage, login again |

## 📝 Environment Files

### Server (.env)
```
MONGO_URI=mongodb://localhost:27017/typemaster
JWT_SECRET=dev_secret_key_change_in_production
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

### App (.env.local)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🚢 Deployment

### Backend (Heroku example)
```bash
cd server
heroku create typemaster-backend
heroku config:set JWT_SECRET=production_secure_key
heroku config:set MONGO_URI=mongodb+srv://user:pwd@cluster.mongodb.net/typemaster
git push heroku main
```

### Frontend (Vercel example)
```bash
cd app
npm run build
vercel deploy dist/ --prod
```

Then update .env to point to production backend URL.

## 📚 Next Steps

1. **Test the implementation** - Follow manual testing steps above
2. **Integrate with App.tsx** - Add races tab to main app
3. **Add more features**:
   - Friend list management
   - Custom lesson races
   - Tournament brackets
   - Replay race recordings
   - Achievements
   - In-game chat

4. **Polish UI** - Animations, mobile responsiveness
5. **Deploy to production** - Heroku, Railway, or your hosting

## ✅ Checklist

- [ ] MongoDB installed and running
- [ ] Backend dependencies installed (`npm install` in `/server`)
- [ ] Backend started with `npm run dev`
- [ ] Frontend dependencies installed (`npm install` in `/app`)
- [ ] Frontend running on http://localhost:5173
- [ ] Can see "Races" feature in app (after integration)
- [ ] Can create and join races
- [ ] Can run live race with WPM updates
- [ ] Results saved and leaderboard updated

## 📞 Support

If you encounter issues:
1. Check error logs in terminal
2. Verify MongoDB is running: `mongosh`
3. Clear browser cache and localStorage
4. Delete node_modules and reinstall: `npm install`
5. Check that ports 5000 and 5173 are available
