'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
// import { deleteCookie } from 'cookies-next';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [notificationCount, setNotificationCount] = useState(3); // Example count

  const handleLogout = () => {
    // deleteCookie('id_token');
    router.push('/');
  };

  return (
    <nav className="bg-secondary text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold">Tasork</span>
            </div>
            <div className="ml-10 flex items-center space-x-4">
              <Link 
                href="/dashboard" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/dashboard' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Dashboard
              </Link>
              <Link 
                href="/tasks" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname.startsWith('/tasks') ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Tasks
              </Link>
              <Link 
                href="/users" 
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  pathname === '/users' ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                Team Members
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/notifications"
              className="relative px-2 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notificationCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                  {notificationCount}
                </span>
              )}
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-2 rounded-md text-sm font-medium bg-red-600 text-white hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}