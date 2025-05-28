'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/lib/store';
import { getTasks } from '@/lib/api';
import Navbar from '@/components/Navbar';
import TaskCard from '@/components/TaskCard';
import DashboardMetrics from '@/components/DashboardMetrics';
import { useAuthGuard } from '@/hooks/useAuthGuard';

export default function Dashboard() {
  const router = useRouter();
  const { tasks, setTasks } = useTaskStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const tokenUser = useAuthGuard()

  console.log(tokenUser)

  // Calculate metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress').length;
  const overdueTasks = tasks.filter(task => 
    new Date(task.dueDate) < new Date() && task.status !== 'completed'
  ).length;

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        // For demo purposes, we'll fetch all tasks
        const tasksData = await getTasks();
        setTasks(tasksData);
      } catch (err) {
        setError('Failed to load tasks');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, [setTasks]);

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <div className="space-x-2">
            <button
              onClick={() => router.push('/users/invite')}
              className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-gray-700"
            >
              Invite Team Member
            </button>
            <button
              onClick={() => router.push('/tasks/new')}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700"
            >
              Create New Task
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading tasks...</div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <>
            <DashboardMetrics 
              totalTasks={totalTasks}
              completedTasks={completedTasks}
              pendingTasks={pendingTasks}
              inProgressTasks={inProgressTasks}
              overdueTasks={overdueTasks}
            />
            
            <div>
              <h2 className="text-xl font-semibold mb-4">Recent Tasks</h2>
              {tasks.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  No tasks found. Create a new task to get started.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tasks.slice(0, 6).map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              )}
              
              {tasks.length > 6 && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => router.push('/tasks')}
                    className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    View All Tasks
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}