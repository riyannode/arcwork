'use client';

import Link from 'next/link';
import { useAccount, useReadContract } from 'wagmi';
import { CONTRACTS, MILESTONE_ESCROW_ABI, shortenAddress } from '@/lib/contracts';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ESCROW_CONFIGURED = CONTRACTS.MILESTONE_ESCROW !== ZERO_ADDRESS;

export default function WorkProofPage() {
  const { address, isConnected } = useAccount();

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
          <div className="mb-6 text-4xl text-cyan-300">◇</div>
          <h2 className="mb-4 text-2xl font-light">Connect Wallet</h2>
          <p className="text-sm font-extralight leading-7 text-white/50">
            Connect your wallet to view completed work proof from ArcWork escrow projects.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-6 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12">
          <p className="mb-3 text-xs font-light uppercase tracking-[0.24em] text-cyan-300/70">
            Work proof
          </p>
          <h1 className="text-[36px] font-light leading-tight md:text-[52px]">Proof of completed paid work</h1>
          <p className="mt-3 max-w-2xl text-sm font-light leading-7 text-white/45">
            ArcWork proof is issued when a funded project has released all milestones. It ties reputation to completed
            USDC work instead of empty engagement badges.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="glass-card p-6">
            <p className="text-xs font-light uppercase tracking-[0.2em] text-white/35">Wallet</p>
            <p className="mt-3 text-xl font-light">{shortenAddress(address || '')}</p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-sm font-light leading-7 text-white/45">
                Completed project events emit <span className="text-cyan-200">WorkProofMinted</span> on the escrow
                contract. A future NFT badge can consume the same signal without changing the core escrow flow.
              </p>
            </div>
            <Link href="/invoice" className="btn-primary mt-6 inline-block">
              Create Escrow Project
            </Link>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-xl font-light">Projects attached to this wallet</h2>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {projectIds.length > 0 ? (
                projectIds.map((id) => (
                  <div key={id.toString()} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-sm font-medium text-white">Project #{id.toString()}</p>
                    <p className="mt-2 text-sm font-light leading-6 text-white/45">
                      Check contract status for funded, submitted, released, or completed proof state.
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:col-span-2">
                  <p className="text-sm font-light leading-7 text-white/45">
                    No project records found for this wallet yet. Complete an escrow project to generate proof.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
