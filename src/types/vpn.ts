export type ConnectionStatus =
  | 'disconnected'
  | 'resolving'
  | 'tls_handshake'
  | 'payload_injection'
  | 'ssh_auth'
  | 'tunnel_established'
  | 'disconnecting'
  | 'error';

export type TunnelProtocol = 
  | 'ssh_tls'          // SSH over TLS / SSL Stunnel (SNI Bug Host)
  | 'ssh_direct'       // Direct SSH
  | 'ssh_http_proxy'   // SSH via HTTP Proxy & Custom Payload
  | 'wireguard'        // Modern WireGuard VPN
  | 'v2ray_vmess';     // V2Ray / VMess TLS

export type TlsVersion = 'TLS 1.3' | 'TLS 1.2' | 'TLS 1.1' | 'Auto';

export interface VpnServer {
  id: string;
  name: string;
  flag: string;
  country: string;
  city: string;
  host: string;
  port: number;
  sslPort: number;
  sni: string;
  protocol: TunnelProtocol;
  sshUser: string;
  sshPass: string;
  ping: number;
  load: number;
  virtualIp: string;
  isCustom?: boolean;
}

export interface TunnelConfig {
  protocol: TunnelProtocol;
  sni: string;
  tlsVersion: TlsVersion;
  alpn: string;
  payload: string;
  proxyHost: string;
  proxyPort: number;
  useProxy: boolean;
  sshUser: string;
  sshPass: string;
  sshPort: number;
  dnsPrimary: string;
  dnsSecondary: string;
  mtu: number;
  enableKillSwitch: boolean;
  enableDnsLeakProtection: boolean;
  enableCompression: boolean;
  enableUdpForwarding: boolean;
}

export interface ConnectionStats {
  bytesIn: number;
  bytesOut: number;
  speedDown: number; // in KB/s
  speedUp: number;   // in KB/s
  peakSpeedDown: number;
  peakSpeedUp: number;
  pingMs: number;
  durationSeconds: number;
  realIp: string;
  realIsp: string;
  realCountry: string;
  connectedIp: string;
  connectedIsp: string;
  cipherSuite: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'success' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  tag: string;
  message: string;
}

export interface SpeedHistoryPoint {
  time: string;
  download: number; // KB/s
  upload: number;   // KB/s
}
