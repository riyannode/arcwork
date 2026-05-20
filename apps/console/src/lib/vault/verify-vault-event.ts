/**
 * On-chain event verification for ArcVault lifecycle actions.
 * Pattern: contract tx → receipt → verify event → return verified data.
 *
 * Every lifecycle state change MUST go through this verifier before
 * updating Supabase. No DB-only state mutations for critical states.
 */
import { createPublicClient, decodeEventLog, getAddress, http } from 'viem';
import { ARC_VAULT_ADDRESS } from './constants';
import arcVaultAbiJson from './abi/arc-vault.json';

const ARC_RPC = process.env.ARC_RPC_URL || 'https://rpc.drpc.testnet.arc.network';
const arcVaultAbi = arcVaultAbiJson as Parameters<typeof decodeEventLog>[0]['abi'];

export type VerifyResult<T = Record<string, unknown>> =
  | { ok: true; args: T }
  | { ok: false; error: string };

/**
 * Generic event verifier. Checks:
 * 1. tx receipt exists and status === 'success'
 * 2. log.address === ARC_VAULT_ADDRESS
 * 3. event name matches
 * 4. custom validator passes (jobId, milestoneId, caller checks)
 */
export async function verifyVaultEvent<T>(opts: {
  txHash: string;
  eventName: string;
  validate: (args: Record<string, unknown>) => { ok: boolean; error?: string; data?: T };
}): Promise<VerifyResult<T>> {
  const { txHash, eventName, validate } = opts;

  if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { ok: false, error: 'valid tx hash required' };
  }

  const client = createPublicClient({ transport: http(ARC_RPC) });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
  } catch {
    return { ok: false, error: 'tx receipt not found (may still be pending)' };
  }

  if (!receipt) return { ok: false, error: 'tx receipt not found' };
  if (receipt.status !== 'success') return { ok: false, error: 'tx reverted on-chain' };

  // Scan logs for matching event from ARC_VAULT_ADDRESS
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ARC_VAULT_ADDRESS.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: arcVaultAbi,
        data: log.data,
        topics: log.topics,
      }) as unknown as { eventName: string; args: Record<string, unknown> };

      if (decoded.eventName !== eventName) continue;

      const result = validate(decoded.args);
      if (result.ok) {
        return { ok: true, args: result.data as T };
      }
      // If validation failed but event name matched, return the specific error
      return { ok: false, error: result.error || `${eventName} event args validation failed` };
    } catch {
      // Not our event, skip
    }
  }

  return { ok: false, error: `${eventName} event not found in tx receipt from ArcVault` };
}

// ─── Typed verifiers for each lifecycle action ───────────────────────────────

export type AcceptJobArgs = { jobId: string; jobber: string; bondAmount: bigint };

export function verifyAcceptJob(txHash: string, expectedJobId: string, expectedJobber: string) {
  return verifyVaultEvent<AcceptJobArgs>({
    txHash,
    eventName: 'JobAccepted',
    validate: (args) => {
      const jobId = String(args.jobId);
      const jobber = getAddress(args.jobber as string);
      if (jobId !== expectedJobId) {
        return { ok: false, error: `JobAccepted jobId ${jobId} does not match expected ${expectedJobId}` };
      }
      if (jobber.toLowerCase() !== expectedJobber.toLowerCase()) {
        return { ok: false, error: `JobAccepted jobber ${jobber} does not match wallet ${expectedJobber}` };
      }
      return { ok: true, data: { jobId, jobber, bondAmount: args.bondAmount as bigint } };
    },
  });
}

export type SubmitMilestoneArgs = { jobId: string; milestoneId: string; uri: string };

export function verifySubmitMilestone(txHash: string, expectedJobId: string, expectedMid: number) {
  return verifyVaultEvent<SubmitMilestoneArgs>({
    txHash,
    eventName: 'MilestoneSubmitted',
    validate: (args) => {
      const jobId = String(args.jobId);
      const mid = Number(args.milestoneId);
      if (jobId !== expectedJobId) {
        return { ok: false, error: `MilestoneSubmitted jobId mismatch: ${jobId} vs ${expectedJobId}` };
      }
      if (mid !== expectedMid) {
        return { ok: false, error: `MilestoneSubmitted milestoneId mismatch: ${mid} vs ${expectedMid}` };
      }
      return { ok: true, data: { jobId, milestoneId: String(mid), uri: args.uri as string } };
    },
  });
}

export type ApproveMilestoneArgs = { jobId: string; milestoneId: string; payout: bigint; fee: bigint };

export function verifyApproveMilestone(txHash: string, expectedJobId: string, expectedMid: number) {
  return verifyVaultEvent<ApproveMilestoneArgs>({
    txHash,
    eventName: 'MilestoneApproved',
    validate: (args) => {
      const jobId = String(args.jobId);
      const mid = Number(args.milestoneId);
      if (jobId !== expectedJobId) {
        return { ok: false, error: `MilestoneApproved jobId mismatch: ${jobId} vs ${expectedJobId}` };
      }
      if (mid !== expectedMid) {
        return { ok: false, error: `MilestoneApproved milestoneId mismatch: ${mid} vs ${expectedMid}` };
      }
      return { ok: true, data: { jobId, milestoneId: String(mid), payout: args.payout as bigint, fee: args.fee as bigint } };
    },
  });
}

export type RejectMilestoneArgs = { jobId: string; milestoneId: string; revisions: number };

