'use client';

import { formatUSDC, shortenAddress, INVOICE_STATUS, getExplorerTxUrl } from '@/lib/contracts';

interface Props {
  id: number;
  creator: string;
  client: string;
  amount: bigint;
  description: string;
  status: number;
  createdAt: number;
  paidAt: number;
  onPay?: () => void;
  onComplete?: () => void;
  onCancel?: () => void;
  isOwner?: boolean;
  isPending?: boolean;
}

const statusColors: Record<number, string> = {
  0: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  1: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  2: 'bg-green-500/10 text-green-400 border-green-500/20',
  3: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function InvoiceCard({
  id, creator, client, amount, description, status, createdAt, onPay, onComplete, onCancel, isPending,
}: Props) {
  const statusText = INVOICE_STATUS[status] ?? 'Unknown';
  const date = new Date(Number(createdAt) * 1000).toLocaleDateString();

  return (
    <div className="card hover:border-blue-500/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-white">Invoice #{id}</h3>
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        </div>
        <span className={`px-3 py-1 rounded-lg text-xs font-medium border ${statusColors[status]}`}>
          {statusText}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">From</span>
          <p className="font-mono text-gray-300">{shortenAddress(creator)}</p>
        </div>
        <div>
          <span className="text-gray-500">To</span>
          <p className="font-mono text-gray-300">{shortenAddress(client)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-800">
        <div>
          <span className="text-2xl font-bold text-white">{formatUSDC(amount)}</span>
          <span className="text-sm text-gray-500 ml-1">USDC</span>
        </div>
        <div className="flex gap-2">
          {status === 0 && onPay && (
            <button onClick={onPay} className="btn-primary text-sm py-2 px-4">
              Pay
            </button>
          )}
          {status === 1 && onComplete && (
            <button onClick={onComplete} className="btn-primary text-sm py-2 px-4">
              Complete
            </button>
          )}
          {status === 0 && onCancel && (
            <button onClick={onCancel} className="btn-secondary text-sm py-2 px-4">
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
