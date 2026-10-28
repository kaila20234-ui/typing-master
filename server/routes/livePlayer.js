import express from 'express';

const router = express.Router();

// Will be set by server.js
let livePlayersApi = null;

export function setLivePlayersApi(api) {
  livePlayersApi = api;
}

/**
 * GET /api/live-players
 * Get all currently active players
 */
router.get('/', (req, res) => {
  try {
    if (!livePlayersApi) {
      return res.json({ players: [] });
    }
    const players = livePlayersApi.getActivePlayers();
    // Sort by most recent activity
    players.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
    res.json({ players });
  } catch (error) {
    console.error('Error fetching live players:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/live-players/count
 * Get count of active players
 */
router.get('/count', (req, res) => {
  try {
    if (!livePlayersApi) {
      return res.json({ count: 0 });
    }
    const count = livePlayersApi.getActivePlayerCount();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching live player count:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/live-players/by-type/:type
 * Get active players of specific competition type
 */
router.get('/by-type/:type', (req, res) => {
  try {
    if (!livePlayersApi) {
      return res.json({ players: [] });
    }
    const { type } = req.params;
    const allPlayers = livePlayersApi.getActivePlayers();
    const filtered = allPlayers.filter(p => p.competitionType === type);
    filtered.sort((a, b) => new Date(b.lastUpdate) - new Date(a.lastUpdate));
    res.json({ players: filtered });
  } catch (error) {
    console.error('Error filtering by type:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
