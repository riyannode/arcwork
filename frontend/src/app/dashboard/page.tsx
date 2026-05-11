'use client';

import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS, MILESTONE_ESCROW_ABI, shortenAddress } from '@/lib/contracts';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ESCROW_CONFIGURED = CONTRACTS.MILESTONE_ESCROW !== ZERO_ADDRESS;

const operatingStates = [
  { label: 'Created', body: 'Freelancer has drafted project scope and milestones.' },
  { label: 'Funded', body: 'Client has locked USDC into the Arc escrow contract.' },
  { label: 'Submitted', body: 'Freelancer has attached a milestone delivery link.' },
  { label: 'Released', body: 'Client has approved work and USDC has settled.' },
];

export default function Dashboard() {
  const { address, isConnected } = useAccount();

  const { data: projectCounter } = useReadContract({
    address: CONTRACTS.MILESTONE_ESCROW,
    abi: MILESTONE_ESCROW_ABI,
    functionName: 'projectCounter',
    query: { enabled: ESCROW_CONFIGURED },
  });

  const { data: userProjects } = useReadContract({
    address: CONTRACTS.MILESTONE_ESCROW,
    abi: MILESTONE_ESCROW_ABI,
    functionName: 'getUserProjects',
    args: [address || ZERO_ADDRESS],
    query: { enabled: ESCROW_CONFIGURED && Boolean(address) },
  });

  const projectIds = (userProjects || []) as readonly bigint[];

  if (!isConnected) {
    return (
      <div className="flex min-h-screen items-center justify-center px-8">
        <div className="glass-card max-w-md p-12 text-center">
          <div className="mb-6 text-4xl text-cyan-300">□</div>
          <h2 className="mb-4 text-2xl font-light">Connect Wallet</h2>
          <p className="mb-8 text-sm font-extralight leading-7 text-white/50">
            Connect your wallet to manage funded projects, milestone submissions, and release approvals.
          </p>
          <Link href="/invoice" className="btn-primary inline-block">
            Create Project
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-light uppercase tracking-[0.24em] text-cyan-300/70">
              Escrow dashboard
            </p>
            <h1 className="text-[36px] font-light leading-tight md:text-[52px]">
              Milestone command center
            </h1>
            <p className="mt-3 text-sm font-light text-white/45">
              {shortenAddress(address || '')} · Arc Testnet
            </p>
          </div>
          <Link href="/invoice" className="btn-primary self-start md:self-auto">
            New Project
          </Link>
        </div>

        {!ESCROW_CONFIGURED && (
          <div className="mb-8 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-5">
            <p className="text-sm font-light text-amber-100">
              MilestoneEscrow is not deployed yet. Deploy the V1 contract, then replace
              <span className="font-medium"> CONTRACTS.MILESTONE_ESCROW </span>
              in <span className="font-medium">frontend/src/lib/contracts.ts</span>.
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="glass-card p-6">
            <p className="text-xs font-light uppercase tracking-[0.2em] text-white/35">Total projects</p>
            <p className="mt-4 text-4xl font-light">{ESCROW_CONFIGURED ? String(projectCounter || BigInt(0)) : '0'}</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-xs font-light uppercase tracking-[0.2em] text-white/35">Your projects</p>
            <p className="mt-4 text-4xl font-light">{projectIds.length}</p>
          </div>
          <div className="glass-card p-6">
            <p className="text-xs font-light uppercase tracking-[0.2em] text-white/35">Settlement</p>
            <p className="mt-4 text-4xl font-light">USDC</p>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-card p-6">
            <h2 className="text-lg font-light">Your project IDs</h2>
            <div className="mt-5 space-y-3">
              {projectIds.length > 0 ? (
                projectIds.map((id) => (
                  <div key={id.toString()} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-white/55">Project #{id.toString()}</span>
                    <span className="text-xs text-cyan-200">Onchain</span>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm font-light leading-7 text-white/45">
                  No onchain project IDs found for this wallet yet. Create a project first, then fund it from the client wallet.
                </p>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-light">V1 operating flow</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {operatingStates.map((state) => (
                <div key={state.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-sm font-medium text-white">{state.label}</p>
                  <p className="mt-2 text-sm font-light leading-6 text-white/45">{state.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
