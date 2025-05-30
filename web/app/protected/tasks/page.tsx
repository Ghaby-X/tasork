'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { getTasks } from '@/lib/api';
import { useTaskStore, Task } from '@/lib/store';
import RoleBasedAccess from '@/components/RoleBasedAccess';

export default function TasksPage() {
  const { tasks, setTasks, isLoading, setLoading, error, setError } = useTaskStore();
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchTasks() {
      setLoading(true);
      try {
        const data = await getTasks();
        setTasks(data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
        setError('Failed to load tasks');
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [setTasks, setLoading, setError]);

  const filteredTasks = tasks ? tasks.filter(task => 
    (task.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (task.description?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  ) : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'at_risk':
        return 'bg-yellow-100 text-yellow-800';
      case 'behind':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tasks</h1>
        <Link
          href="/protected/tasks/new"
          className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          New Task
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search tasks..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading tasks...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-lg shadow">
          <p className="text-gray-500">No tasks found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <Link href={`/protected/tasks/${task.id}`} key={task.id}>
              <div className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-lg">{task.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(task.status || 'pending')}`}>
                    {(task.status || 'pending').replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {task.description || 'No description'}
                </p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                  <span>{task.assigneeName || 'Unassigned'}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}