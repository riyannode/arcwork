'use client';

import { FormEvent, useMemo, useState } from 'react';
import { isAddress } from 'viem';
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi';
import {
  CONTRACTS,
  MILESTONE_ESCROW_ABI,
  USDC_ABI,
  getExplorerTxUrl,
  parseUSDC,
  shortenAddress,
} from '@/lib/contracts';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ESCROW_CONFIGURED = CONTRACTS.MILESTONE_ESCROW !== ZERO_ADDRESS;

type MilestoneInput = {
  title: string;
  amount: string;
};

const defaultMilestones: MilestoneInput[] = [
  { title: 'Initial delivery', amount: '250' },
  { title: 'Final handoff', amount: '750' },
];

export default function InvoicePage() {
  const { address, isConnected } = useAccount();
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const [client, setClient] = useState('');
  const [title, setTitle] = useState('Landing page redesign');
  const [description, setDescription] = useState('Design, build, and hand off a new landing page.');
  const [milestones, setMilestones] = useState<MilestoneInput[]>(defaultMilestones);

  const [projectId, setProjectId] = useState('0');
  const [fundAmount, setFundAmount] = useState('1000');
  const [milestoneId, setMilestoneId] = useState('0');
  const [deliverableURI, setDeliverableURI] = useState('https://example.com/delivery');

  const activeMilestones = useMemo(
    () => milestones.filter((milestone) => milestone.title.trim() && Number(milestone.amount) > 0),
    [milestones]
  );

  const totalAmount = useMemo(
    () => activeMilestones.reduce((sum, milestone) => sum + Number(milestone.amount || 0), 0),
    [activeMilestones]
  );

  const updateMilestone = (index: number, key: keyof MilestoneInput, value: string) => {
    setMilestones((current) =>
      current.map((milestone, milestoneIndex) =>
        milestoneIndex === index ? { ...milestone, [key]: value } : milestone
      )
    );
  };

  const createProject = (event: FormEvent) => {
    event.preventDefault();
    if (!ESCROW_CONFIGURED || !isAddress(client) || activeMilestones.length === 0) return;

    writeContract({
      address: CONTRACTS.MILESTONE_ESCROW,
      abi: MILESTONE_ESCROW_ABI,
      functionName: 'createProject',
      args: [
        client as `0x${string}`,
        title.trim(),
        description.trim(),
        activeMilestones.map((milestone) => milestone.title.trim()),
        activeMilestones.map((milestone) => parseUSDC(milestone.amount)),
      ],
    });
  };

  const approveUSDC = () => {
    if (!ESCROW_CONFIGURED || Number(fundAmount) <= 0) return;

    writeContract({
      address: CONTRACTS.USDC,
      abi: USDC_ABI,
      functionName: 'approve',
      args: [CONTRACTS.MILESTONE_ESCROW, parseUSDC(fundAmount)],
    });
  };

  const fundProject = () => {
    if (!ESCROW_CONFIGURED || projectId.trim() === '') return;

    writeContract({
      address: CONTRACTS.MILESTONE_ESCROW,
      abi: MILESTONE_ESCROW_ABI,
      functionName: 'fundProject',
      args: [BigInt(projectId)],
    });
  };

  const submitMilestone = () => {
    if (!ESCROW_CONFIGURED || projectId.trim() === '' || milestoneId.trim() === '') return;

    writeContract({
      address: CONTRACTS.MILESTONE_ESCROW,
      abi: MILESTONE_ESCROW_ABI,
      functionName: 'submitMilestone',
      args: [BigInt(projectId), BigInt(milestoneId), deliverableURI.trim()],
    });
  };

  const approveMilestone = () => {
    if (!ESCROW_CONFIGURED || projectId.trim() === '' || milestoneId.trim() === '') return;

    writeContract({
      address: CONTRACTS.MILESTONE_ESCROW,
      abi: MILESTONE_ESCROW_ABI,
      functionName: 'approveMilestone',
      args: [BigInt(projectId), BigInt(milestoneId)],
    });
  };

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center px-8">
        <div className="glass-card max-w-md p-12 text-center">
          <div className="mb-6 text-4xl text-cyan-300">□</div>
          <h2 className="mb-4 text-2xl font-light">Connect Wallet</h2>
          <p className="text-sm font-extralight leading-7 text-white/50">
            Connect your wallet to create escrow projects and operate milestone payments.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10">
          <p className="mb-3 text-xs font-light uppercase tracking-[0.24em] text-cyan-300/70">
            New escrow project
          </p>
          <h1 className="text-[36px] font-light leading-tight md:text-[52px]">Create milestone invoice</h1>
          <p className="mt-3 max-w-2xl text-sm font-light leading-7 text-white/45">
            Connected as {shortenAddress(address || '')}. Define the client and milestones, then have the client fund
            the full USDC amount into Arc escrow.
          </p>
        </div>

        {!ESCROW_CONFIGURED && (
          <div className="mb-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="text-sm font-light text-amber-100">
              Contract address is not configured yet. Deploy MilestoneEscrow and update CONTRACTS.MILESTONE_ESCROW
              before sending transactions.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <form onSubmit={createProject} className="glass-card p-6 md:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-light">Project terms</h2>
                <p className="mt-2 text-sm font-light text-white/40">Freelancer creates this. Client funds it.</p>
              </div>
              <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                {totalAmount.toLocaleString()} USDC
              </div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-white/35">Client wallet</span>
                <input
                  value={client}
                  onChange={(event) => setClient(event.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-light text-white outline-none transition focus:border-cyan-300/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-white/35">Project title</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-light text-white outline-none transition focus:border-cyan-300/40"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-white/35">Scope</span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-light leading-7 text-white outline-none transition focus:border-cyan-300/40"
                />
              </label>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-light uppercase tracking-[0.18em] text-white/35">Milestones</span>
                  <button
                    type="button"
                    onClick={() => setMilestones((current) => [...current, { title: '', amount: '' }])}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/55 transition hover:border-cyan-300/30 hover:text-cyan-200"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-3">
                  {milestones.map((milestone, index) => (
                    <div key={index} className="grid grid-cols-1 gap-3 rounded-2xl border border-white/10 bg-white/[0.025] p-3 md:grid-cols-[1fr_150px]">
                      <input
                        value={milestone.title}
                        onChange={(event) => updateMilestone(index, 'title', event.target.value)}
                        placeholder={`Milestone ${index + 1}`}
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-light text-white outline-none transition focus:border-cyan-300/40"
                      />
                      <input
                        value={milestone.amount}
                        onChange={(event) => updateMilestone(index, 'amount', event.target.value)}
                        inputMode="decimal"
                        placeholder="USDC"
                        className="rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-light text-white outline-none transition focus:border-cyan-300/40"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!ESCROW_CONFIGURED || isPending || !isAddress(client) || activeMilestones.length === 0}
                className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-40"
              >
                Create Project
              </button>
            </div>
          </form>

          <div className="space-y-6">
            <div className="glass-card p-6">
              <h2 className="text-xl font-light">Operate escrow</h2>
              <p className="mt-2 text-sm font-light leading-7 text-white/40">
                After creation, use the emitted project ID for funding, submission, and release.
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-white/35">Project ID</span>
                  <input
                    value={projectId}
                    onChange={(event) => setProjectId(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-white/35">Milestone ID</span>
                  <input
                    value={milestoneId}
                    onChange={(event) => setMilestoneId(event.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                  />
                </label>
              </div>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-white/35">Funding amount</span>
                <input
                  value={fundAmount}
                  onChange={(event) => setFundAmount(event.target.value)}
                  inputMode="decimal"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <label className="mt-4 block">
                <span className="mb-2 block text-xs font-light uppercase tracking-[0.18em] text-white/35">Delivery link</span>
                <input
                  value={deliverableURI}
                  onChange={(event) => setDeliverableURI(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white outline-none"
                />
              </label>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button onClick={approveUSDC} disabled={!ESCROW_CONFIGURED || isPending} className="btn-ghost disabled:opacity-40">
                  Approve USDC
                </button>
                <button onClick={fundProject} disabled={!ESCROW_CONFIGURED || isPending} className="btn-ghost disabled:opacity-40">
                  Fund Project
                </button>
                <button onClick={submitMilestone} disabled={!ESCROW_CONFIGURED || isPending} className="btn-ghost disabled:opacity-40">
                  Submit Milestone
                </button>
                <button onClick={approveMilestone} disabled={!ESCROW_CONFIGURED || isPending} className="btn-ghost disabled:opacity-40">
                  Release Payment
                </button>
              </div>
            </div>

            <div className="glass-card p-6">
              <h2 className="text-xl font-light">Transaction status</h2>
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-light leading-7 text-white/45">
                {isPending && 'Waiting for wallet confirmation.'}
                {isConfirming && 'Transaction submitted. Waiting for Arc confirmation.'}
                {isSuccess && hash && (
                  <a href={getExplorerTxUrl(hash)} target="_blank" rel="noopener noreferrer" className="text-cyan-200">
                    Confirmed on ArcScan
                  </a>
                )}
                {!isPending && !isConfirming && !isSuccess && 'No transaction in progress.'}
              </div>
              {error && (
                <p className="mt-4 rounded-2xl border border-red-300/20 bg-red-300/10 p-4 text-xs font-light leading-6 text-red-100">
                  {error.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
