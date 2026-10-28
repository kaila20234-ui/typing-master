import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

type RaceParticipant = {
  userId: string;
  userCode?: string;
  username: string;
  profilePicture?: string;
  raceStatus: string;
  wpm?: number;
  accuracy?: number;
  characterCount?: number;
  position?: number;
};

interface RaceEventMap {
  'race:player_joined': { participants: RaceParticipant[]; message: string };
  'race:player_ready': { userId: string; participants: RaceParticipant[]; allReady: boolean };
  'race:countdown': { count: number };
  'race:start': { message: string; participants: RaceParticipant[] };
  'race:progress': { userId: string; wpm: number; accuracy: number; characterCount: number; participants: RaceParticipant[] };
  'race:player_finished': { userId: string; username: string; position: number; wpm: number; accuracy: number; participants: RaceParticipant[] };
  'race:results': { message: string; leaderboard: RaceParticipant[] };
  'race:player_left': { userId: string; username: string; message: string };
  'race:error': { message: string };
}

class SocketClient {
  private socket: Socket | null = null;
  private listeners: Map<keyof RaceEventMap, Set<Function>> = new Map();

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
      auth: {
        token: localStorage.getItem('token'),
      },
    });

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    this.socket.on('error', (error: unknown) => {
      console.error('WebSocket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRace(roomId: string, userId: string, username: string, profilePicture?: string) {
    if (!this.socket?.connected) {
      console.error('Socket not connected');
      return;
    }

    this.socket.emit('race:join', {
      roomId,
      userId,
      username,
      profilePicture,
    });
  }

  markReady(roomId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit('race:ready', { roomId });
  }

  sendProgress(roomId: string, wpm: number, accuracy: number, characterCount: number) {
    if (!this.socket?.connected) return;

    this.socket.emit('race:input', {
      roomId,
      wpm,
      accuracy,
      characterCount,
    });
  }

  finishRace(
    roomId: string,
    wpm: number,
    accuracy: number,
    correctChars: number,
    incorrectChars: number,
    totalChars: number,
    timeElapsed: number
  ) {
    if (!this.socket?.connected) return;

    this.socket.emit('race:finish', {
      roomId,
      wpm,
      accuracy,
      correctChars,
      incorrectChars,
      totalChars,
      timeElapsed,
    });
  }

  on<K extends keyof RaceEventMap>(event: K, callback: (data: RaceEventMap[K]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as Function);

    if (this.socket) {
      this.socket.on(event as any, callback as any as (...args: any[]) => void);
    }
  }

  off<K extends keyof RaceEventMap>(event: K, callback: (data: RaceEventMap[K]) => void) {
    if (this.socket) {
      this.socket.off(event as any, callback as any as (...args: any[]) => void);
    }

    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback as Function);
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }
}

export const socketClient = new SocketClient();
