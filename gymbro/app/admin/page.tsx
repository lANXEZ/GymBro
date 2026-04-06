'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Search, Edit, Trash2, Shield, Activity, Users as UsersIcon } from 'lucide-react';
import { fetchAllUsers, updateUserRoleApi, fetchAllPublicExercisesApi, updateAdminExerciseApi, deleteAdminExerciseApi } from '../lib/apiClient';

export default function AdminDashboard() {
  const { user, token, isLoggedIn } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'users' | 'exercises'>('users');

  // Users state
  const [users, setUsers] = useState<any[]>([]);
  const [searchUser, setSearchUser] = useState('');
  
  // Exercises state
  const [exercises, setExercises] = useState<any[]>([]);
  const [searchExercise, setSearchExercise] = useState('');
  const [editingExercise, setEditingExercise] = useState<any | null>(null);

  useEffect(() => {
    if (isLoggedIn === false) {
      router.push('/');
      return;
    }
    if (user && user.role !== 'admin') {
      router.push('/');
      return;
    }
    if (token && user?.role === 'admin') {
      loadUsers();
      loadExercises();
    }
  }, [user, token, isLoggedIn, router]);

  const loadUsers = async () => {
    try {
      const data = await fetchAllUsers(token!);
      setUsers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadExercises = async () => {
    try {
      const data = await fetchAllPublicExercisesApi(token!);
      setExercises(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await updateUserRoleApi(token!, userId, newRole);
      loadUsers();
    } catch (err) {
      console.error(err);
      alert('Failed to update role');
    }
  };

  const handleDeleteExercise = async (id: number) => {
    if (!confirm('Are you sure you want to delete this exercise?')) return;
    try {
      await deleteAdminExerciseApi(token!, id);
      loadExercises();
    } catch (err) {
      console.error(err);
      alert('Failed to delete exercise');
    }
  };

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExercise) return;
    // Format numeric values
    const payload = {
        ...editingExercise,
        steps: editingExercise.Steps,
        description: editingExercise.Description,
        caution: editingExercise.Caution,
        url: editingExercise.URL,
        accessibility: editingExercise.Accessibility,
        record_type: editingExercise.RecordType,
        progress_type: editingExercise.ProgressType
    };

    try {
      await updateAdminExerciseApi(token!, editingExercise.ExMoveID, payload);
      setEditingExercise(null);
      loadExercises();
    } catch (err) {
      console.error(err);
      alert('Failed to update exercise');
    }
  };

  if (!user || user.role !== 'admin') return <div className="p-8 text-center text-zinc-500 font-medium">Loading Admin Dashboard...</div>;

  const filteredUsers = users.filter(u => 
    String(u.UserID).includes(searchUser) ||
    String(u.Username).toLowerCase().includes(searchUser.toLowerCase()) || 
    String(u.FirstName).toLowerCase().includes(searchUser.toLowerCase())
  ).sort((a, b) => a.UserID - b.UserID);

  const filteredExercises = exercises.filter(e =>
    String(e.ExMoveID).includes(searchExercise) ||
    String(e.Description).toLowerCase().includes(searchExercise.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center gap-3">
            <Shield className="text-pink-500" size={32} /> Admin Dashboard
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400">Manage users and global exercises</p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'users' ? 'border-b-2 border-pink-500 text-pink-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><UsersIcon size={18} /> Manage Users</div>
        </button>
        <button
          onClick={() => setActiveTab('exercises')}
          className={`pb-4 px-2 font-medium transition-colors ${activeTab === 'exercises' ? 'border-b-2 border-pink-500 text-pink-500' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
        >
          <div className="flex items-center gap-2"><Activity size={18} /> Public Exercises</div>
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          <div className="overflow-x-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 dark:text-zinc-400">
                <tr>
                  <th className="p-4 font-medium uppercase text-xs tracking-wider">ID</th>
                  <th className="p-4 font-medium uppercase text-xs tracking-wider">Username</th>
                  <th className="p-4 font-medium uppercase text-xs tracking-wider">Full Name</th>
                  <th className="p-4 font-medium uppercase text-xs tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredUsers.map(u => (
                  <tr key={u.UserID} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/30 transition-colors">
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">#{u.UserID}</td>
                    <td className="p-4 font-semibold">{u.Username}</td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-300">{u.FirstName} {u.LastName}</td>
                    <td className="p-4">
                      <select 
                        value={u.Status} 
                        onChange={(e) => handleRoleChange(u.UserID, e.target.value)}
                        className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-2 pr-8 focus:ring-pink-500 text-sm cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <option value="user">Gymgoer</option>
                        <option value="trainer">Trainer</option>
                        <option value="training client">Training Client</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">No users found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'exercises' && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input 
              type="text" 
              placeholder="Search exercise moves..." 
              value={searchExercise}
              onChange={(e) => setSearchExercise(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredExercises.map(ex => (
              <div key={ex.ExMoveID} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl flex items-center justify-between shadow-sm group hover:border-pink-500/50 transition-colors">
                <div className="overflow-hidden">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-2 py-0.5 rounded-md border border-zinc-200 dark:border-zinc-700">
                      ID: {ex.ExMoveID}
                    </span>
                  </div>
                  <h3 className="font-bold text-zinc-900 dark:text-white text-lg truncate">{ex.Description}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-600 dark:text-zinc-300 font-medium">
                      Record: {ex.RecordType}
                    </span>
                    <span className="text-xs bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md text-zinc-600 dark:text-zinc-300 font-medium">
                      Prog: {ex.ProgressType}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => setEditingExercise(ex)} className="p-2 bg-blue-50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors" title="Edit">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => handleDeleteExercise(ex.ExMoveID)} className="p-2 bg-red-50 text-red-600 dark:bg-red-900/40 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/60 transition-colors" title="Delete">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            {filteredExercises.length === 0 && (
              <div className="col-span-full p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-500">
                No public exercises found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Exercise Modal */}
      {editingExercise && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-2xl font-bold mb-6 text-zinc-900 dark:text-white">Edit Exercise</h2>
            <form onSubmit={handleSaveExercise} className="space-y-5">
              <div>
                <label className="text-sm text-zinc-500 block mb-1.5 font-medium">Description (Name)</label>
                <input required type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all" value={editingExercise.Description} onChange={e => setEditingExercise({...editingExercise, Description: e.target.value})} />
              </div>
              <div>
                <label className="text-sm text-zinc-500 block mb-1.5 font-medium">Steps</label>
                <textarea required rows={4} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono text-sm leading-relaxed" value={editingExercise.Steps} onChange={e => setEditingExercise({...editingExercise, Steps: e.target.value})} />
              </div>
              <div>
                <label className="text-sm text-zinc-500 block mb-1.5 font-medium">Caution (Optional)</label>
                <input type="text" className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all" value={editingExercise.Caution || ''} onChange={e => setEditingExercise({...editingExercise, Caution: e.target.value})} />
              </div>
              <div>
                <label className="text-sm text-zinc-500 block mb-1.5 font-medium">Accessibility</label>
                <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all" value={editingExercise.Accessibility} onChange={e => setEditingExercise({...editingExercise, Accessibility: e.target.value})}>
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-zinc-500 block mb-1.5 font-medium">Record Type</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all" value={editingExercise.RecordType} onChange={e => setEditingExercise({...editingExercise, RecordType: e.target.value})}>
                    <option value="weight">Weight</option>
                    <option value="rep">Rep</option>
                    <option value="time">Time</option>
                    <option value="distance">Distance</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-zinc-500 block mb-1.5 font-medium">Progress Type</label>
                  <select className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all" value={editingExercise.ProgressType} onChange={e => setEditingExercise({...editingExercise, ProgressType: e.target.value})}>
                    <option value="increase">Increase</option>
                    <option value="decrease">Decrease</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-zinc-200 dark:border-zinc-800">
                <button type="button" onClick={() => setEditingExercise(null)} className="px-5 py-2.5 bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-pink-600 shadow-lg shadow-pink-600/25 text-white rounded-xl font-bold hover:bg-pink-500 transition-colors">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}