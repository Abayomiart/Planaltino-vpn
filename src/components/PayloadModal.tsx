import React, { useState } from 'react';
import { Sparkles, Copy, Check, RotateCcw } from 'lucide-react';
import { generatePayloadString, PayloadOptions } from '../utils/network';

interface PayloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPayload: (payload: string) => void;
  currentPayload: string;
}

export const PayloadModal: React.FC<PayloadModalProps> = ({
  isOpen,
  onClose,
  onApplyPayload,
  currentPayload,
}) => {
  const [opts, setOpts] = useState<PayloadOptions>({
    method: 'CONNECT',
    urlHost: 'whatsapp.net',
    injectionType: 'normal',
    keepAlive: true,
    userAgent: true,
    onlineHost: true,
    forwardHost: false,
    reverseProxy: false,
  });

  const [copied, setCopied] = useState(false);
  const generated = generatePayloadString(opts);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generated);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    onApplyPayload(generated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl space-y-4">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 font-mono">
                Gerador de Payload HTTP / TLS
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono">
                Padrão HTTP Injector / Eproxy para bypass de Proxy e DPI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 font-mono text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Options Form */}
        <div className="space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Method */}
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Método de Requisição</label>
              <select
                value={opts.method}
                onChange={(e) => setOpts({ ...opts, method: e.target.value as any })}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono cursor-pointer"
              >
                <option value="CONNECT">CONNECT (Padrão SSL/Tunnel)</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
                <option value="PUT">PUT</option>
                <option value="OPTIONS">OPTIONS</option>
              </select>
            </div>

            {/* URL / Host */}
            <div>
              <label className="text-xs font-mono text-zinc-400 block mb-1">Host / Bug URL</label>
              <input
                type="text"
                placeholder="Ex: whatsapp.net"
                value={opts.urlHost}
                onChange={(e) => setOpts({ ...opts, urlHost: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Injection Type */}
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1.5">Tipo de Injeção</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'normal', label: 'Normal' },
                { id: 'front_inject', label: 'Front Inject' },
                { id: 'back_inject', label: 'Back Inject' },
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setOpts({ ...opts, injectionType: type.id as any })}
                  className={`py-1.5 px-2 rounded-lg text-xs font-mono border text-center transition-colors cursor-pointer ${
                    opts.injectionType === type.id
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Header Checkboxes */}
          <div>
            <label className="text-xs font-mono text-zinc-400 block mb-1.5">Cabeçalhos Extras</label>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-zinc-300">
              <label className="flex items-center gap-2 p-2 rounded bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={opts.keepAlive}
                  onChange={(e) => setOpts({ ...opts, keepAlive: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>Keep-Alive</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={opts.onlineHost}
                  onChange={(e) => setOpts({ ...opts, onlineHost: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>Online Host</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={opts.forwardHost}
                  onChange={(e) => setOpts({ ...opts, forwardHost: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>Forward Host</span>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-zinc-950/60 border border-zinc-800/80 cursor-pointer hover:border-zinc-700">
                <input
                  type="checkbox"
                  checked={opts.userAgent}
                  onChange={(e) => setOpts({ ...opts, userAgent: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-0"
                />
                <span>User-Agent Mobile</span>
              </label>
            </div>
          </div>

          {/* Result Payload Preview */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-1">
              <span>Payload Gerado:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado!' : 'Copiar'}</span>
              </button>
            </div>
            <textarea
              readOnly
              rows={3}
              value={generated}
              className="w-full p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-emerald-400 select-all focus:outline-none"
            />
          </div>

        </div>

        {/* Modal Actions */}
        <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-mono text-zinc-300 cursor-pointer"
          >
            Fechar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-mono font-bold text-zinc-950 cursor-pointer shadow-md shadow-amber-950/40"
          >
            Aplicar ao Túnel
          </button>
        </div>

      </div>
    </div>
  );
};
