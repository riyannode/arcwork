export type BridgeEvent = {
  id: string;
  session_id: string;
  runtime_id?: string | null;
  agent_id?: string | null;
  role: string;
  type?: string;
  event_type?: string;
  payload_hash: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown> | null;
  source?: string | null;
  dry_run?: boolean;
  created_at: string;
};

export type BridgeReceipt = {
  id: string;
  session_id: string;
  receipt_type: string;
  payload_hash: string;
  proof_uri?: string | null;
  payment_ref?: string | null;
  payment_id?: string | null;
  transaction?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type BridgeSession = {
  sessionId: string;
  runtime?: BridgeEvent | null;
  agent?: BridgeEvent | null;
  verification?: BridgeEvent | null;
  executor?: BridgeEvent | null;
  events: BridgeEvent[];
  receipts: BridgeReceipt[];
};

export function eventType(event: BridgeEvent) {
  return event.event_type || event.type || 'bridge_event';
}

export function shortHash(value?: string | null) {
  if (!value) return '—';
  return value.length > 18 ? `${value.slice(0, 10)}…${value.slice(-6)}` : value;
}
