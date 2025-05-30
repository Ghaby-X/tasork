'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Settings, 
  LogOut,
  Users
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import NotificationsDropdown from './NotificationsDropdown';

export default function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  
  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (response.ok) {
        // Clear local state
        logout();
        // Redirect to home
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h1 className="text-xl font-bold text-primary">Tasork</h1>
        <NotificationsDropdown />
      </div>
      
      <nav className="flex-1 p-4 space-y-1">
        <Link
          href="/protected/dashboard"
          className={`flex items-center px-3 py-2 rounded-md ${
            isActive('/protected/dashboard')
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mr-3" />
          Dashboard
        </Link>
        
        <Link
          href="/protected/tasks"
          className={`flex items-center px-3 py-2 rounded-md ${
            isActive('/protected/tasks')
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <CheckSquare className="w-5 h-5 mr-3" />
          Tasks
        </Link>
        
        <Link
          href="/protected/users"
          className={`flex items-center px-3 py-2 rounded-md ${
            isActive('/protected/users')
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Users className="w-5 h-5 mr-3" />
          Users
        </Link>
        
        <Link
          href="/protected/settings"
          className={`flex items-center px-3 py-2 rounded-md ${
            isActive('/protected/settings')
              ? 'bg-primary text-white'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <Settings className="w-5 h-5 mr-3" />
          Settings
        </Link>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2 text-gray-700 rounded-md hover:bg-gray-100"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}