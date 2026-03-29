'use client';

import React, { useState } from 'react';
import { Users, UserPlus, FileText, Dumbbell } from 'lucide-react';

export default function CoachDashboardPage() {
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const clients = [
    { id: 1, name: 'John Doe', status: 'Active', goal: 'Muscle Gain' },
    { id: 2, name: 'Jane Smith', status: 'Pending Review', goal: 'Weight Loss' },
    { id: 3, name: 'Alex Johnson', status: 'Active', goal: 'Endurance' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Coach Dashboard</h1>
          <p className="text-zinc-400">Manage your clients and their plans.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-5 py-2.5 rounded-full font-medium transition-colors">
            <UserPlus size={20} />
            Invite Client
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Clients List */}
        <div className="md:col-span-1 border-r border-zinc-800 pr-6 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Users size={20} className="text-pink-500" />
            My Clients
          </h2>
          <div className="space-y-2">
            {clients.map((client) => (
              <div 
                key={client.id} 
                onClick={() => setSelectedClient(client)}
                className={`p-3 bg-zinc-900 border rounded-xl cursor-pointer transition-colors ${selectedClient?.id === client.id ? 'border-pink-500' : 'border-zinc-800 hover:border-pink-500/50'}`}
              >
                <p className="font-semibold text-zinc-200">{client.name}</p>
                <p className={`text-xs ${client.status === 'Active' ? 'text-green-500' : 'text-orange-500'}`}>
                  {client.status}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Client Viewer Placeholder */}
        <div className="md:col-span-3">
          {selectedClient ? (
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl min-h-[400px]">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-1">{selectedClient.name}</h3>
                  <p className="text-zinc-400">Goal: {selectedClient.goal}</p>
                </div>
                <button className="flex items-center gap-2 bg-pink-600 hover:bg-pink-500 text-white px-4 py-2 rounded-xl font-medium transition-colors">
                  <Dumbbell size={18} />
                  Create Plan
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-1">Recent Activity</p>
                  <p className="text-white font-medium">No recent workouts</p>
                </div>
                <div className="bg-zinc-800/50 p-4 rounded-2xl border border-zinc-800">
                  <p className="text-zinc-400 text-sm mb-1">Current Plan</p>
                  <p className="text-white font-medium">None assigned</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl min-h-[400px] flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-500">
                <FileText size={32} />
              </div>
              <h3 className="text-xl font-bold text-zinc-300 mb-2">Select a client</h3>
              <p className="text-zinc-500 max-w-sm">
                Click on a client from the list to view their progress, adjust their workout plans, or send feedback.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}