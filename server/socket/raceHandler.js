import Race from '../models/Race.js';
import RaceResult from '../models/RaceResult.js';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';

export async function startRaceCountdown(io, roomId) {
  const race = await Race.findOne({ roomId });
  if (!race || race.status === 'in_progress' || race.status === 'completed') return;

  race.status = 'ready';
  await race.save();

  let countdown = 3;
  const countdownInterval = setInterval(async () => {
    if (countdown > 0) {
      io.to(roomId).emit('race:countdown', { count: countdown });
      countdown--;
    } else {
      clearInterval(countdownInterval);
      race.status = 'in_progress';
      race.startedAt = new Date();

      race.participants.forEach((p) => {
        p.raceStatus = 'typing';
      });
      await race.save();

      io.to(roomId).emit('race:start', {
        message: 'GO!',
        participants: race.participants,
      });
    }
  }, 1000);
}

export const setupRaceSocket = (io) => {
  const raceRooms = new Map(); // Store race room states

  io.on('connection', (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Join a race room
    socket.on('race:join', async (data) => {
      try {
        const { roomId } = data;

        if (!roomId || !socket.data?.userId) {
          return socket.emit('race:error', { message: 'Missing room ID or authenticated user' });
        }

        const userId = socket.data.userId;
        const username = socket.data.username;
        const profilePicture = socket.data.profilePicture;

        // Find the race
        const race = await Race.findOne({ roomId });
        if (!race) {
          return socket.emit('race:error', { message: 'Race not found' });
        }

        // Join the Socket.io room
        socket.join(roomId);
        socket.data.roomId = roomId;

        // Update participant status
        const participant = race.participants.find(p => p.userId.toString() === userId);
        if (participant) {
          participant.raceStatus = 'ready';
          await race.save();
        }

        // Broadcast to all in room
        io.to(roomId).emit('race:player_joined', {
          participants: race.participants,
          message: `${username} joined the race`,
        });

        console.log(`👤 ${username} joined race ${roomId}`);
      } catch (error) {
        console.error('Join error:', error);
        socket.emit('race:error', { message: error.message });
      }
    });

    // Player marks ready
    socket.on('race:ready', async (data) => {
      try {
        const { roomId } = data;
        const race = await Race.findOne({ roomId });

        if (!race) return;

        const participant = race.participants.find(p => p.userId.toString() === socket.data.userId);
        if (participant) {
          participant.raceStatus = 'ready';
          await race.save();
        }

        // Check if all ready
        const allReady = race.participants.every(p => p.raceStatus === 'ready');

        io.to(roomId).emit('race:player_ready', {
          userId: socket.data.userId,
          participants: race.participants,
          allReady,
        });

        // Start countdown if all ready
        if (allReady) {
          startRaceCountdown(io, roomId);
        }
      } catch (error) {
        console.error('Ready error:', error);
      }
    });

    // Receive WPM and accuracy updates during race
    socket.on('race:input', async (data) => {
      try {
        const { roomId, wpm, accuracy, characterCount } = data;

        // Update participant stats
        const race = await Race.findOne({ roomId });
        if (!race) return;

        const participant = race.participants.find(p => p.userId.toString() === socket.data.userId);
        if (participant) {
          participant.wpm = wpm;
          participant.accuracy = accuracy;
          participant.characterCount = characterCount;
          await race.save();
        }

        // Broadcast progress to all players
        io.to(roomId).emit('race:progress', {
          userId: socket.data.userId,
          wpm,
          accuracy,
          characterCount,
          participants: race.participants,
        });
      } catch (error) {
        console.error('Input error:', error);
      }
    });

    // Player finishes race
    socket.on('race:finish', async (data) => {
      try {
        const { roomId, wpm, accuracy, correctChars, incorrectChars, totalChars, timeElapsed } = data;

        if (!roomId || !socket.data?.userId) {
          return socket.emit('race:error', { message: 'Missing room or user data' });
        }

        const race = await Race.findOne({ roomId });
        if (!race) return;

        // Update participant status
        const participant = race.participants.find(p => p.userId.toString() === socket.data.userId);
        if (!participant) {
          return socket.emit('race:error', { message: 'You are not part of this race' });
        }

        participant.raceStatus = 'finished';
        participant.finishTime = new Date();
        participant.wpm = wpm;
        participant.accuracy = accuracy;

        const finishedCount = race.participants.filter(p => p.raceStatus === 'finished').length;
        participant.position = finishedCount;

        await race.save();

        const result = new RaceResult({
          raceId: race._id,
          userId: socket.data.userId,
          position: finishedCount,
          wpm,
          accuracy,
          correctChars,
          incorrectChars,
          totalChars,
          timeElapsed,
        });

        await result.save();

        // Update user stats
        const user = await User.findById(socket.data.userId);
        if (user) {
          user.stats.totalRaces += 1;
          if (finishedCount === 1) {
            user.stats.racesWon += 1;
          }
          if (wpm > user.stats.bestWpm) {
            user.stats.bestWpm = wpm;
          }
          await user.save();
        }

        // Broadcast finish
        io.to(roomId).emit('race:player_finished', {
          userId: socket.data.userId,
          username: socket.data.username,
          position: finishedCount,
          wpm,
          accuracy,
          participants: race.participants,
        });

        console.log(`🏁 ${socket.data.username} finished race ${roomId} at position ${finishedCount}`);

        const allFinished = race.participants.every(p => p.raceStatus === 'finished');
        if (allFinished || finishedCount === race.participants.length) {
          endRace(io, roomId, race);
        }
      } catch (error) {
        console.error('Finish error:', error);
      }
    });

    // Admin force-start race
    socket.on('race:admin-force-start', async (data) => {
      try {
        const { roomId, adminName } = data;
        const race = await Race.findOne({ roomId });

        if (!race) {
          return socket.emit('race:error', { message: 'Race not found' });
        }

        // Start countdown immediately
        startRaceCountdown(io, roomId);

        io.to(roomId).emit('race:admin-force-start', {
          message: `Race force-started by admin ${adminName}`,
          adminName,
          timestamp: new Date(),
        });

        console.log(`⚡ Admin ${adminName} force-started race ${roomId}`);
      } catch (error) {
        console.error('Admin force-start error:', error);
        socket.emit('race:error', { message: error.message });
      }
    });

    // Admin force-end race
    socket.on('race:admin-force-end', async (data) => {
      try {
        const { roomId, adminName } = data;
        const race = await Race.findOne({ roomId });

        if (!race) {
          return socket.emit('race:error', { message: 'Race not found' });
        }

        // Update all unfinished participants with their current stats
        race.participants.forEach((participant, index) => {
          if (participant.raceStatus !== 'finished') {
            participant.raceStatus = 'finished';
            participant.finishTime = new Date();
            participant.position = race.participants.filter(p => p.raceStatus === 'finished').length;
          }
        });

        // End the race
        endRace(io, roomId, race);

        io.to(roomId).emit('race:admin-force-end', {
          message: `Race force-ended by admin ${adminName}`,
          adminName,
          timestamp: new Date(),
        });

        console.log(`⚡ Admin ${adminName} force-ended race ${roomId}`);
      } catch (error) {
        console.error('Admin force-end error:', error);
        socket.emit('race:error', { message: error.message });
      }
    });

    // Player disconnects
    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);

      if (socket.data?.roomId) {
        io.to(socket.data.roomId).emit('race:player_left', {
          userId: socket.data.userId,
          username: socket.data.username,
          message: `${socket.data.username} left the race`,
        });
      }
    });
  });

  // Helper function: End race
  async function endRace(io, roomId, race) {
    race.status = 'completed';
    race.completedAt = new Date();
    await race.save();

    // Sort by position to get final leaderboard
    const sortedParticipants = [...race.participants].sort((a, b) => a.position - b.position);

    io.to(roomId).emit('race:results', {
      message: 'Race finished!',
      leaderboard: sortedParticipants,
    });

    console.log(`🏆 Race ${roomId} completed`);
  }
};
