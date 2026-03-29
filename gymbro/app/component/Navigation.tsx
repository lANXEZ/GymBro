'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Dumbbell, Activity, Users, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuth();

  const links = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Workouts', href: '/workouts', icon: Dumbbell },
    { name: 'Progress', href: '/progress', icon: Activity },
    ...(user?.role === 'trainer' ? [{ name: 'Coach', href: '/coach', icon: Users }] : []),
    { name: 'Profile', href: '/profile', icon: UserRound },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex w-64 flex-col fixed inset-y-0 bg-zinc-900 border-r border-zinc-800 text-zinc-100">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-pink-500 tracking-wider">GymBro</h1>
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
                  isActive ? 'bg-pink-600 font-semibold' : 'hover:bg-zinc-800'
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
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-zinc-900 border-t border-zinc-800 z-50">
        <nav className="flex items-center justify-around p-3">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center p-2 rounded-lg 
                  ${isActive ? 'text-pink-500' : 'text-zinc-400 hover:text-zinc-200'}
                `}
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