'use client';

import { useState } from 'react';

interface Invoice {
  id: string;
  clientAddress: string;
  amount: number;
  description: string;
  status: 'pending' | 'paid';
  createdAt: Date;
}

export default function Invoice() {
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: '1',
      clientAddress: '0x742d35Cc6634C0532925a3b844Bc454e4438f44e',
      amount: 100,
      description: 'Web development services',
      status: 'pending',
      createdAt: new Date(),
    },
    {
      id: '2',
      clientAddress: '0x8ba1f109551bD432803012645H7A789B12345678',
      amount: 250,
      description: 'Design consultation',
      status: 'paid',
      createdAt: new Date(Date.now() - 86400000),
    },
  ]);
  
  const [clientAddress, setClientAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientAddress || !amount || !description) return;
    
    const newInvoice: Invoice = {
      id: (invoices.length + 1).toString(),
      clientAddress,
      amount: parseFloat(amount),
      description,
      status: 'pending',
      createdAt: new Date(),
    };
    
    setInvoices([newInvoice, ...invoices]);
    setClientAddress('');
    setAmount('');
    setDescription('');
  };

  const handlePayInvoice = (id: string) => {
    setIsProcessing(true);
    // Simulate payment processing
    setTimeout(() => {
      setInvoices(invoices.map(inv => 
        inv.id === id ? {...inv, status: 'paid'} : inv
      ));
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-3xl font-bold">ArcWork Invoicing</h1>
          <p className="text-gray-400 mt-2">Create and manage invoices</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Invoice Form */}
          <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Create New Invoice</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Client Address
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="0x..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Amount (USDC)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="Invoice details"
                  rows={3}
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
              >
                Create Invoice
              </button>
            </form>
          </div>

          {/* Invoice List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Invoice History</h2>
            <div className="space-y-4">
              {invoices.length === 0 ? (
                <div className="bg-gray-800 rounded-xl p-6 text-center">
                  <p className="text-gray-400">No invoices created yet</p>
                </div>
              ) : (
                invoices.map((invoice) => (
                  <div 
                    key={invoice.id} 
                    className="bg-gray-800 rounded-xl p-6 shadow-lg"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{invoice.description}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'pending' 
                              ? 'bg-yellow-900 text-yellow-300' 
                              : 'bg-green-900 text-green-300'
                          }`}>
                            {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">
                          {invoice.clientAddress}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {invoice.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${invoice.amount.toFixed(2)} USDC</p>
                        {invoice.status === 'pending' && (
                          <button
                            onClick={() => handlePayInvoice(invoice.id)}
                            disabled={isProcessing}
                            className="mt-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-1 px-3 rounded-lg transition duration-200"
                          >
                            {isProcessing ? 'Processing...' : 'Pay Now'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}