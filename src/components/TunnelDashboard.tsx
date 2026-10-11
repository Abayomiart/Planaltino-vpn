import React from 'react';
import { 
  Power, 
  ArrowDown, 
  ArrowUp, 
  Activity, 
  Server, 
  Shield, 
  Radio, 
  Zap, 
  Clock, 
  Cpu, 
  ChevronRight,
  Terminal as TerminalIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { 
  ConnectionStatus, 
  VpnServer, 
  TunnelConfig, 
  ConnectionStats, 
  SpeedHistoryPoint 
} from '../types/vpn';
import { formatBytes, formatSpeed, formatDuration } from '../utils/network';

interface TunnelDashboardProps {
  status: ConnectionStatus;
  server: VpnServer;
  config: TunnelConfig;
  stats: ConnectionStats;
  speedHistory: SpeedHistoryPoint[];
  onToggleConnect: () => void;
  onSelectServerClick: () => void;
  onConfigClick: () => void;
  onOpenTerminalClick: () => void;
  onOpenLogsClick: () => void;
}

export const TunnelDashboard: React.FC<TunnelDashboardProps> = ({
  status,
  server,
  config,
  stats,
  speedHistory,
  onToggleConnect,
  onSelectServerClick,
  onConfigClick,
  onOpenTerminalClick,
  onOpenLogsClick,
}) => {
  const isConnected = status === 'tunnel_established';
  const isConnecting = ['resolving', 'tls_handshake', 'payload_injection', 'ssh_auth'].includes(status);

  const getStatusText = () => {
    switch (status) {
      case 'resolving': return '1/4 Resolvendo DNS do Host...';
      case 'tls_handshake': return `2/4 Handshake TLS 1.3 via SNI [${config.sni}]...`;
      case 'payload_injection': return '3/4 Injetando Payload & Handshake HTTP...';
      case 'ssh_auth': return `4/4 Autenticando SSH (${config.sshUser})...`;
      case 'tunnel_established': return 'Túnel SSH/TLS Estabelecido (tun0 Ativo)';
      case 'disconnecting': return 'Desconectando interface segura...';
      case 'error': return 'Falha na conexão do túnel';
      default: return 'Pronto para conectar ao túnel TLS';
    }
  };

  // Sparkline coordinates for Download / Upload speed
  const renderSparkline = () => {
    if (speedHistory.length < 2) return null;
    const maxSpeed = Math.max(...speedHistory.map(p => Math.max(p.download, p.upload, 50)), 100);
    const width = 280;
    const height = 48;
    
    const downPoints = speedHistory.map((p, idx) => {
      const x = (idx / (speedHistory.length - 1)) * width;
      const y = height - (p.download / maxSpeed) * (height - 6);
      return `${x},${y}`;
    }).join(' ');

    const upPoints = speedHistory.map((p, idx) => {
      const x = (idx / (speedHistory.length - 1)) * width;
      const y = height - (p.upload / maxSpeed) * (height - 6);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-full h-12 overflow-visible" viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <linearGradient id="downGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Download line */}
        <polyline
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={downPoints}
        />
        {/* Upload line */}
        <polyline
          fill="none"
          stroke="#06b6d4"
          strokeWidth="1.5"
          strokeDasharray="2 2"
          strokeLinecap="round"
          points={upPoints}
        />
      </svg>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner: Connection Core */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/90 to-zinc-950 border border-zinc-800 p-6 md:p-8 shadow-2xl">
        {/* Background circuit grid effect */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          
          {/* Main Tactile Power Button */}
          <div className="flex flex-col items-center">
            <div className="relative">
              {/* Outer pulsing wave rings */}
              {isConnected && (
                <>
                  <div className="absolute -inset-4 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
                  <div className="absolute -inset-2 rounded-full border border-emerald-500/30 animate-ping opacity-30" />
                </>
              )}
              {isConnecting && (
                <div className="absolute -inset-3 rounded-full border-2 border-dashed border-amber-500/50 animate-spin" />
              )}

              <button
                onClick={onToggleConnect}
                disabled={status === 'disconnecting'}
                className={`relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl cursor-pointer group select-none ${
                  isConnected
                    ? 'bg-gradient-to-b from-emerald-500 to-emerald-700 text-zinc-950 border-4 border-emerald-300/40 shadow-emerald-500/30 hover:scale-105 active:scale-95'
                    : isConnecting
                    ? 'bg-gradient-to-b from-amber-600 to-amber-800 text-amber-100 border-4 border-amber-400/50 animate-pulse'
                    : 'bg-gradient-to-b from-zinc-800 to-zinc-900 text-zinc-300 border-4 border-zinc-700 hover:border-emerald-500/50 hover:text-emerald-400 hover:scale-105 active:scale-95 shadow-black/40'
                }`}
              >
                <Power className={`w-12 h-12 transition-transform duration-300 ${
                  isConnected ? 'text-zinc-950 stroke-[2.5]' : isConnecting ? 'animate-spin' : 'group-hover:scale-110'
                }`} />
                <span className={`text-xs font-bold tracking-wider mt-2 font-mono uppercase ${
                  isConnected ? 'text-zinc-950 font-extrabold' : 'text-zinc-300'
                }`}>
                  {isConnected ? 'DESCONECTAR' : isConnecting ? 'CANCELAR' : 'CONECTAR'}
                </span>
              </button>
            </div>

            {/* Status read-out pill below button */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-xs font-mono">
                <span className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : isConnecting ? 'bg-amber-400 animate-ping' : 'bg-zinc-600'
                }`} />
                <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-zinc-400'}>
                  {getStatusText()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Telemetry & Status Center */}
          <div className="flex-1 w-full max-w-lg space-y-4">
            
            {/* Active Server Card */}
            <div 
              onClick={onSelectServerClick}
              className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-emerald-500/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{server.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {server.name}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                        {server.port === 22 ? 'SSH:22' : `Port:${server.sslPort}`}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 font-mono flex items-center gap-2 mt-0.5">
                      <span>{server.host}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-emerald-400/90">SNI: {config.sni}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-200">
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-emerald-400">{server.ping} ms</span>
                    <p className="text-[10px] text-zinc-500 uppercase font-mono">Latência</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>

            {/* Connection Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              
              {/* Ping Card */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-mono">PING</span>
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-lg font-bold font-mono text-zinc-100">
                  {isConnected ? `${stats.pingMs} ms` : `${server.ping} ms`}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {stats.pingMs < 50 ? 'Excelente' : stats.pingMs < 120 ? 'Bom' : 'Moderado'}
                </div>
              </div>

              {/* Session Time */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-mono">TEMPO</span>
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-bold font-mono text-zinc-100">
                  {formatDuration(stats.durationSeconds)}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {isConnected ? 'Sessão ativa' : 'Pausado'}
                </div>
              </div>

              {/* Download Speed */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-mono">DOWNLOAD</span>
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-lg font-bold font-mono text-emerald-400">
                  {isConnected ? formatSpeed(stats.speedDown) : '0 KB/s'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {formatBytes(stats.bytesIn)}
                </div>
              </div>

              {/* Upload Speed */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="flex items-center justify-between text-zinc-400 mb-1">
                  <span className="text-[11px] font-mono">UPLOAD</span>
                  <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
                </div>
                <div className="text-lg font-bold font-mono text-cyan-400">
                  {isConnected ? formatSpeed(stats.speedUp) : '0 KB/s'}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">
                  {formatBytes(stats.bytesOut)}
                </div>
              </div>

            </div>

            {/* Live Traffic Sparkline */}
            <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/60">
              <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-1">
                <span className="flex items-center gap-1.5">
                  <Radio className="w-3 h-3 text-emerald-400" />
                  Fluxo de Tráfego em Tempo Real
                </span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-emerald-400 inline-block" /> Down
                  </span>
                  <span className="text-cyan-400 flex items-center gap-1">
                    <span className="w-2 h-0.5 bg-cyan-400 inline-block border-b border-dashed" /> Up
                  </span>
                </div>
              </div>
              <div className="h-12 w-full flex items-center justify-center">
                {isConnected ? (
                  renderSparkline()
                ) : (
                  <div className="text-xs text-zinc-600 font-mono">
                    Conecte o túnel para visualizar oscilação de pacotes
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

        {/* Bottom Technical Bar */}
        <div className="mt-6 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono text-zinc-400">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Cipher:</span>
              <strong className="text-zinc-200">{isConnected ? stats.cipherSuite : 'AES-256-GCM / TLS 1.3'}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Interface Virtual:</span>
              <strong className="text-zinc-200">{isConnected ? 'tun0 (10.8.0.2/24)' : 'Inativa'}</strong>
            </span>
            <span>•</span>
            <span>
              DNS: <strong className="text-zinc-200">{config.dnsPrimary}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTerminalClick}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer text-[11px]"
            >
              <TerminalIcon className="w-3 h-3 text-emerald-400" />
              <span>Shell SSH</span>
            </button>
            <button
              onClick={onOpenLogsClick}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white transition-colors cursor-pointer text-[11px]"
            >
              <span>Ver Logs</span>
            </button>
          </div>
        </div>
      </div>

      {/* Protocol Architecture & Security Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: SSH over TLS Tunneling */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400">
            <Shield className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Túnel SSH sobre TLS (SSL)</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Encapsula todo tráfego SSH dentro de uma camada TLS 1.3 padrão HTTPS (porta 443), camuflando a conexão com cabeçalho SNI legítimo contra firewalls e DPI.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-500 flex items-center justify-between border-t border-zinc-800/60">
            <span>SNI Ativo:</span>
            <span className="text-emerald-400 font-semibold">{config.sni}</span>
          </div>
        </div>

        {/* Card 2: DNS Anti-Leak & KillSwitch */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 text-cyan-400">
            <Cpu className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Proteção e Kill Switch</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Bloqueia todo vazamento de DNS forçando consultas via DoT/DoH seguro. O Kill Switch encerra conexões externas imediatamente caso o túnel caia.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-500 flex items-center justify-between border-t border-zinc-800/60">
            <span>Kill Switch:</span>
            <span className={config.enableKillSwitch ? "text-emerald-400 font-semibold" : "text-zinc-500"}>
              {config.enableKillSwitch ? 'Habilitado' : 'Desabilitado'}
            </span>
          </div>
        </div>

        {/* Card 3: Custom Payload & Bug Host */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
          <div className="flex items-center gap-2 text-amber-400">
            <Zap className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Injeção de Cabeçalhos HTTP</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Suporta injeção personalizada de payloads HTTP (Front Inject, Back Inject, Online Host) para transpor proxies corporativos e regras de operadoras móveis.
          </p>
          <div className="pt-2 text-[11px] font-mono text-zinc-500 flex items-center justify-between border-t border-zinc-800/60">
            <button 
              onClick={onConfigClick}
              className="text-amber-400 hover:text-amber-300 transition-colors cursor-pointer flex items-center gap-1 font-semibold"
            >
              <span>Ajustar Payload</span>
              <ChevronRight className="w-3 h-3" />
            </button>
            <span className="text-zinc-400 font-mono">MTU {config.mtu}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
