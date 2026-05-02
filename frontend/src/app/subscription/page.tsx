'use client';

import { useState } from 'react';

type Subscription = {
  id: string;
  creatorAddress: string;
  amount: number;
  interval: 'monthly' | 'yearly';
  nextBillingDate: string;
  status: 'active' | 'cancelled';
};

export default function Subscription() {
  const [creatorAddress, setCreatorAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([
    {
      id: '1',
      creatorAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      amount: 10,
      interval: 'monthly',
      nextBillingDate: '2023-06-15',
      status: 'active'
    },
    {
      id: '2',
      creatorAddress: '0x8ba1f109551bD432803012645H89345678901234',
      amount: 50,
      interval: 'yearly',
      nextBillingDate: '2023-12-01',
      status: 'active'
    }
  ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatorAddress || !amount) return;

    const newSubscription: Subscription = {
      id: Date.now().toString(),
      creatorAddress,
      amount: parseFloat(amount),
      interval,
      nextBillingDate: new Date(Date.now() + (interval === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active'
    };

    setSubscriptions([...subscriptions, newSubscription]);
    setCreatorAddress('');
    setAmount('');
  };

  const cancelSubscription = (id: string) => {
    setSubscriptions(subscriptions.map(sub => 
      sub.id === id ? {...sub, status: 'cancelled'} : sub
    ));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">ArcWork Subscriptions</h1>
        
        {/* Create Subscription Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Subscription</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Creator Address</label>
              <input
                type="text"
                value={creatorAddress}
                onChange={(e) => setCreatorAddress(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0x..."
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Amount (ETH)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0.0"
                step="0.01"
                min="0"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Billing Interval</label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={interval === 'monthly'}
                    onChange={() => setInterval('monthly')}
                    className="mr-2"
                  />
                  Monthly
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    checked={interval === 'yearly'}
                    onChange={() => setInterval('yearly')}
                    className="mr-2"
                  />
                  Yearly
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition duration-200"
            >
              Create Subscription
            </button>
          </form>
        </div>
        
        {/* Active Subscriptions List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Active Subscriptions</h2>
          
          {subscriptions.filter(sub => sub.status === 'active').length === 0 ? (
            <p className="text-gray-400 italic">No active subscriptions</p>
          ) : (
            <div className="space-y-4">
              {subscriptions
                .filter(sub => sub.status === 'active')
                .map((subscription) => (
                  <div key={subscription.id} className="bg-gray-800 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <div className="font-medium">
                        {subscription.creatorAddress.substring(0, 6)}...{subscription.creatorAddress.substring(subscription.creatorAddress.length - 4)}
                      </div>
                      <div className="text-sm text-gray-400">
                        {subscription.amount} ETH • {subscription.interval}
                      </div>
                      <div className="text-sm text-gray-400 mt-1">
                        Next billing: {new Date(subscription.nextBillingDate).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => cancelSubscription(subscription.id)}
                      className="bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}