/**
 * Verify reject: accepts EITHER MilestoneRejected OR DisputeOpened
 * (3rd rejection auto-escalates to dispute on-chain)
 */
export function verifyRejectMilestone(txHash: string, expectedJobId: string, expectedMid: number) {
  return verifyRejectOrDispute(txHash, expectedJobId, expectedMid);
}

export type RejectOrDisputeResult =
  | { type: 'rejected'; jobId: string; milestoneId: string; revisions: number }
  | { type: 'disputed'; jobId: string; milestoneId: string; initiator: string; tier: number };

async function verifyRejectOrDispute(
  txHash: string,
  expectedJobId: string,
  expectedMid: number,
): Promise<VerifyResult<RejectOrDisputeResult>> {
  if (!txHash || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return { ok: false, error: 'valid tx hash required' };
  }

  const client = createPublicClient({ transport: http(ARC_RPC) });

  let receipt;
  try {
    receipt = await client.getTransactionReceipt({ hash: txHash as `0x${string}` });
  } catch {
    return { ok: false, error: 'tx receipt not found' };
  }
  if (!receipt) return { ok: false, error: 'tx receipt not found' };
  if (receipt.status !== 'success') return { ok: false, error: 'tx reverted on-chain' };

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== ARC_VAULT_ADDRESS.toLowerCase()) continue;
    try {
      const decoded = decodeEventLog({
        abi: arcVaultAbi,
        data: log.data,
        topics: log.topics,
      }) as unknown as { eventName: string; args: Record<string, unknown> };

      if (decoded.eventName === 'MilestoneRejected') {
        const jobId = String(decoded.args.jobId);
        const mid = Number(decoded.args.milestoneId);
        if (jobId !== expectedJobId || mid !== expectedMid) continue;
        return {
          ok: true,
          args: { type: 'rejected', jobId, milestoneId: String(mid), revisions: Number(decoded.args.revisions) },
        };
      }

      if (decoded.eventName === 'DisputeOpened') {
        const jobId = String(decoded.args.jobId);
        const mid = Number(decoded.args.milestoneId);
        if (jobId !== expectedJobId || mid !== expectedMid) continue;
        return {
          ok: true,
          args: {
            type: 'disputed',
            jobId,
            milestoneId: String(mid),
            initiator: decoded.args.initiator as string,
            tier: Number(decoded.args.tier),
          },
        };
      }
    } catch {
      // skip
    }
  }

  return { ok: false, error: 'Neither MilestoneRejected nor DisputeOpened found in tx receipt' };
}

export type OpenDisputeArgs = { jobId: string; milestoneId: string; initiator: string; tier: number };

export function verifyOpenDispute(txHash: string, expectedJobId: string, expectedMid: number, expectedInitiator: string) {
  return verifyVaultEvent<OpenDisputeArgs>({
    txHash,
    eventName: 'DisputeOpened',
    validate: (args) => {
      const jobId = String(args.jobId);
      const mid = Number(args.milestoneId);
      const initiator = getAddress(args.initiator as string);
      if (jobId !== expectedJobId) {
        return { ok: false, error: `DisputeOpened jobId mismatch: ${jobId} vs ${expectedJobId}` };
      }
      if (mid !== expectedMid) {
        return { ok: false, error: `DisputeOpened milestoneId mismatch: ${mid} vs ${expectedMid}` };
      }
      if (initiator.toLowerCase() !== expectedInitiator.toLowerCase()) {
        return { ok: false, error: `DisputeOpened initiator mismatch: ${initiator} vs ${expectedInitiator}` };
      }
      return { ok: true, data: { jobId, milestoneId: String(mid), initiator, tier: Number(args.tier) } };
    },
  });
}

export type ResolveDisputeArgs = { jobId: string; milestoneId: string; outcome: number; resolver: string };

export function verifyResolveDispute(txHash: string, expectedJobId: string, expectedMid: number) {
  return verifyVaultEvent<ResolveDisputeArgs>({
    txHash,
    eventName: 'DisputeResolved',
    validate: (args) => {
      const jobId = String(args.jobId);
      const mid = Number(args.milestoneId);
      if (jobId !== expectedJobId) {
        return { ok: false, error: `DisputeResolved jobId mismatch: ${jobId} vs ${expectedJobId}` };
      }
      if (mid !== expectedMid) {
        return { ok: false, error: `DisputeResolved milestoneId mismatch: ${mid} vs ${expectedMid}` };
      }
      return {
        ok: true,
        data: { jobId, milestoneId: String(mid), outcome: Number(args.outcome), resolver: args.resolver as string },
      };
    },
  });
}

export type AutoReleaseArgs = { jobId: string; milestoneId: string };

export function verifyAutoRelease(txHash: string, expectedJobId: string, expectedMid: number) {
  return verifyVaultEvent<AutoReleaseArgs>({
    txHash,
    eventName: 'MilestoneAutoReleased',
    validate: (args) => {
      const jobId = String(args.jobId);
      const mid = Number(args.milestoneId);
      if (jobId !== expectedJobId) {
        return { ok: false, error: `MilestoneAutoReleased jobId mismatch: ${jobId} vs ${expectedJobId}` };
      }
      if (mid !== expectedMid) {
        return { ok: false, error: `MilestoneAutoReleased milestoneId mismatch: ${mid} vs ${expectedMid}` };
      }
      return { ok: true, data: { jobId, milestoneId: String(mid) } };
    },
  });
}
