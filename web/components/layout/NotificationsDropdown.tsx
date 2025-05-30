'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { getNotifications } from '@/lib/api';

interface Notification {
  notificationId: string;
  message: string;
  time: string;
}

export default function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const data = await getNotifications();
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    try {
      return new Date(timeString).toLocaleString();
    } catch (e) {
      return timeString;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <Bell className="w-6 h-6 text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
            {notifications.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-auto left-0 mt-2 w-80 bg-white rounded-md shadow-lg z-10">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium">Notifications</h3>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification.notificationId} 
                  className="p-3 border-b border-gray-100 hover:bg-gray-50 overflow-hidden"
                >
                  <p className="text-sm break-words whitespace-normal overflow-visible">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTime(notification.time)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}