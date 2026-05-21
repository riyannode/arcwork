import { NextRequest, NextResponse } from 'next/server';
import { API_KEY_SCOPES, requireApiKey } from '@/lib/a2a/auth';
import { insertBridgeEvent, listBridgeEvents, type BridgeEventInput } from '@/lib/agent-bridge/store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ROLES = new Set(['external_runtime', 'registered_agent', 'verification', 'executor', 'oracle', 'momentum_resolver', 'scalping_resolver', 'evaluator']);
const TYPES = new Set(['session_started', 'bridge_event', 'work_proof', 'receipt_reference', 'market_snapshot', 'resolver_output', 'evaluation', 'execution_intent']);

function bad(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...(extra ?? {}) }, { status });
}

export async function POST(req: NextRequest) {
  const auth = await requireApiKey(req, API_KEY_SCOPES.AGENT_BRIDGE_WRITE);
  if (auth.error) return auth.error;

  let body: Partial<BridgeEventInput>;
  try {
    body = await req.json();
  } catch {
    return bad('invalid_json');
  }

  const sessionId = String(body.sessionId ?? '').trim();
  const agentId = String(body.agentId ?? auth.key.agentId).trim();
  const role = String(body.role ?? '');
  const type = String(body.type ?? '');

  if (!sessionId) return bad('missing_sessionId');
  if (!agentId) return bad('missing_agentId');
  if (!ROLES.has(role)) return bad('invalid_role');
  if (!TYPES.has(type)) return bad('invalid_type');
  if (body.payload === null || typeof body.payload !== 'object' || Array.isArray(body.payload)) return bad('invalid_payload');

  // API key authenticates the bot; agentId must match the key owner unless future admin scopes are added.
  if (agentId !== auth.key.agentId) return bad('agent_id_mismatch', 403);

  try {
    const event = await insertBridgeEvent({
      sessionId,
      runtimeId: typeof body.runtimeId === 'string' ? body.runtimeId.trim() : null,
      agentId,
      role: role as BridgeEventInput['role'],
      type: type as BridgeEventInput['type'],
      payload: body.payload as Record<string, unknown>,
      payloadHash: typeof body.payloadHash === 'string' ? body.payloadHash : undefined,
      metadata: body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata as Record<string, unknown> : {},
      source: typeof body.source === 'string' ? body.source : 'external-runtime',
      dryRun: body.dryRun !== false,
    });
    return NextResponse.json({ ok: true, eventId: event.id });
  } catch (err) {
    return bad('insert_failed', 500, { message: err instanceof Error ? err.message : 'unknown' });
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const limit = Number(searchParams.get('limit') ?? '50');
  try {
    const events = await listBridgeEvents({
      sessionId: searchParams.get('sessionId'),
      role: searchParams.get('role'),
      limit: Number.isFinite(limit) ? limit : 50,
    });
    return NextResponse.json({ ok: true, events });
  } catch (err) {
    return bad('query_failed', 500, { message: err instanceof Error ? err.message : 'unknown' });
  }
}
