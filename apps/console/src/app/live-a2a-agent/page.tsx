'use client';

import { useEffect, useState } from 'react';
import { AgentBridgeFlowDiagram, AgentBridgeSessionPanel, BridgeReceiptsPanel, type BridgeSession } from '@/components/agent-bridge';

function Chip({ children }: { children: React.ReactNode }) {
  return <span className="rounded-sm border border-[#C5A67C]/35 bg-[#C5A67C]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-[#C5A67C]">{children}</span>;
}

type LatestResponse = { ok: boolean; session: BridgeSession | null; error?: string; message?: string };

export default function LiveA2AAgentPage() {
  const [session, setSession] = useState<BridgeSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      try {
        const res = await fetch('/api/agent-bridge/sessions/latest', { cache: 'no-store' });
        const data = (await res.json()) as LatestResponse;
        if (!alive) return;
        if (!res.ok || !data.ok) {
          setError(data.message || data.error || 'query_failed');
          return;
        }
        setSession(data.session);
        setError(null);
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'network_error');
      }
    }
    load();
    const t = setInterval(load, 10_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#050505] px-4 py-5 text-[#EAE4D8] selection:bg-[#C5A67C]/20 sm:px-6 lg:px-8">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(197,166,124,0.14),transparent_30%),radial-gradient(circle_at_82%_8%,rgba(255,255,255,0.055),transparent_26%)]" />
      <div className="relative mx-auto flex max-w-[1480px] flex-col gap-6 pt-8 pb-12 sm:pt-12">
        <header className="overflow-hidden rounded-sm border border-[#C5A67C]/15 bg-[#0A0A0A]/90">
          <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 lg:flex-row lg:items-center">
            <div className="min-w-0">
              <div className="font-mono text-[11px] uppercase tracking-[0.34em] text-[#C5A67C]">ARCLAYER · EXTERNAL AGENT BRIDGE</div>
              <h1 className="mt-2 text-3xl font-black uppercase tracking-[0.16em] text-[#F5F0E5] sm:text-4xl">Bridge Session Viewer</h1>
              <p className="mt-2 max-w-3xl text-sm text-[#EAE4D8]/70">ArcLayer does not host agent runtimes. External agents post bridge events, proofs, and receipts; ArcLayer provides registry, jobs, x402 access, and reputation rails.</p>
            </div>
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <Chip>Bridge Event</Chip>
              <Chip>Work Proof</Chip>
              <Chip>x402 Access</Chip>
              <Chip>Reputation</Chip>
            </div>
          </div>
          <div className="grid gap-px bg-white/10 md:grid-cols-4">
            <div className="bg-black/25 px-4 py-3"><div className="font-mono text-[10px] uppercase text-[#EAE4D8]/45">Events</div><div className="font-mono text-lg text-[#C5A67C]">{session?.events.length ?? 0}</div></div>
            <div className="bg-black/25 px-4 py-3"><div className="font-mono text-[10px] uppercase text-[#EAE4D8]/45">Receipts</div><div className="font-mono text-lg text-emerald-300">{session?.receipts.length ?? 0}</div></div>
            <div className="bg-black/25 px-4 py-3"><div className="font-mono text-[10px] uppercase text-[#EAE4D8]/45">Runtime</div><div className="font-mono text-lg text-[#D7C7AA]">External</div></div>
            <div className="bg-black/25 px-4 py-3"><div className="font-mono text-[10px] uppercase text-[#EAE4D8]/45">Access</div><div className="font-mono text-lg text-[#C5A67C]">/api/x402/bridge-access</div></div>
          </div>
        </header>

        <AgentBridgeSessionPanel session={session} error={error} />
        <AgentBridgeFlowDiagram session={session} />
        <BridgeReceiptsPanel session={session} />
      </div>
    </main>
  );
}
