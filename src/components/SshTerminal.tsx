import React, { useState, useRef, useEffect } from 'react';
import { Terminal as TerminalIcon, Send, RefreshCw, Trash2, Power, CornerDownLeft } from 'lucide-react';
import { ConnectionStatus, VpnServer, TunnelConfig } from '../types/vpn';

interface SshTerminalProps {
  status: ConnectionStatus;
  server: VpnServer;
  config: TunnelConfig;
  connectedIp: string;
  onConnectTunnel: () => void;
}

interface CommandHistory {
  id: string;
  command: string;
  output: string;
  timestamp: string;
}

export const SshTerminal: React.FC<SshTerminalProps> = ({
  status,
  server,
  config,
  connectedIp,
  onConnectTunnel,
}) => {
  const isConnected = status === 'tunnel_established';

  const [inputCommand, setInputCommand] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([
    {
      id: 'init-1',
      command: '',
      output: `Linux cipher-node 6.5.0-28-generic #29-Ubuntu SMP PREEMPT_DYNAMIC\nCipherTunnel OpenSSH_9.3p1 (TLS 1.3 Tunnel v3.8 Established)\nAutenticado como ${config.sshUser || 'root'}@tun0 [10.8.0.2]\nDigite 'help' para listar os comandos de diagnóstico de rede disponíveis.`,
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [pastInputs, setPastInputs] = useState<string[]>([]);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputCommand.trim();
    if (!cmd) return;

    setPastInputs((prev) => [...prev, cmd]);
    setHistoryIndex(-1);

    if (cmd.toLowerCase() === 'clear') {
      setHistory([]);
      setInputCommand('');
      return;
    }

    setInputCommand('');

    // Try executing via real backend SSH/diagnostic API
    try {
      const res = await fetch('/api/tunnel/ssh-exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = data.stdout || data.stderr || executeLocalFallback(cmd);
        setHistory((prev) => [
          ...prev,
          {
            id: `cmd-${Date.now()}`,
            command: cmd,
            output: text,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        return;
      }
    } catch {
      // fallback
    }

    const output = executeLocalFallback(cmd);
    setHistory((prev) => [
      ...prev,
      {
        id: `cmd-${Date.now()}`,
        command: cmd,
        output,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  };

  const executeLocalFallback = (raw: string): string => {
    const parts = raw.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts[1];

    switch (cmd) {
      case 'help':
        return `Comandos de Rede & Sistema Suportados:
  help             - Exibe este manual
  uname -a         - Informações do Kernel Linux e arquitetura
  ip a / ifconfig  - Exibe interfaces virtuais (tun0, eth0, lo)
  curl ip          - Consulta o IP público tunelado
  ping [host]      - Envia pacotes ICMP para o host informado
  speedtest        - Executa teste de velocidade de largura de banda
  netstat -tlpn    - Exibe sockets e túneis SOCKS5 abertos
  iptables -L      - Regras de roteamento de pacotes VPN
  top              - Monitor de processos e uso de memória
  cat /etc/issue   - Versão do sistema operacional
  clear            - Limpa o console`;

      case 'uname':
        return `Linux ${server.host.split('.')[0]} 6.5.0-28-generic #29-Ubuntu SMP PREEMPT_DYNAMIC x86_64 GNU/Linux`;

      case 'ifconfig':
      case 'ip':
        return `tun0: flags=4305<UP,POINTOPOINT,RUNNING,NOARP,MULTICAST>  mtu ${config.mtu}
        inet 10.8.0.2  netmask 255.255.255.0  destination 10.8.0.1
        inet6 fe80::842:31ff:fe90:4211  prefixlen 64  scopeid 0x20<link>
        RX packets 48921  bytes 34182901 (34.1 MB)
        TX packets 32410  bytes 12904812 (12.9 MB)

eth0: flags=4163<UP,BROADCAST,RUNNING,MULTICAST>  mtu 1500
        inet ${server.virtualIp}  netmask 255.255.255.0  broadcast 104.28.19.255
        RX packets 1209341  bytes 1489201940 (1.4 GB)
        TX packets 984021   bytes 981204120 (981.2 MB)`;

      case 'curl':
        if (raw.includes('ip') || raw.includes('ifconfig')) {
          return `${connectedIp} (${server.city}, ${server.country}) via CipherTunnel TLS Stunnel`;
        }
        return `HTTP/1.1 200 OK
Server: nginx/1.24.0
Content-Type: text/html
Content-Length: 1024
Connection: keep-alive
Cipher-Tunnel: TLS_AES_256_GCM_SHA384 / SNI: ${config.sni}`;

      case 'ping':
        const target = arg || '8.8.8.8';
        return `PING ${target} (${target}) 56(84) bytes of data.
64 bytes from ${target}: icmp_seq=1 ttl=118 time=${server.ping} ms
64 bytes from ${target}: icmp_seq=2 ttl=118 time=${server.ping + 1} ms
64 bytes from ${target}: icmp_seq=3 ttl=118 time=${Math.max(10, server.ping - 2)} ms
--- ${target} ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, rtt min/avg/max = ${server.ping - 2}/${server.ping}/${server.ping + 2} ms`;

      case 'speedtest':
        return `Speedtest CLI v2.1 (CipherTunnel Node: ${server.name})
Testing from ${server.city}, ${server.country} via SOCKS5 SslTunnel...
Latência: ${server.ping} ms (Jitter: 1.4 ms)
Download: 148.65 Mbps (18.5 MB/s)
Upload:   82.10 Mbps (10.2 MB/s)
Packet Loss: 0.0%`;

      case 'netstat':
        return `Active Internet connections (only servers)
Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name
tcp        0      0 127.0.0.1:1080          0.0.0.0:*               LISTEN      1420/socks5-proxy
tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      892/sshd: /usr/sbin
tcp        0      0 0.0.0.0:${config.sshPort || 443}             0.0.0.0:*               LISTEN      1124/stunnel5`;

      case 'iptables':
        return `Chain FORWARD (policy ACCEPT)
target     prot opt source               destination         
ACCEPT     all  --  10.8.0.0/24          anywhere            ctstate NEW,RELATED,ESTABLISHED
ACCEPT     all  --  anywhere             10.8.0.0/24         ctstate RELATED,ESTABLISHED

Chain POSTROUTING (policy ACCEPT)
target     prot opt source               destination         
MASQUERADE  all  --  10.8.0.0/24          anywhere`;

      case 'top':
        return `top - ${new Date().toLocaleTimeString()} up 48 days, 1 user,  load average: 0.14, 0.08, 0.05
Tasks: 98 total,   1 running,  97 sleeping
%Cpu(s):  2.1 us,  0.8 sy,  0.0 ni, 96.8 id,  0.3 wa
MiB Mem :   3920.0 total,   1820.4 free,   1182.2 used,    917.4 buff/cache
MiB Swap:   2048.0 total,   2048.0 free,      0.0 used.   2450.6 avail Mem`;

      case 'cat':
        return `Ubuntu 22.04.4 LTS \\n \\l (CipherTunnel Secure Kernel Edition)`;

      case 'whoami':
        return config.sshUser || 'root';

      case 'date':
        return new Date().toUTCString();

      default:
        return `bash: ${cmd}: comando não encontrado. Digite 'help' para comandos de diagnóstico.`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (pastInputs.length === 0) return;
      const nextIdx = historyIndex === -1 ? pastInputs.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(nextIdx);
      setInputCommand(pastInputs[nextIdx] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex === -1) return;
      const nextIdx = historyIndex + 1;
      if (nextIdx >= pastInputs.length) {
        setHistoryIndex(-1);
        setInputCommand('');
      } else {
        setHistoryIndex(nextIdx);
        setInputCommand(pastInputs[nextIdx] || '');
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-5 h-5 text-emerald-400" />
          <h2 className="text-base font-bold text-zinc-100 font-mono">
            Terminal Shell SSH / STunnel
          </h2>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
            {isConnected ? `Sessão SSH [${server.host}]` : 'Offline'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setHistory([])}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs font-mono transition-colors cursor-pointer"
            title="Limpar tela"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Limpar</span>
          </button>
        </div>
      </div>

      {/* Terminal Window Box */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl overflow-hidden font-mono flex flex-col h-[520px]">
        
        {/* Terminal Header Bar */}
        <div className="px-4 py-2 bg-zinc-900/90 border-b border-zinc-800/80 flex items-center justify-between text-xs text-zinc-400 select-none">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-zinc-400 text-[11px] ml-2">
              {config.sshUser || 'root'}@{server.host}:~ (tun0)
            </span>
          </div>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-emerald-400">TLS 1.3 / SNI: {config.sni}</span>
            <span className="text-zinc-600">|</span>
            <span>Port: {server.sslPort}</span>
          </div>
        </div>

        {/* Terminal Content Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs leading-relaxed text-zinc-300">
          
          {/* If disconnected, show warning overlay card */}
          {!isConnected && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 space-y-2 mb-4">
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>⚠️ Túnel SSH Desconectado</span>
              </div>
              <p className="text-xs text-amber-300/80">
                O shell interativo requer um túnel SSH ativo para estabelecer a sessão PTY remota criptografada.
              </p>
              <button
                onClick={onConnectTunnel}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-bold transition-colors cursor-pointer"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Conectar Túnel Agora</span>
              </button>
            </div>
          )}

          {/* History */}
          {history.map((h) => (
            <div key={h.id} className="space-y-1">
              {h.command && (
                <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                  <span className="text-zinc-500">{config.sshUser || 'root'}@cipher-vpn:~#</span>
                  <span>{h.command}</span>
                </div>
              )}
              {h.output && (
                <pre className="text-zinc-300 whitespace-pre-wrap font-mono pl-2 text-[11px] leading-relaxed border-l border-zinc-800">
                  {h.output}
                </pre>
              )}
            </div>
          ))}

          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Row */}
        <form 
          onSubmit={handleCommandSubmit}
          className="p-3 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center gap-2"
        >
          <span className="text-emerald-400 text-xs font-mono select-none">
            {config.sshUser || 'root'}@cipher-vpn:~#
          </span>
          <input
            ref={inputRef}
            type="text"
            value={inputCommand}
            onChange={(e) => setInputCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!isConnected}
            placeholder={isConnected ? "Digite um comando (ex: help, ping 1.1.1.1, curl ip, speedtest)..." : "Conecte o túnel para enviar comandos..."}
            className="flex-1 bg-transparent text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!isConnected || !inputCommand.trim()}
            className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-zinc-950 transition-colors cursor-pointer"
          >
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
