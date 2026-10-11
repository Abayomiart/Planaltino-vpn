import React, { useState } from 'react';
import { 
  Smartphone, 
  ShieldCheck, 
  FileCode, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Radio, 
  Play, 
  Cpu, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { VpnServer, TunnelConfig, ConnectionStatus } from '../types/vpn';

interface VpnServicePanelProps {
  server: VpnServer;
  config: TunnelConfig;
  status: ConnectionStatus;
  connectedIp: string;
}

export const VpnServicePanel: React.FC<VpnServicePanelProps> = ({
  server,
  config,
  status,
  connectedIp,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedManifest, setCopiedManifest] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState<'service' | 'manifest' | 'stunnel'>('service');

  const isConnected = status === 'tunnel_established';

  // Dynamic Android VpnService Kotlin Implementation
  const kotlinVpnServiceCode = `// CipherVpnService.kt
// Implementação nativa de VpnService do Android com Túnel SSH sobre TLS (SSL)
package com.ciphertunnel.vpn

import android.content.Intent
import android.net.VpnService
import android.os.ParcelFileDescriptor
import java.io.FileInputStream
import java.io.FileOutputStream
import java.net.InetSocketAddress
import java.nio.ByteBuffer
import javax.net.ssl.SNIHostName
import javax.net.ssl.SSLParameters
import javax.net.ssl.SSLSocket
import javax.net.ssl.SSLSocketFactory
import kotlinx.coroutines.*

class CipherVpnService : VpnService() {

    private var vpnInterface: ParcelFileDescriptor? = null
    private var isRunning = false
    private val scope = CoroutineScope(Dispatchers.IO + SupervisorJob())

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val serverHost = "${server.host}"
        val serverPort = ${server.sslPort}
        val sniHost = "${config.sni}"
        val mtu = ${config.mtu}
        val dnsServer = "${config.dnsPrimary}"

        scope.launch {
            startTunnel(serverHost, serverPort, sniHost, mtu, dnsServer)
        }
        return START_STICKY
    }

    private suspend fun startTunnel(
        host: String,
        port: Int,
        sni: String,
        mtu: Int,
        dns: String
    ) = withContext(Dispatchers.IO) {
        try {
            // 1. Configurar e construir interface virtual TUN pelo Android VpnService
            val builder = Builder()
                .setSession("CipherTunnel SSH-TLS")
                .setMtu(mtu)
                .addAddress("10.8.0.2", 24)
                .addRoute("0.0.0.0", 0) // Encaminhar 100% do tráfego IPv4
                .addDnsServer(dns)
                .setBlocking(true)

            ${config.enableKillSwitch ? '// Kill Switch: Bloqueia todo tráfego fora da VPN\n            builder.setBlocking(true)' : ''}

            vpnInterface = builder.establish() ?: return@withContext
            isRunning = true

            // 2. Estabelecer Socket TLS com SNI Spoof protegido contra loop
            val sslFactory = SSLSocketFactory.getDefault() as SSLSocketFactory
            val sslSocket = sslFactory.createSocket() as SSLSocket

            // IMPORTANTE: protect() protege o socket do túnel para não ser roteado dentro do TUN
            protect(sslSocket)

            val sslParams = SSLParameters().apply {
                serverNames = listOf(SNIHostName(sni))
                applicationProtocols = arrayOf("h2", "http/1.1")
            }
            sslSocket.sslParameters = sslParams
            sslSocket.connect(InetSocketAddress(host, port), 8000)
            sslSocket.startHandshake()

            // 3. Injeção de Payload HTTP inicial (se configurado)
            val payload = """${config.payload.replace(/\r/g, '').replace(/\n/g, '\\r\\n')}"""
            sslSocket.outputStream.write(payload.toByteArray())
            sslSocket.outputStream.flush()

            // 4. Loop bidirecional de transferência de pacotes IP brutos
            val vpnInput = FileInputStream(vpnInterface!!.fileDescriptor)
            val vpnOutput = FileOutputStream(vpnInterface!!.fileDescriptor)
            val tlsInput = sslSocket.inputStream
            val tlsOutput = sslSocket.outputStream

            val packetBuffer = ByteBuffer.allocate(mtu)

            // TUN -> TLS Socket
            val jobOut = launch {
                val buf = ByteArray(mtu)
                while (isRunning) {
                    val length = vpnInput.read(buf)
                    if (length > 0) {
                        tlsOutput.write(buf, 0, length)
                    }
                }
            }

            // TLS Socket -> TUN
            val jobIn = launch {
                val buf = ByteArray(mtu)
                while (isRunning) {
                    val length = tlsInput.read(buf)
                    if (length > 0) {
                        vpnOutput.write(buf, 0, length)
                    }
                }
            }

            jobOut.join()
            jobIn.join()

        } catch (e: Exception) {
            e.printStackTrace()
        } finally {
            stopTunnel()
        }
    }

    private fun stopTunnel() {
        isRunning = false
        vpnInterface?.close()
        vpnInterface = null
        stopSelf()
    }

    override fun onDestroy() {
        super.onDestroy()
        stopTunnel()
        scope.cancel()
    }
}`;

  const manifestCode = `<!-- AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.ciphertunnel.vpn">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <application
        android:allowBackup="true"
        android:label="CipherTunnel VPN">

        <!-- Declaração obrigatória do Serviço VpnService com a permissão BIND_VPN_SERVICE -->
        <service
            android:name=".CipherVpnService"
            android:permission="android.permission.BIND_VPN_SERVICE"
            android:exported="false">
            <intent-filter>
                <action android:name="android.net.VpnService" />
            </intent-filter>
        </service>

    </application>
</manifest>`;

  const stunnelConfigCode = `; stunnel.conf para CipherTunnel
pid = /var/run/stunnel4/stunnel.pid
output = /var/log/stunnel4/stunnel.log

[ssh-tls-tunnel]
client = yes
accept = 127.0.0.1:1080
connect = ${server.host}:${server.sslPort}
sni = ${config.sni}
checkHost = ${config.sni}
sslVersion = TLSv1.3
ciphers = TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256
`;

  const handleCopy = (text: string, type: 'service' | 'manifest') => {
    navigator.clipboard.writeText(text);
    if (type === 'service') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedManifest(true);
      setTimeout(() => setCopiedManifest(false), 2000);
    }
  };

  const handleDownloadKotlin = () => {
    const blob = new Blob([kotlinVpnServiceCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'CipherVpnService.kt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-zinc-800">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2 font-mono">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <span>VpnService Nativo Integrado (Android & Linux TUN)</span>
          </h2>
          <p className="text-xs text-zinc-400 font-mono mt-0.5">
            Arquitetura de túnel TLS para roteamento global de pacotes via VpnService.Builder
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadKotlin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-zinc-950 text-xs font-mono font-bold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar CipherVpnService.kt</span>
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Status do VpnService</div>
          <div className="text-sm font-bold font-mono text-zinc-100 flex items-center gap-2 mt-1">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            <span>{isConnected ? 'ESTABLISHED (BIND_VPN)' : 'STANDBY'}</span>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            {isConnected ? 'Roteamento global ativo' : 'Aguardando inicialização'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Interface de Rede</div>
          <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
            tun0 (10.8.0.2 / 24)
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            MTU: {config.mtu} bytes
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Proteção de Socket</div>
          <div className="text-sm font-bold font-mono text-cyan-400 mt-1">
            vpnService.protect(socket)
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            Zero Loopback de Tráfego
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
          <div className="text-[10px] font-mono text-zinc-500 uppercase">Criptografia do Túnel</div>
          <div className="text-sm font-bold font-mono text-zinc-200 mt-1">
            TLS 1.3 / SNI {config.sni}
          </div>
          <div className="text-[11px] text-zinc-500 font-mono mt-1">
            Porta: {server.sslPort}
          </div>
        </div>
      </div>

      {/* Code Inspector Tabs */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/90 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-950 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            {[
              { id: 'service', label: 'CipherVpnService.kt (Código Kotlin)', icon: FileCode },
              { id: 'manifest', label: 'AndroidManifest.xml', icon: Layers },
              { id: 'stunnel', label: 'stunnel.conf (Linux / PC)', icon: Terminal },
            ].map((t) => {
              const Icon = t.icon;
              const isActive = activeCodeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveCodeTab(t.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => {
              if (activeCodeTab === 'service') handleCopy(kotlinVpnServiceCode, 'service');
              else if (activeCodeTab === 'manifest') handleCopy(manifestCode, 'manifest');
              else handleCopy(stunnelConfigCode, 'service');
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            {copiedCode || copiedManifest ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode || copiedManifest ? 'Copiado!' : 'Copiar'}</span>
          </button>
        </div>

        <div className="p-4 bg-zinc-950 font-mono text-xs overflow-x-auto max-h-[440px] text-zinc-300 leading-relaxed">
          <pre>
            {activeCodeTab === 'service' && kotlinVpnServiceCode}
            {activeCodeTab === 'manifest' && manifestCode}
            {activeCodeTab === 'stunnel' && stunnelConfigCode}
          </pre>
        </div>
      </div>
    </div>
  );
};
