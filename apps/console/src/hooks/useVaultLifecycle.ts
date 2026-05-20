'use client';

/**
 * useVaultLifecycle — on-chain-first lifecycle actions for Settlement Vault jobs.
 *
 * Pattern for every action:
 *   1. (write) Send tx to ArcVault
 *   2. (read)  Wait for receipt
 *   3. (server) POST to API with txHash; backend verifies the event and updates Supabase
 *
 * No DB-only state mutations. The chain is the source of truth.
 */

import { useCallback, useState } from 'react';
import { type Abi, type Address, parseUnits } from 'viem';
import { readContract, waitForTransactionReceipt } from '@wagmi/core';
import { useArcWrite } from './useArcWrite';
import { useArcWallet } from './useArcWallet';
import { useAuthFetch } from './useAuthFetch';
import { config } from '@/lib/wagmi';
import { ARC_VAULT_ADDRESS, USDC_DECIMALS } from '@/lib/vault/constants';
import { USDC_ADDRESS } from '@/lib/x402/constants';
import arcVaultAbiJson from '@/lib/vault/abi/arc-vault.json';
import erc20AbiJson from '@/lib/vault/abi/erc20.json';

const arcVaultAbi = arcVaultAbiJson as Abi;
const erc20Abi = erc20AbiJson as Abi;

export type LifecycleStep =
  | 'idle'
  | 'allowance'
  | 'approving'
  | 'sending'
  | 'waiting'
  | 'indexing'
  | 'done'
  | 'error';

export type LifecycleState = {
  step: LifecycleStep;
  message: string;
  txHash?: `0x${string}`;
  errorReason?: string;
};

const INITIAL: LifecycleState = { step: 'idle', message: 'Ready.' };

