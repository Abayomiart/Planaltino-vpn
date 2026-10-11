import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Activity, 
  Globe, 
  Terminal, 
  Sliders, 
  Server, 
  FileText,
  Wrench
} from 'lucide-react';
import { ConnectionStatus, TunnelProtocol } from '../types/vpn';

interface HeaderProps {
  status: ConnectionStatus;
  protocol: TunnelProtocol;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  realIp: string;
  connectedIp: string;
  killSwitchActive: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  protocol,
  activeTab,
  setActiveTab,
  realIp,
  connectedIp,
  killSwitchActive,
}) => {
  const isConnected = status === 'tunnel_established';
  const isConnecting = ['resolving', 'tls_handshake', 'payload_injection', 'ssh_auth'].includes(status);

  const getProtocolLabel = (proto: TunnelProtocol) => {
    switch (proto) {
      case 'ssh_tls': return 'SSH + TLS (SNI)';
      case 'ssh_direct': return 'SSH Direct';
      case 'ssh_http_proxy': return 'SSH + HTTP Proxy';
      case 'wireguard': return 'WireGuard UDP';
      case 'v2ray_vmess': return 'V2Ray / VMess';
      default: return 'SSH TLS';
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Túnel & VPN', icon: Lock },
    { id: 'vpnservice', label: 'VPNService Nativo', icon: ShieldCheck },
    { id: 'servers', label: 'Servidores', icon: Server },
    { id: 'config', label: 'Configuração TLS', icon: Sliders },
    { id: 'terminal', label: 'Terminal SSH', icon: Terminal },
    { id: 'logs', label: 'Logs', icon: FileText },
    { id: 'tools', label: 'Segurança & Rede', icon: Wrench },
  ];

  return (
    <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-500/10">
              <Lock className="w-5 h-5 animate-pulse-subtle" />
              {isConnected && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-zinc-950 animate-ping" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold tracking-wider text-zinc-100 font-mono">
                  CIPHER<span className="text-emerald-400">TUNNEL</span>
                </span>
                <span className="text-[10px] font-mono tracking-widest px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700/60 uppercase">
                  v3.8 PRO
                </span>
              </div>
              <p className="text-xs text-zinc-400 flex items-center gap-1.5 font-mono">
                <span>SSH over TLS / SSL Stunnel</span>
                <span className="text-zinc-600">|</span>
                <span className="text-emerald-400/90 font-medium">{getProtocolLabel(protocol)}</span>
              </p>
            </div>
          </div>

          {/* Quick Status Bar */}
          <div className="hidden md:flex items-center gap-4">
            {/* IP Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/80 border border-zinc-800 text-xs font-mono">
              <Globe className="w-3.5 h-3.5 text-zinc-400" />
              <span className="text-zinc-400">IP:</span>
              <span className={isConnected ? "text-emerald-400 font-semibold" : "text-zinc-300"}>
                {isConnected ? connectedIp : realIp}
              </span>
              {isConnected && (
                <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  PROTEGIDO
                </span>
              )}
            </div>

            {/* Kill Switch status */}
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs">
              {killSwitchActive ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-zinc-300 text-[11px] font-mono">KillSwitch: ATIVO</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="text-zinc-500 text-[11px] font-mono">KillSwitch: OFF</span>
                </>
              )}
            </div>

            {/* Connection Status Pill */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border ${
              isConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                : isConnecting
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400 animate-pulse'
                  : isConnecting
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-zinc-600'
              }`} />
              <span className="capitalize">
                {isConnected ? 'Túnel Ativo' : isConnecting ? 'Conectando...' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-zinc-850 pt-1 overflow-x-auto scrollbar-none py-1.5">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/5'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-zinc-400'}`} />
                <span>{tab.label}</span>
                {tab.id === 'logs' && isConnected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
