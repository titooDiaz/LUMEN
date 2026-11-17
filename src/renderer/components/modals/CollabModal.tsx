import React, { useEffect, useState } from 'react';
import {
  X,
  Share2,
  Server,
  Users,
  Copy,
  Check,
  Power,
  Shield,
  Wifi,
  Radio,
  UserCheck,
} from 'lucide-react';
import { CollabSession, CollabStatus } from '../../../shared/types';

interface CollabModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: CollabStatus;
  onStartServer: (port?: number, token?: string) => Promise<void>;
  onStopServer: () => Promise<void>;
  onConnectRemote: (host: string, port: number, token: string, name: string) => Promise<boolean | string>;
  currentUserName: string;
  onChangeUserName: (name: string) => void;
  isConnectedToRemote: boolean;
  connectionError?: string;
  mode: 'host' | 'join' | 'both';
}

export const CollabModal: React.FC<CollabModalProps> = ({
  isOpen,
  onClose,
  status,
  onStartServer,
  onStopServer,
  onConnectRemote,
  currentUserName,
  onChangeUserName,
  isConnectedToRemote,
  connectionError = '',
  mode,
}) => {
  const [activeTab, setActiveTab] = useState<'host' | 'join'>(mode === 'join' ? 'join' : 'host');
  const [joining, setJoining] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [joinError, setJoinError] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);

  // Host configuration
  const [hostPort, setHostPort] = useState(8765);
  const [customToken, setCustomToken] = useState('');

  // Join configuration
  const [joinToken, setJoinToken] = useState('');
  const [manualHost, setManualHost] = useState('');
  const [manualPort, setManualPort] = useState('8765');
  const [joinNick, setJoinNick] = useState(randomGhostName());
  const [sessions, setSessions] = useState<CollabSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<CollabSession | null>(null);

  useEffect(() => {
    if (!isOpen || mode !== 'join') return;
    let alive = true;
    const refresh = async () => {
      try {
        const available = await window.lumenAPI.getAvailableCollabSessions();
        if (alive) setSessions(available);
      } catch { if (alive) setSessions([]); }
    };
    void refresh();
    const timer = window.setInterval(refresh, 2000);
    return () => { alive = false; window.clearInterval(timer); };
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleStartHosting = async () => {
    await onStartServer(hostPort, customToken || undefined);
  };

  const handleJoin = async () => {
    const host = selectedSession?.host || manualHost.trim();
    const port = selectedSession?.port || Number(manualPort);
    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
      setJoinError(true);
      setJoinMessage('Selecciona una sesión o introduce una IP y un puerto válidos.');
      return;
    }
    setJoining(true);
    setJoinError(false);
    setJoinMessage('Conectando con la sesión…');
    onChangeUserName(joinNick);
    let connected = false;
    let failureMessage = '';
    try {
      const result = await onConnectRemote(host, port, joinToken.trim(), joinNick.trim());
      connected = result === true;
      if (typeof result === 'string') failureMessage = result;
    } catch {
      connected = false;
    }
    setJoining(false);
    if (connected) {
      setJoinMessage('¡Conexión exitosa! Abriendo el archivo compartido…');
      window.setTimeout(onClose, 1000);
    } else {
      setJoinError(true);
      setJoinMessage(failureMessage || connectionError || 'No se pudo unir. Revisa el token y comprueba que la sesión siga activa.');
    }
  };

  function randomGhostName() {
    const names = ['sigma ghost', 'random ghost', 'otaku ghost', 'pixel ghost', 'lunar ghost', 'cosmic ghost', 'syntax ghost', 'phantom ghost', 'boba ghost', 'neon ghost'];
    return names[Math.floor(Math.random() * names.length)];
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card border border-border shadow-2xl rounded-xl w-full max-w-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-border flex items-center justify-between bg-card/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground">Colaboración Descentralizada</h3>
              <p className="text-xs text-muted-foreground">Edición en tiempo real alojada directamente en tu equipo (P2P Host)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        {mode === 'both' && <div className="flex border-b border-border bg-secondary/30 px-5 pt-2 space-x-4 text-xs font-medium">
          <button
            onClick={() => setActiveTab('host')}
            className={`pb-2 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'host'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Hospedar Sesión (Servidor Anfitrión)</span>
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`pb-2 border-b-2 flex items-center space-x-1.5 transition ${
              activeTab === 'join'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Unirse a Sesión de un Colega</span>
          </button>
        </div>}

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          {activeTab === 'host' ? (
            <div className="space-y-4">
              {/* Server Status Banner */}
              <div
                className={`p-3.5 rounded-lg border flex items-center justify-between transition ${
                  status.isHosting
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-secondary/40 border-border text-muted-foreground'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${status.isHosting ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground'}`} />
                  <div>
                    <span className="font-semibold text-foreground">
                      {status.isHosting ? 'Servidor Anfitrión Activo' : 'Servidor Inactivo'}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      {status.isHosting
                        ? `Alojando en puerto ${status.port} • ${status.clients.length}/5 participante(s)`
                        : 'Inicia el servidor para compartir este proyecto desde tu máquina'}
                    </p>
                  </div>
                </div>

                {status.isHosting ? (
                  <button
                    onClick={onStopServer}
                    className="px-3 py-1.5 bg-destructive/20 hover:bg-destructive/30 text-red-400 border border-destructive/30 rounded-md font-medium transition flex items-center space-x-1"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>Detener</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStartHosting}
                    className="px-3 py-1.5 bg-primary text-primary-foreground hover:bg-primary-hover rounded-md font-medium transition flex items-center space-x-1 shadow-sm"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Iniciar Servidor</span>
                  </button>
                )}
              </div>

              {/* Host Details when Running */}
              {status.isHosting && (
                <div className="space-y-3 bg-secondary/30 p-3.5 rounded-lg border border-border">
                  <div className="flex items-center justify-between text-muted-foreground font-semibold">
                    <span>Direcciones de Conexión en Red (LAN / Wi-Fi):</span>
                    <Shield className="w-3.5 h-3.5 text-primary" />
                  </div>

                  <div className="space-y-1.5">
                    {status.hostIPs?.map((ip, i) => {
                      const connStr = `${ip}:${status.port}`;
                      return (
                        <div key={i} className="flex items-center justify-between bg-card p-2 rounded border border-border text-foreground font-mono">
                          <span>{connStr}</span>
                          <button
                            onClick={() => copyToClipboard(connStr, `ip-${i}`)}
                            className="p-1 text-muted-foreground hover:text-foreground rounded transition"
                            title="Copiar dirección"
                          >
                            {copiedIndex === `ip-${i}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between bg-card p-2 rounded border border-border text-foreground">
                    <div className="flex items-center space-x-2">
                      <span className="text-muted-foreground">Token de Seguridad:</span>
                      <span className="font-mono font-bold text-primary">{status.token}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(status.token || '', 'token')}
                      className="p-1 text-muted-foreground hover:text-foreground rounded transition"
                      title="Copiar token"
                    >
                      {copiedIndex === 'token' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Connected Peers list */}
              {status.isHosting && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-muted-foreground font-semibold">
                    <span className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5" />
                      <span>Participantes Conectados ({status.clients.length})</span>
                    </span>
                  </div>

                  {status.clients.length === 0 ? (
                    <p className="text-center py-4 text-muted-foreground bg-secondary/20 rounded border border-dashed border-border">
                      Esperando a que otros usuarios se conecten con tu IP y Token...
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {status.clients.map((client) => (
                        <div key={client.id} className="flex items-center justify-between p-2 rounded bg-secondary/40 border border-border">
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: client.color }} />
                            <span className="font-medium text-foreground">{client.name}</span>
                            {client.isHost && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-primary/20 text-primary font-semibold">
                                Anfitrión
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-emerald-400 font-medium">Lectura / Escritura</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Join Tab */
            <div className="space-y-3">
              <div>
                <div className="mb-1 flex items-center justify-between"><label className="text-muted-foreground">Sesiones disponibles en tu red</label><span className="text-[10px] text-muted-foreground">Actualiza automáticamente</span></div>
                <div className="max-h-36 space-y-1 overflow-y-auto rounded-md border border-border bg-secondary/20 p-1.5">
                  {sessions.length === 0 ? <p className="p-3 text-center text-muted-foreground">No se detectan sesiones. La red puede bloquear broadcasts; prueba ingresando la dirección LAN del anfitrión.</p> : sessions.map((session) => (
                    <button key={session.id} type="button" onClick={() => setSelectedSession(session)} className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left ${selectedSession?.id === session.id ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-accent'}`}>
                      <span><span className="block font-semibold text-foreground">👻 {session.name}</span><span className="font-mono text-[10px] text-muted-foreground">{session.host}:{session.port}</span></span>
                      <span className="text-[10px] text-muted-foreground">{session.participants}/5</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-[1fr_100px] gap-2">
                <div>
                  <label className="mb-1 block text-muted-foreground">Dirección IP del anfitrión (alternativa)</label>
                  <input value={manualHost} onChange={(event) => setManualHost(event.target.value)} placeholder="10.14.120.203" className="w-full rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-muted-foreground">Puerto</label>
                  <input value={manualPort} onChange={(event) => setManualPort(event.target.value)} inputMode="numeric" className="w-full rounded-md border border-border bg-secondary/40 px-2.5 py-1.5 font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
              </div>

              <div>
                <label className="text-muted-foreground block mb-1">Token de Seguridad de la Sesión:</label>
                <input
                  type="text"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  className="w-full bg-secondary/40 border border-border rounded-md px-2.5 py-1.5 text-foreground font-mono focus:outline-none focus:ring-1 focus:ring-primary"
                  placeholder="Contraseña compartida por el anfitrión"
                />
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => void handleJoin()}
                  disabled={joining || (!selectedSession && !manualHost.trim()) || !joinToken.trim() || !joinNick.trim()}
                  className="w-full py-2 bg-primary text-primary-foreground hover:bg-primary-hover rounded-md font-medium transition flex items-center justify-center space-x-2 shadow-sm"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{joining ? 'Conectando…' : 'Unirme a la sesión'}</span>
                </button>
                {joinMessage && <p role={joinError ? 'alert' : 'status'} className={`mt-2 text-center text-xs ${joinError ? 'text-red-400' : 'text-emerald-400'}`}>{joinMessage}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border flex items-center justify-end space-x-2 bg-card/60">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
