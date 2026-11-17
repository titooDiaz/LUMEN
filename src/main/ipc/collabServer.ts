import { WebSocketServer, WebSocket } from 'ws';
import * as os from 'node:os';
import * as Y from 'yjs';
import { CollabStatus } from '../../shared/types';

interface ConnectedPeer {
  id: string;
  name: string;
  color: string;
  canWrite: boolean;
  isHost: boolean;
  socket: WebSocket;
  connectedAt: string;
  cursor?: { filePath: string; lineNumber: number; column: number };
}

class CollabHostServer {
  private wss: WebSocketServer | null = null;
  private port: number = 8765;
  private token: string = '';
  private roomId: string = 'lumen-doc';
  private peers: Map<string, ConnectedPeer> = new Map();
  private documents: Map<string, Y.Doc> = new Map();
  private cursors: Map<string, { filePath: string; lineNumber: number; column: number }> = new Map();
  private sessionInfo: { projectName: string; fileName: string; content: string } | null = null;

  public getLocalIPAddresses(): string[] {
    const interfaces = os.networkInterfaces();
    const ips: string[] = [];
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name] || []) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          ips.push(iface.address);
        }
      }
    }
    return ips.length > 0 ? ips : ['127.0.0.1'];
  }

  public start(port = 8765, token?: string): { success: boolean; port: number; token: string; ips: string[] } {
    if (this.wss) {
      this.stop();
    }

    this.port = port;
    this.token = token || Math.random().toString(36).substring(2, 10).toUpperCase();

    this.wss = new WebSocketServer({ port: this.port });

    this.wss.on('connection', (ws: WebSocket, req) => {
      // Validate authentication token from query string e.g. /?token=XYZ&name=Bob
      const url = new URL(req.url || '/', `http://localhost:${this.port}`);
      const clientToken = url.searchParams.get('token');
      const clientName = url.searchParams.get('name') || 'Invitado';

      if (this.token && clientToken !== this.token) {
        ws.close(4001, 'INVALID_CREDENTIALS');
        return;
      }
      if (this.peers.size >= 5) {
        ws.close(4002, 'SESSION_FULL');
        return;
      }

      const peerId = `peer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const peerColors = ['#f43f5e', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];
      const color = peerColors[this.peers.size % peerColors.length];

      const peer: ConnectedPeer = {
        id: peerId,
        name: clientName,
        color,
        canWrite: true,
        isHost: false,
        socket: ws,
        connectedAt: new Date().toISOString(),
      };
      if (this.peers.size === 0) peer.isHost = true;

      this.peers.set(peerId, peer);
      if (this.sessionInfo) this.send(ws, { type: 'lumen:session-info', ...this.sessionInfo });
      this.broadcastPeerList();

      // Handle raw messages (Yjs sync, awareness, cursor, chat)
      ws.on('message', (data: Buffer | string) => {
        const raw = Buffer.isBuffer(data) ? data.toString('utf8') : data;
        try {
          const message = JSON.parse(raw);
          if (message.type === 'lumen:y-sync-request') {
            for (const [filePath, doc] of this.documents) {
              this.send(ws, {
                type: 'lumen:y-update',
                filePath,
                update: Buffer.from(Y.encodeStateAsUpdate(doc)).toString('base64'),
              });
            }
          } else if (message.type === 'lumen:session-info' && typeof message.projectName === 'string' && typeof message.fileName === 'string') {
            this.sessionInfo = { projectName: message.projectName, fileName: message.fileName, content: typeof message.content === 'string' ? message.content : '' };
            this.broadcast(raw, peerId);
          } else if (
            (message.type === 'lumen:y-update' || message.type === 'lumen:y-sync-init') &&
            typeof message.filePath === 'string' &&
            typeof message.update === 'string'
          ) {
            const doc = this.documents.get(message.filePath) || new Y.Doc();
            Y.applyUpdate(doc, Buffer.from(message.update, 'base64'));
            this.documents.set(message.filePath, doc);
            this.broadcast(raw, peerId);
          } else if (message.type === 'lumen:cursor' && message.cursor && typeof message.cursor.filePath === 'string') {
            const cursor = {
              filePath: message.cursor.filePath,
              lineNumber: Math.max(1, Number(message.cursor.lineNumber) || 1),
              column: Math.max(1, Number(message.cursor.column) || 1),
            };
            this.cursors.set(peerId, cursor);
            peer.cursor = cursor;
            this.broadcast(JSON.stringify({ ...message, peerId, name: peer.name, color: peer.color }), peerId);
          } else {
            this.broadcast(raw, peerId);
          }
        } catch {
          // Non-JSON payloads are forwarded for future binary protocol messages.
          this.broadcast(data, peerId);
        }
      });

      /*
       * The host renderer also connects as a peer. This keeps the server
       * transport stateless from the UI's perspective while the server owns
       * the canonical Y.Doc for every file.
       */
      ws.send(JSON.stringify({ type: 'lumen:ready', peerId }));

      ws.on('close', () => {
        this.peers.delete(peerId);
        this.cursors.delete(peerId);
        this.broadcast(JSON.stringify({ type: 'lumen:cursor-remove', peerId }), peerId);
        this.broadcastPeerList();
      });

      ws.on('error', (err) => {
        console.error(`Socket error for peer ${peerId}:`, err);
        this.peers.delete(peerId);
        this.cursors.delete(peerId);
        this.broadcastPeerList();
      });
    });

    return {
      success: true,
      port: this.port,
      token: this.token,
      ips: this.getLocalIPAddresses(),
    };
  }

  public stop(): boolean {
    if (this.wss) {
      for (const peer of this.peers.values()) {
        try {
          peer.socket.close(1000, 'Host stopped session');
        } catch {
          // ignore
        }
      }
      this.peers.clear();
      this.documents.clear();
      this.sessionInfo = null;
      this.wss.close();
      this.wss = null;
      return true;
    }
    return false;
  }

  public getStatus(): CollabStatus {
    const clients: any[] = [];
    for (const p of this.peers.values()) {
      clients.push({
        id: p.id,
        name: p.name,
        color: p.color,
        isHost: p.isHost,
        canWrite: p.canWrite,
        connectedAt: p.connectedAt,
        cursor: p.cursor,
      });
    }

    return {
      isHosting: this.wss !== null,
      port: this.wss ? this.port : undefined,
      hostIPs: this.wss ? this.getLocalIPAddresses() : undefined,
      roomId: this.roomId,
      token: this.wss ? this.token : undefined,
      clients,
    };
  }

  private broadcastPeerList(): void {
    const status = this.getStatus();
    const payload = JSON.stringify({
      type: 'lumen:peer-list',
      clients: status.clients,
    });
    for (const peer of this.peers.values()) {
      if (peer.socket.readyState === WebSocket.OPEN) {
        peer.socket.send(payload);
      }
    }
  }

  private send(socket: WebSocket, payload: unknown): void {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  }

  private broadcast(data: Buffer | string, exceptPeerId: string): void {
    for (const [otherId, otherPeer] of this.peers.entries()) {
      if (otherId !== exceptPeerId && otherPeer.socket.readyState === WebSocket.OPEN) {
        otherPeer.socket.send(data);
      }
    }
  }
}

export const collabServerInstance = new CollabHostServer();
