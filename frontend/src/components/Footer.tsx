export default function Footer() {
  return (
    <footer className="border-t border-gray-800 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-md flex items-center justify-center text-xs font-bold">
              A
            </div>
            <span className="font-semibold text-gray-300">ArcWork</span>
          </div>
          <p className="text-sm text-gray-500">
            Achievement + Invoice + Subscription dApp on Arc Network
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://testnet.arcscan.app"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              ArcScan ↗
            </a>
            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Faucet ↗
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
