import type { BridgeSession } from './types';
import { eventType, shortHash } from './types';

export function AgentBridgeSessionPanel({ session, error }: { session: BridgeSession | null; error?: string | null }) {
  if (error) {
    return <div className="rounded-sm border border-red-400/25 bg-red-950/20 p-4 text-sm text-red-200">Bridge session endpoint failed: {error}</div>;
  }
  if (!session) {
    return (
      <div className="rounded-sm border border-dashed border-[#C5A67C]/30 bg-[#C5A67C]/5 p-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#C5A67C]">Empty Bridge</div>
        <p className="mt-2 text-sm text-[#EAE4D8]/70">No external runtime events have been ingested yet. POST to <span className="font-mono text-[#F5F0E5]">/api/agent-bridge/events</span> to create the first session.</p>
      </div>
    );
  }

  const latest = session.events.at(-1);
  return (
    <div className="rounded-sm border border-white/10 bg-black/25 p-4">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 md:flex-row md:items-end">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#C5A67C]">Latest Bridge Session</div>
          <div className="mt-1 font-mono text-xl font-bold text-[#F5F0E5]">{shortHash(session.sessionId)}</div>
        </div>
        <div className="md:ml-auto grid grid-cols-3 gap-2 text-center font-mono text-[11px]">
          <div className="rounded-sm border border-white/10 px-3 py-2"><div className="text-[#C5A67C]">{session.events.length}</div><div className="text-[#EAE4D8]/45">events</div></div>
          <div className="rounded-sm border border-white/10 px-3 py-2"><div className="text-emerald-300">{session.receipts.length}</div><div className="text-[#EAE4D8]/45">receipts</div></div>
          <div className="rounded-sm border border-white/10 px-3 py-2"><div className="text-[#D7C7AA]">x402</div><div className="text-[#EAE4D8]/45">access</div></div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.25fr]">
        <div className="rounded-sm border border-white/10 bg-white/[0.03] p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#EAE4D8]/45">Runtime / Agent Identity</div>
          <div className="mt-3 space-y-2 text-sm text-[#EAE4D8]/70">
            <div>runtime: <span className="font-mono text-[#F5F0E5]">{latest?.source || session.runtime?.source || 'external-runtime'}</span></div>
            <div>agent: <span className="font-mono text-[#F5F0E5]">{latest?.agent_id || session.agent?.agent_id || 'registered-agent'}</span></div>
            <div>latest role: <span className="font-mono text-[#C5A67C]">{latest?.role || '—'}</span></div>
            <div>latest hash: <span className="font-mono text-[#C5A67C]">{shortHash(latest?.payload_hash)}</span></div>
          </div>
        </div>
        <div className="rounded-sm border border-white/10 bg-white/[0.03] p-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#EAE4D8]/45">Event Timeline</div>
          <div className="mt-3 max-h-72 space-y-2 overflow-auto pr-1">
            {session.events.map((event) => (
              <div key={event.id} className="rounded-sm border border-white/10 bg-black/20 p-2 text-xs">
                <div className="flex flex-wrap items-center gap-2 font-mono">
                  <span className="text-[#F5F0E5]">{event.role}</span>
                  <span className="text-[#C5A67C]">{eventType(event)}</span>
                  <span className="text-[#EAE4D8]/35">{new Date(event.created_at).toLocaleTimeString()}</span>
                </div>
                <div className="mt-1 text-[#EAE4D8]/50">hash {shortHash(event.payload_hash)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
