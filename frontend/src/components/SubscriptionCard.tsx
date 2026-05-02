'use client';

import { formatUSDC, shortenAddress } from '@/lib/contracts';

interface Props {
  id: number;
  planId: number;
  creator: string;
  amount: bigint;
  interval: number;
  name: string;
  description: string;
  active: boolean;
  lastCharged?: number;
  onCancel?: () => void;
  onSubscribe?: () => void;
  isSubscribed?: boolean;
  isPending?: boolean;
}

export default function SubscriptionCard({
  id, creator, amount, interval, name, description, active, onCancel, onSubscribe, isSubscribed, isPending,
}: Props) {
  const intervalDays = Math.floor(Number(interval) / 86400);
  const intervalLabel = intervalDays >= 30 ? `${Math.floor(intervalDays / 30)} month(s)` : `${intervalDays} day(s)`;

  return (
    <div className="card hover:border-indigo-500/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white text-lg">{name}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${
          active ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
        }`}>
          {active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div>
          <span className="text-xs text-gray-500">Price</span>
          <p className="font-bold text-white">{formatUSDC(amount)} <span className="text-gray-500 text-sm font-normal">USDC</span></p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Interval</span>
          <p className="text-white">{intervalLabel}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Creator</span>
          <p className="font-mono text-sm text-gray-300">{shortenAddress(creator)}</p>
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-800">
        {isSubscribed && onCancel ? (
          <>
            <button onClick={onCancel} disabled={isPending} className="btn-secondary text-sm py-2 px-4">
              {isPending ? 'Cancelling...' : 'Cancel Subscription'}
            </button>
          </>
        ) : onSubscribe ? (
          <button onClick={onSubscribe} disabled={isPending || !active} className="btn-primary text-sm py-2 px-4">
            {isPending ? 'Subscribing...' : 'Subscribe'}
          </button>
        ) : null}
      </div>
    </div>
  );
}
