'use client';

import { BADGE_NAMES, BADGE_EMOJIS } from '@/lib/contracts';

interface Props {
  tokenId: number;
  badgeType: number;
  mintedAt: number;
  metadataURI: string;
}

export default function AchievementCard({ tokenId, badgeType, mintedAt, metadataURI }: Props) {
  const name = BADGE_NAMES[badgeType as keyof typeof BADGE_NAMES] ?? 'Unknown Badge';
  const emoji = BADGE_EMOJIS[badgeType as keyof typeof BADGE_EMOJIS] ?? '🏆';
  const date = new Date(Number(mintedAt) * 1000).toLocaleDateString();

  return (
    <div className="card group hover:border-blue-500/50 transition-all duration-300">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white">{name}</h3>
          <p className="text-sm text-gray-500 mt-1">Badge #{tokenId}</p>
          <p className="text-xs text-gray-600 mt-1">Minted: {date}</p>
        </div>
        <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
          <span className="text-xs text-green-400 font-medium">Soulbound</span>
        </div>
      </div>
    </div>
  );
}
