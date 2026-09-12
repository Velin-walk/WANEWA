// mobile/src/services/webSocketClient.ts
import { ReconnectingWebSocket } from 'reconnecting-websocket';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.walk-nepal.workers.dev';

interface TrekWSMessage {
  type: 'initial' | 'participant_joined' | 'participant_left' | 'error';
  participants?: { total: number; male: number; female: number };
  count?: { total: number; male: number; female: number };
  new_person?: string;
  gender?: 'm' | 'f';
  timestamp?: number;
}

export class TrekWebSocketClient {
  private ws: ReconnectingWebSocket | null = null;
  private trekId: string | null = null;
  private listeners: Map<string, Function[]> = new Map();
  private isConnected = false;

  /**
   * Connect to trek WebSocket
   */
  connect(trekId: string): void {
    if (this.trekId === trekId && this.isConnected) {
      console.log('Already connected to trek:', trekId);
      return;
    }

    this.trekId = trekId;
    const wsUrl = `${API_BASE_URL.replace(/^https/, 'wss').replace(/^http/, 'ws')}/ws/trek/${trekId}`;

    console.log('Connecting to WebSocket:', wsUrl);

    this.ws = new ReconnectingWebSocket(wsUrl, [], {
      maxRetries: 5,
      maxReconnectionDelay: 10000,
      minReconnectionDelay: 1500,
      reconnectInterval: 3000,
    });

    this.ws.onopen = () => {
      this.isConnected = true;
      console.log('WebSocket connected:', trekId);
      this.emit('connected', { trek_id: trekId });
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data) as TrekWSMessage;
        console.log('WebSocket message:', data.type);
        this.emit(data.type, data);
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onerror = (error: any) => {
      console.error('[WebSocket Error]', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      console.log('WebSocket disconnected');
      this.emit('disconnected', {});
    };
  }

  /**
   * Register event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    console.log(`Listener registered for event: ${event}`);
  }

  /**
   * Emit event to all listeners
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => {
      try {
        cb(data);
      } catch (error) {
        console.error(`Error in listener for event ${event}:`, error);
      }
    });
  }

  /**
   * Remove event listener
   */
  off(event: string, callback?: Function): void {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }

    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.trekId = null;
      this.isConnected = false;
      this.listeners.clear();
    }
  }

  /**
   * Check connection status
   */
  isConnectedTo(trekId: string): boolean {
    return this.isConnected && this.trekId === trekId;
  }

  /**
   * Get current trek ID
   */
  getCurrentTrekId(): string | null {
    return this.trekId;
  }
}

// Export singleton instance
export const trekWS = new TrekWebSocketClient();
