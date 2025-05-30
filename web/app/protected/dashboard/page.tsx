'use client';

import { useState, useEffect } from 'react';
import { getTasks } from '@/lib/api';
import { AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    atRisk: 0,
    upcoming: 0
  });

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setIsLoading(true);
        const data = await getTasks();
        setTasks(data || []);
        
        // Calculate stats
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        
        const completed = data.filter((task: any) => task.status === 'completed').length;
        const atRisk = data.filter((task: any) => 
          task.status === 'at_risk' || task.status === 'behind'
        ).length;
        const upcoming = data.filter((task: any) => {
          const dueDate = new Date(task.dueDate);
          return dueDate > now && dueDate <= nextWeek && task.status !== 'completed';
        }).length;
        
        setStats({
          total: data.length,
          completed,
          atRisk,
          upcoming
        });
      } catch (error) {
        console.error('Error fetching tasks:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Get tasks due in the next 7 days
  const upcomingTasks = tasks.filter(task => {
    if (task.status === 'completed') return false;
    
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    return dueDate >= now && dueDate <= nextWeek;
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  // Get at-risk tasks
  const atRiskTasks = tasks.filter(task => 
    task.status === 'at_risk' || task.status === 'behind'
  );

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      {isLoading ? (
        <div className="text-center py-10">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-gray-500 text-sm">Total Tasks</h2>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-gray-500 text-sm">Completed</h2>
              <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-gray-500 text-sm">At Risk</h2>
              <p className="text-2xl font-bold text-yellow-600">{stats.atRisk}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h2 className="text-gray-500 text-sm">Due This Week</h2>
              <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <Calendar className="text-blue-500 mr-2" />
                <h2 className="text-lg font-medium">Upcoming Deadlines</h2>
              </div>
              
              {upcomingTasks.length > 0 ? (
                <div className="space-y-3">
                  {upcomingTasks.slice(0, 5).map((task) => (
                    <Link href={`/protected/tasks/${task.id}`} key={task.id}>
                      <div className="border-l-4 border-blue-500 pl-3 py-2 hover:bg-gray-50">
                        <p className="font-medium">{task.title}</p>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                          <span>{task.assigneeName || 'Unassigned'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No upcoming deadlines</p>
              )}
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <div className="flex items-center mb-4">
                <AlertTriangle className="text-yellow-500 mr-2" />
                <h2 className="text-lg font-medium">At Risk Tasks</h2>
              </div>
              
              {atRiskTasks.length > 0 ? (
                <div className="space-y-3">
                  {atRiskTasks.slice(0, 5).map((task) => (
                    <Link href={`/protected/tasks/${task.id}`} key={task.id}>
                      <div className="border-l-4 border-yellow-500 pl-3 py-2 hover:bg-gray-50">
                        <p className="font-medium">{task.title}</p>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Status: {task.status.replace('_', ' ')}</span>
                          <span>{task.assigneeName || 'Unassigned'}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No tasks at risk</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}