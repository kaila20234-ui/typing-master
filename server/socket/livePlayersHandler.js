export const setupLivePlayersSocket = (io) => {
  // In-memory store of active players across all competitions
  const activePlayers = new Map(); // userId -> playerData

  io.on('connection', (socket) => {
    console.log(`✅ Live Players Client connected: ${socket.id}`);

    // Subscribe to live players updates
    socket.on('live-players:subscribe', () => {
      socket.join('live-players-room');
      // Send current active players on subscribe
      const players = Array.from(activePlayers.values());
      socket.emit('live-players:snapshot', { players });
      console.log(`📊 Client subscribed to live players: ${socket.id}`);
    });

    // Unsubscribe from live players
    socket.on('live-players:unsubscribe', () => {
      socket.leave('live-players-room');
      console.log(`📊 Client unsubscribed from live players: ${socket.id}`);
    });

    // Called when player joins any competition
    socket.on('player:activity', (data) => {
      try {
        const { userId, username, competitionType, competitionId, competitionName, roomId, action } = data;

        if (!userId || !competitionType) return;

        if (action === 'joined') {
          // Add/update player in active players
          activePlayers.set(userId, {
            userId,
            username,
            competitionType, // 'race', 'tournament', 'squadWar', 'dailyChallenge'
            competitionId,
            competitionName,
            roomId,
            score: 0,
            wpm: 0,
            accuracy: 0,
            status: 'typing', // 'typing', 'completed', 'waiting', 'ready'
            joinedAt: new Date(),
            lastUpdate: new Date(),
          });

          // Broadcast updated players list
          const players = Array.from(activePlayers.values());
          io.to('live-players-room').emit('live-players:update', { players });
          console.log(`✅ Player ${username} joined (${competitionType})`);
        }
      } catch (error) {
        console.error('Player activity error:', error);
      }
    });

    // Called when player's stats update (score, wpm, accuracy)
    socket.on('player:stats', (data) => {
      try {
        const { userId, score, wpm, accuracy, status } = data;

        if (!userId) return;

        const player = activePlayers.get(userId);
        if (player) {
          if (score !== undefined) player.score = score;
          if (wpm !== undefined) player.wpm = wpm;
          if (accuracy !== undefined) player.accuracy = accuracy;
          if (status) player.status = status;
          player.lastUpdate = new Date();

          // Broadcast updated players list
          const players = Array.from(activePlayers.values());
          io.to('live-players-room').emit('live-players:update', { players });
        }
      } catch (error) {
        console.error('Player stats error:', error);
      }
    });

    // Called when player leaves/completes competition
    socket.on('player:leave', (data) => {
      try {
        const { userId } = data;

        if (userId && activePlayers.has(userId)) {
          const player = activePlayers.get(userId);
          activePlayers.delete(userId);

          // Broadcast updated players list
          const players = Array.from(activePlayers.values());
          io.to('live-players-room').emit('live-players:update', { players });
          console.log(`👋 Player ${player.username} left`);
        }
      } catch (error) {
        console.error('Player leave error:', error);
      }
    });

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  // Return accessor functions for API endpoints
  return {
    getActivePlayers: () => Array.from(activePlayers.values()),
    getActivePlayerCount: () => activePlayers.size,
  };
};
