'use client';

import { useState, useEffect } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import Navbar from '@/components/Navbar';

const Dashboard = () => {
  const [isMounted, setIsMounted] = useState(false);
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Mock data for stats
  const statsData = [
    { title: 'Achievements', value: '24', change: '+2', icon: '🏆' },
    { title: 'Invoices', value: '18', change: '+1', icon: '📄' },
    { title: 'Subscriptions', value: '7', change: '+0', icon: '🔁' },
  ];

  // Mock recent activity
  const recentActivity = [
    { id: 1, user: 'Alex Johnson', action: 'completed project', time: '2 min ago' },
    { id: 2, user: 'Sam Smith', action: 'submitted invoice', time: '15 min ago' },
    { id: 3, user: 'Taylor Reed', action: 'updated profile', time: '1 hour ago' },
    { id: 4, user: 'Jordan Lee', action: 'made payment', time: '3 hours ago' },
    { id: 5, user: 'Casey Brown', action: 'created subscription', time: '1 day ago' },
  ];

  // Quick actions
  const quickActions = [
    { name: 'New Project', icon: '➕', color: 'bg-blue-500' },
    { name: 'Send Invoice', icon: '✉️', color: 'bg-green-500' },
    { name: 'Add Member', icon: '👥', color: 'bg-purple-500' },
    { name: 'Generate Report', icon: '📊', color: 'bg-yellow-500' },
  ];

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-gray-400 mt-2">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Wallet Connection */}
        <div className="mb-8 flex justify-end">
          {isConnected ? (
            <div className="flex items-center space-x-4">
              <div className="bg-gray-800 px-4 py-2 rounded-lg">
                <span className="text-sm text-gray-400">Connected:</span>
                <span className="ml-2 font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
              </div>
              <button
                onClick={() => disconnect()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={() => connect()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat, index) => (
            <div 
              key={index} 
              className="bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-gray-400 text-sm">{stat.title}</p>
                  <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                  <p className="text-green-500 text-sm mt-2">{stat.change} from last week</p>
                </div>
                <div className="text-3xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Recent Activity</h2>
                <button className="text-indigo-400 hover:text-indigo-300 text-sm">
                  View All
                </button>
              </div>
              
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start border-b border-gray-700 pb-4 last:border-0 last:pb-0">
                    <div className="bg-gray-700 rounded-full w-10 h-10 flex items-center justify-center mr-3 flex-shrink-0">
                      👤
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">
                        <span className="text-indigo-400">{activity.user}</span> {activity.action}
                      </p>
                      <p className="text-gray-400 text-sm mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="bg-gray-800 rounded-xl p-6 shadow-lg h-full">
              <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
              
              <div className="grid grid-cols-2 gap-4">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    className={`${action.color} rounded-lg p-4 flex flex-col items-center justify-center hover:opacity-90 transition-opacity`}
                  >
                    <span className="text-2xl mb-2">{action.icon}</span>
                    <span className="text-sm font-medium">{action.name}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8">
                <h3 className="font-bold mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm">Database: Operational</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                    <span className="text-sm">API: Operational</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                    <span className="text-sm">Notifications: Pending</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;