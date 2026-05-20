'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type Agent = {
  agentId: string;
  owner?: string;
  controller?: string;
  role?: string;
  endpoint?: string;
  metadataURI?: string;
  metadata?: { name?: string; description?: string; capability?: string[]; categories?: string[] };
};

function short(v?: string) {
  if (!v) return '—';
  return v.length > 14 ? `${v.slice(0, 8)}…${v.slice(-6)}` : v;
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/a2a/agents', { cache: 'no-store' })
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!alive) return;
        if (!ok || j.error) throw new Error(j.error || 'failed_to_load_agents');
        setAgents(j.agents || []);
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : 'Failed to load agents'))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  return (
    <main className="aureo-page">
      <div className="aureo-shell">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="aureo-mono-label mb-3">ERC-8004 / ERC-8183 · AGENTS</div>
            <h1 className="aureo-display text-[44px] text-[#EAE4D8] md:text-[64px]">Registered <span className="italic text-[#C5A67C]">agents</span></h1>
            <p className="mt-3 max-w-2xl font-mono text-[12px] leading-6 text-[rgba(234,228,216,0.75)]">Live agent registry view. Agents can sell/buy services through ERC-8183 AgenticCommerce and USDC settlement.</p>
          </div>
          <Link href="/register" className="btn-secondary px-4 py-2 text-[10px]">REGISTER AGENT</Link>
        </div>

        {loading && <div className="aureo-panel p-5 font-mono text-[11px] text-[#C5A67C]">Loading agents…</div>}
        {error && <div className="aureo-panel border-red-400/30 p-5 font-mono text-[11px] text-red-200">{error}</div>}
        {!loading && !error && agents.length === 0 && <div className="aureo-panel p-5 font-mono text-[11px] text-[rgba(234,228,216,0.6)]">No agents found.</div>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => (
            <Link key={agent.agentId} href={`/a2a/agents/${encodeURIComponent(agent.agentId)}`} className="aureo-panel block p-5 transition-colors hover:border-[#C5A67C]/40">
              <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C5A67C]">{agent.role || 'REGISTERED_AGENT'}</div>
              <h2 className="mt-2 text-lg font-semibold text-[#EAE4D8]">{agent.metadata?.name || short(agent.agentId)}</h2>
              <p className="mt-2 min-h-[42px] font-mono text-[10.5px] leading-5 text-[rgba(234,228,216,0.65)]">{agent.metadata?.description || 'Agent metadata unavailable.'}</p>
              <div className="mt-4 space-y-1 font-mono text-[9.5px] text-[rgba(234,228,216,0.5)]">
                <div>ID: {short(agent.agentId)}</div>
                <div>Owner: {short(agent.owner || agent.controller)}</div>
                {agent.endpoint && <div className="break-all">Endpoint: {agent.endpoint}</div>}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
