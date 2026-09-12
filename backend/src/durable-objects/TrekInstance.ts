interface Env {
  DB: D1Database;
  R2: R2Bucket;
}

export class TrekInstance {
  private state: DurableObjectState;
  private env: Env;
  private sockets: Set<WebSocket> = new Set();
  private participantCount = { total: 0, male: 0, female: 0 };

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.loadState();
  }

  async loadState() {
    const stored = await this.state.storage.get('participants');
    if (stored) {
      this.participantCount = JSON.parse(stored as string);
    }
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (req.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      this.handleWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }

    // Get current count
    if (url.pathname === '/count') {
      return Response.json(this.participantCount);
    }

    // Join event
    if (url.pathname === '/join' && req.method === 'POST') {
      const body = await req.json() as { name: string; gender: 'm' | 'f' };
      this.participantCount.total++;
      if (body.gender === 'm') this.participantCount.male++;
      if (body.gender === 'f') this.participantCount.female++;

      // Persist
      await this.state.storage.put('participants', JSON.stringify(this.participantCount));

      // Broadcast to all connected clients
      this.broadcastUpdate({
        type: 'participant_joined',
        count: this.participantCount,
        new_person: body.name,
      });

      return Response.json({ ok: true });
    }

    return new Response('Not found', { status: 404 });
  }

  private handleWebSocket(ws: WebSocket) {
    this.sockets.add(ws);

    // Send initial state
    ws.send(
      JSON.stringify({
        type: 'initial',
        participants: this.participantCount,
        timestamp: Date.now(),
      })
    );

    ws.addEventListener('close', () => {
      this.sockets.delete(ws);
    });

    ws.addEventListener('error', () => {
      this.sockets.delete(ws);
    });
  }

  private broadcastUpdate(message: any) {
    const payload = JSON.stringify({
      ...message,
      timestamp: Date.now(),
    });

    for (const ws of this.sockets) {
      try {
        ws.send(payload);
      } catch (e) {
        this.sockets.delete(ws);
      }
    }

    // Optional: Send push notification to all clients
    // (triggered via separate notifier service)
  }
}
