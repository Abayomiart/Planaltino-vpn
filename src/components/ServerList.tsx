import React, { useState } from 'react';
import { 
  Server, 
  Search, 
  RefreshCw, 
  Plus, 
  Download, 
  Upload, 
  Check, 
  Trash2, 
  Wifi, 
  Globe2,
  Lock,
  Layers
} from 'lucide-react';
import { VpnServer, TunnelProtocol } from '../types/vpn';

interface ServerListProps {
  servers: VpnServer[];
  selectedServer: VpnServer;
  onSelectServer: (server: VpnServer) => void;
  onAddServer: (server: VpnServer) => void;
  onDeleteServer: (id: string) => void;
  onRefreshPings: () => void;
  isRefreshingPings: boolean;
}

export const ServerList: React.FC<ServerListProps> = ({
  servers,
  selectedServer,
  onSelectServer,
  onAddServer,
  onDeleteServer,
  onRefreshPings,
  isRefreshingPings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<'all' | TunnelProtocol>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New custom server form state
  const [newServer, setNewServer] = useState<Partial<VpnServer>>({
    name: '',
    country: 'Servidor Personalizado',
    city: 'Custom',
    flag: '🌐',
    host: '',
    port: 22,
    sslPort: 443,
    sni: 'whatsapp.net',
    protocol: 'ssh_tls',
    sshUser: 'root',
    sshPass: '',
    load: 20,
    ping: 50,
    virtualIp: '10.8.0.1',
    isCustom: true,
  });

  const filteredServers = servers.filter((srv) => {
    const matchesSearch = 
      srv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
      srv.host.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProto = protocolFilter === 'all' || srv.protocol === protocolFilter;
    return matchesSearch && matchesProto;
  });

  const handleCreateServer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServer.name || !newServer.host) return;

    const created: VpnServer = {
      id: `custom-${Date.now()}`,
      name: newServer.name,
      country: newServer.country || 'Custom',
      city: newServer.city || 'Custom',
      flag: newServer.flag || '🌐',
      host: newServer.host,
      port: Number(newServer.port) || 22,
      sslPort: Number(newServer.sslPort) || 443,
      sni: newServer.sni || 'whatsapp.net',
      protocol: newServer.protocol || 'ssh_tls',
      sshUser: newServer.sshUser || 'root',
      sshPass: newServer.sshPass || '',
      ping: Math.floor(Math.random() * 40) + 30,
      load: 15,
      virtualIp: '10.8.0.55',
      isCustom: true,
    };

    onAddServer(created);
    setIsAddModalOpen(false);
    setNewServer({
      name: '',
      country: 'Servidor Personalizado',
      city: 'Custom',
      flag: '🌐',
      host: '',
      port: 22,
      sslPort: 443,
      sni: 'whatsapp.net',
      protocol: 'ssh_tls',
      sshUser: 'root',
      sshPass: '',
    });
  };

  const handleExportConfig = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(servers, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'ciphertunnel_servers.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed)) {
          parsed.forEach((s) => {
            if (s.host && s.name) {
              onAddServer({ ...s, id: `imported-${Date.now()}-${Math.random().toString(36).substring(7)}`, isCustom: true });
            }
          });
        }
      } catch {
        // error parsing
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Server className="w-5 h-5 text-emerald-400" />
            <span>Nós e Servidores de Túnel</span>
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Servidores de alta velocidade otimizados para SSH sobre TLS/SSL e WireGuard
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onRefreshPings}
            disabled={isRefreshingPings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isRefreshingPings ? 'animate-spin' : ''}`} />
            <span>Testar Pings</span>
          </button>

          <button
            onClick={handleExportConfig}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Exportar perfis em formato JSON"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exportar</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Importar</span>
            <input type="file" accept=".json,.sshvpn,.ehi" onChange={handleImportConfig} className="hidden" />
          </label>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-semibold text-zinc-950 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Nó</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por país, cidade ou host..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 font-mono"
          />
        </div>

        <div className="flex items-center gap-1 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'ssh_tls', 'wireguard', 'v2ray_vmess'] as const).map((proto) => {
            const label = proto === 'all' ? 'Todos' : proto === 'ssh_tls' ? 'SSH/TLS' : proto === 'wireguard' ? 'WireGuard' : 'V2Ray';
            const isActive = protocolFilter === proto;
            return (
              <button
                key={proto}
                onClick={() => setProtocolFilter(proto)}
                className={`px-2.5 py-1 rounded text-[11px] font-mono whitespace-nowrap cursor-pointer transition-colors ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-zinc-400 hover:text-zinc-200 bg-zinc-950/60 border border-zinc-800/80'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Servers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredServers.map((srv) => {
          const isSelected = selectedServer.id === srv.id;
          const pingColor = 
            srv.ping < 60 ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' :
            srv.ping < 140 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20' :
            'text-red-400 bg-red-500/10 border-red-500/20';

          return (
            <div
              key={srv.id}
              onClick={() => onSelectServer(srv)}
              className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${
                isSelected
                  ? 'bg-zinc-900 border-emerald-500 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                  : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900/90'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                
                {/* Left info */}
                <div className="flex items-start gap-3">
                  <span className="text-3xl select-none">{srv.flag}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-100 group-hover:text-emerald-400 transition-colors">
                        {srv.name}
                      </h3>
                      {srv.isCustom && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/60 text-cyan-300 border border-cyan-800/40 font-mono">
                          CUSTOM
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-xs text-zinc-400 font-mono">
                      <span>{srv.city}, {srv.country}</span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-zinc-500">{srv.host}</span>
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-[11px] font-mono text-zinc-400">
                      <span className="text-emerald-400/90">
                        {srv.protocol === 'ssh_tls' ? 'SSH+TLS:443' : srv.protocol === 'wireguard' ? 'WireGuard:51820' : 'V2Ray:443'}
                      </span>
                      <span>SNI: <strong className="text-zinc-300">{srv.sni}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right metrics */}
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-2 py-0.5 rounded text-xs font-mono font-bold border flex items-center gap-1 ${pingColor}`}>
                    <Wifi className="w-3 h-3" />
                    <span>{srv.ping} ms</span>
                  </div>

                  {/* Server load */}
                  <div className="w-20 text-right">
                    <div className="flex justify-between text-[10px] font-mono text-zinc-500 mb-0.5">
                      <span>Carga</span>
                      <span>{srv.load}%</span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-1 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          srv.load > 70 ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${srv.load}%` }}
                      />
                    </div>
                  </div>

                  {/* Selected checkmark or Delete button if custom */}
                  <div className="flex items-center gap-2 mt-1">
                    {srv.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteServer(srv.id);
                        }}
                        className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remover servidor personalizado"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isSelected ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center shadow-md shadow-emerald-500/20">
                        <Check className="w-4 h-4 stroke-[3]" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-zinc-700 group-hover:border-emerald-500/50 flex items-center justify-center text-zinc-500" />
                    )}
                  </div>

                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Server Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Adicionar Servidor SSH / VPN</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-zinc-500 hover:text-zinc-300 text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateServer} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1">Nome do Servidor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: VPS Brasil Privado"
                    value={newServer.name || ''}
                    onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1">Bandeira / Emoji</label>
                  <input
                    type="text"
                    placeholder="🇧🇷 ou 🌐"
                    value={newServer.flag || '🌐'}
                    onChange={(e) => setNewServer({ ...newServer, flag: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-mono text-zinc-400 block mb-1">Host / IP do Servidor</label>
                  <input
                    type="text"
                    required
                    placeholder="vps.seuservidor.com ou 192.168.1.1"
                    value={newServer.host || ''}
                    onChange={(e) => setNewServer({ ...newServer, host: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1">Porta SSL/TLS</label>
                  <input
                    type="number"
                    value={newServer.sslPort || 443}
                    onChange={(e) => setNewServer({ ...newServer, sslPort: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-400 block mb-1">SNI Bug Host (Server Name Indication)</label>
                <input
                  type="text"
                  placeholder="Ex: whatsapp.net ou cdn.cloudflare.com"
                  value={newServer.sni || ''}
                  onChange={(e) => setNewServer({ ...newServer, sni: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1">Usuário SSH</label>
                  <input
                    type="text"
                    placeholder="root ou vpnuser"
                    value={newServer.sshUser || ''}
                    onChange={(e) => setNewServer({ ...newServer, sshUser: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-400 block mb-1">Senha SSH</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={newServer.sshPass || ''}
                    onChange={(e) => setNewServer({ ...newServer, sshPass: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-mono font-bold text-zinc-950 cursor-pointer shadow-md shadow-emerald-950/40"
                >
                  Salvar Servidor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
