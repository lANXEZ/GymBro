'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Activity, Users, UserRound, Library } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Workouts', href: '/workouts', icon: Dumbbell },
    { name: 'Library', href: '/workouts/manage', icon: Library },
    { name: 'Progress', href: '/progress', icon: Activity },
    ...(user?.role === 'trainer' ? [{ name: 'Coach', href: '/coach', icon: Users }] : []),
    ...(user?.role === 'admin' ? [{ name: 'Admin', href: '/admin', icon: Users }] : []),
    { name: 'Profile', href: '/profile', icon: UserRound },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 transition-colors">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-pink-600 dark:text-pink-500 tracking-wider transition-colors">GymBro</h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive 
                    ? 'bg-pink-100 text-pink-700 dark:bg-pink-600 dark:text-white font-semibold' 
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon size={20} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Mobile Bottom Bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 z-50 transition-colors">
        <nav className="flex items-center justify-around p-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive 
                    ? 'text-pink-700 dark:text-pink-500 bg-pink-100 dark:bg-pink-500/10 font-semibold' 
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                <Icon size={24} />
                <span className="text-[10px] mt-1">{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}