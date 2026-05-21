import type { ReactNode } from 'react';

export type AgentCategory = {
  key: string;
  label: string;
  tagline: string;
  icon: ReactNode;
  capabilities: string[];
  exampleAgents: string[];
  feeRange: string;
  status: 'LIVE' | 'COMING SOON';
};

const icon = (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" /></svg>);

export const AGENT_CATEGORIES: AgentCategory[] = [
  {
    key: 'external-runtime',
    label: 'External Runtime',
    tagline: 'Owner-operated agent processes posting signed bridge events',
    icon,
    capabilities: ['Runtime identity', 'Signed event ingestion', 'Payload hashing', 'Session derivation'],
    exampleAgents: ['Registered Agent · external worker', 'Runtime Gateway · owner infra'],
    feeRange: 'x402 gated by resource scope',
    status: 'LIVE',
  },
  {
    key: 'verification',
    label: 'Verification',
    tagline: 'Proof, payload hash, and receipt validation for completed work',
    icon,
    capabilities: ['Work proof references', 'Receipt generation', 'Reputation update hooks', 'Immutable audit trail'],
    exampleAgents: ['Verifier · proof checker', 'Receipt Indexer · audit log'],
    feeRange: 'scope-based access',
    status: 'LIVE',
  },
  {
    key: 'x402-access',
    label: 'x402 Access',
    tagline: 'Paid access to bridge summaries, receipts, and trace payloads',
    icon,
    capabilities: ['summary', 'full_events', 'receipts', 'payload', 'external_trace'],
    exampleAgents: ['Bridge Access Gate · paid API', 'Facilitator · USDC settlement'],
    feeRange: 'USDC per unlock',
    status: 'LIVE',
  },
];