export function useVaultLifecycle() {
  const { address, isConnected } = useArcWallet();
  const { writeContractAsync, isPending } = useArcWrite();
  const { authFetch } = useAuthFetch();
  const [state, setState] = useState<LifecycleState>(INITIAL);

  // ─── Internal helpers ────────────────────────────────────────────────

  const ensureUsdcAllowance = useCallback(async (amountUnits: bigint, owner: Address) => {
    const current = await readContract(config, {
      address: USDC_ADDRESS as Address,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, ARC_VAULT_ADDRESS as Address],
    } as unknown as Parameters<typeof readContract>[1]) as bigint;

    if (current >= amountUnits) return undefined;

    setState({ step: 'approving', message: 'Approving USDC for bond…' });
    const tx = await writeContractAsync({
      address: USDC_ADDRESS as Address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [ARC_VAULT_ADDRESS as Address, amountUnits],
    });
    await waitForTransactionReceipt(config, { hash: tx });
    return tx;
  }, [writeContractAsync]);

  // ─── Public actions ──────────────────────────────────────────────────

  /**
   * Jobber accepts an open job. Bond is debited from jobber's USDC if BondConfig
   * requires one. We pass completedJobs/ratingX100 as fetched from backend
   * reputation (fallback to 0/0 until oracle is wired).
   */
  const acceptJob = useCallback(async (input: {
    onChainJobId: string;
    dbJobId: string;
    estimatedBondUsdc?: string; // optional pre-approval amount
    reputation?: { completedJobs: number; ratingX100: number };
  }) => {
    if (!isConnected || !address) throw new Error('Wallet not connected');
    setState({ step: 'sending', message: 'Accepting job…' });

    try {
      // Pre-approve USDC for bond if frontend has an estimate. The contract
      // calls bondConfig.calculateBond() at execution time; this just avoids
      // a second prompt for common cases.
      if (input.estimatedBondUsdc && Number(input.estimatedBondUsdc) > 0) {
        const bondUnits = parseUnits(input.estimatedBondUsdc, USDC_DECIMALS);
        await ensureUsdcAllowance(bondUnits, address as Address);
      }

      // Backend reputation values — V1 fallback to (0, 0) when oracle isn't wired.
      // The agent must NOT self-report these.
      const completedJobs = BigInt(input.reputation?.completedJobs ?? 0);
      const ratingX100 = BigInt(input.reputation?.ratingX100 ?? 0);

      setState({ step: 'sending', message: 'Sending acceptJob tx…' });
      const txHash = await writeContractAsync({
        address: ARC_VAULT_ADDRESS as Address,
        abi: arcVaultAbi,
        functionName: 'acceptJob',
        args: [BigInt(input.onChainJobId), completedJobs, ratingX100],
      });

      setState({ step: 'waiting', message: 'Waiting for confirmation…', txHash });
      await waitForTransactionReceipt(config, { hash: txHash });

      setState({ step: 'indexing', message: 'Verifying on-chain event…', txHash });
      const res = await authFetch(`/api/vault/jobs/${input.dbJobId}/accept`, {
        method: 'POST',
        body: JSON.stringify({ txHash }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Accept failed: HTTP ${res.status}`);

      setState({ step: 'done', message: 'Job accepted ✓', txHash });
      return { txHash, ...json };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState({ step: 'error', message: msg, errorReason: msg });
      throw err;
    }
  }, [address, isConnected, writeContractAsync, authFetch, ensureUsdcAllowance]);

  /** Jobber submits milestone deliverable */
  const submitMilestone = useCallback(async (input: {
    dbJobId: string;
    onChainJobId: string;
    milestoneIndex: number;
    deliverableUri: string;
  }) => {
    return runMilestoneTx({
      functionName: 'submitMilestone',
      args: [BigInt(input.onChainJobId), BigInt(input.milestoneIndex), input.deliverableUri],
      apiAction: 'submit',
      apiBody: { deliverableUri: input.deliverableUri },
      ...input,
    });
  }, []);

  /** Client approves submitted milestone → release */
  const approveMilestone = useCallback(async (input: {
    dbJobId: string;
    onChainJobId: string;
    milestoneIndex: number;
  }) => {
    return runMilestoneTx({
      functionName: 'approveMilestone',
      args: [BigInt(input.onChainJobId), BigInt(input.milestoneIndex)],
      apiAction: 'approve',
      apiBody: {},
      ...input,
    });
  }, []);

  /** Client rejects (may auto-escalate to dispute on 3rd) */
  const rejectMilestone = useCallback(async (input: {
    dbJobId: string;
    onChainJobId: string;
    milestoneIndex: number;
    feedbackUri: string;
  }) => {
    return runMilestoneTx({
      functionName: 'rejectMilestone',
      args: [BigInt(input.onChainJobId), BigInt(input.milestoneIndex), input.feedbackUri],
      apiAction: 'reject',
      apiBody: { feedbackUri: input.feedbackUri },
      ...input,
    });
  }, []);

  /** Either party opens a dispute */
  const openDispute = useCallback(async (input: {
    dbJobId: string;
    onChainJobId: string;
    milestoneIndex: number;
    tier: number; // 0 = AI, 1 = human, 2 = pool
    reasonUri: string;
  }) => {
    return runMilestoneTx({
      functionName: 'openDispute',
      args: [BigInt(input.onChainJobId), BigInt(input.milestoneIndex), input.tier, input.reasonUri],
      apiAction: 'dispute',
      apiBody: { reasonUri: input.reasonUri, tier: input.tier },
      ...input,
    });
  }, []);

  /**
   * Permissionless auto-release after approveDeadline. Anyone can call.
   * V1 = manual button; V2 = keeper/cron will replace this.
   */
  const autoReleaseMilestone = useCallback(async (input: {
    dbJobId: string;
    onChainJobId: string;
    milestoneIndex: number;
  }) => {
    return runMilestoneTx({
      functionName: 'autoReleaseMilestone',
      args: [BigInt(input.onChainJobId), BigInt(input.milestoneIndex)],
      apiAction: 'autoRelease',
      apiBody: {},
      ...input,
    });
  }, []);

  // Shared executor for milestone-level actions
  async function runMilestoneTx(opts: {
    dbJobId: string;
    milestoneIndex: number;
    functionName: string;
    args: readonly unknown[];
    apiAction: 'submit' | 'approve' | 'reject' | 'dispute' | 'autoRelease';
    apiBody: Record<string, unknown>;
  }) {
    if (!isConnected || !address) throw new Error('Wallet not connected');
    setState({ step: 'sending', message: `Sending ${opts.apiAction} tx…` });

    try {
      const txHash = await writeContractAsync({
        address: ARC_VAULT_ADDRESS as Address,
        abi: arcVaultAbi,
        functionName: opts.functionName,
        args: opts.args,
      });

      setState({ step: 'waiting', message: 'Waiting for confirmation…', txHash });
      await waitForTransactionReceipt(config, { hash: txHash });

      setState({ step: 'indexing', message: 'Verifying event on-chain…', txHash });
      const res = await authFetch(`/api/vault/jobs/${opts.dbJobId}/milestones/${opts.milestoneIndex}`, {
        method: 'POST',
        body: JSON.stringify({ action: opts.apiAction, txHash, ...opts.apiBody }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `${opts.apiAction} failed: HTTP ${res.status}`);

      setState({ step: 'done', message: `${opts.apiAction} ✓`, txHash });
      return { txHash, ...json };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState({ step: 'error', message: msg, errorReason: msg });
      throw err;
    }
  }

  /** Resolver settles a dispute on-chain (admin only) */
  const resolveDispute = useCallback(async (input: {
    dbJobId: string;
    onChainJobId: string;
    milestoneIndex: number;
    outcome: 'release' | 'refund' | 'split';
    jobberBps: number;
    clientBps: number;
  }) => {
    if (!isConnected || !address) throw new Error('Wallet not connected');
    setState({ step: 'sending', message: 'Resolving dispute…' });

    try {
      // outcome enum: None=0, Release=1, Refund=2, Split=3
      const outcomeNum = input.outcome === 'release' ? 1 : input.outcome === 'refund' ? 2 : 3;

      const txHash = await writeContractAsync({
        address: ARC_VAULT_ADDRESS as Address,
        abi: arcVaultAbi,
        functionName: 'resolveDispute',
        args: [BigInt(input.onChainJobId), BigInt(input.milestoneIndex), outcomeNum, input.jobberBps, input.clientBps],
      });

      setState({ step: 'waiting', message: 'Waiting for confirmation…', txHash });
      await waitForTransactionReceipt(config, { hash: txHash });

      setState({ step: 'indexing', message: 'Verifying resolution event…', txHash });
      const res = await authFetch(`/api/vault/jobs/${input.dbJobId}/milestones/${input.milestoneIndex}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ txHash, outcome: input.outcome, jobberBps: input.jobberBps, clientBps: input.clientBps }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Resolve failed: HTTP ${res.status}`);

      setState({ step: 'done', message: 'Dispute resolved ✓', txHash });
      return { txHash, ...json };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState({ step: 'error', message: msg, errorReason: msg });
      throw err;
    }
  }, [address, isConnected, writeContractAsync, authFetch]);

  const reset = useCallback(() => setState(INITIAL), []);

  return {
    state,
    isPending,
    acceptJob,
    submitMilestone,
    approveMilestone,
    rejectMilestone,
    openDispute,
    autoReleaseMilestone,
    resolveDispute,
    reset,
  };
}
