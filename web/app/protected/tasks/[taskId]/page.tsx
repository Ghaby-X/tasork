'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getTask, updateTask, updateTaskStatus, getUsers } from '@/lib/api';
import { ArrowLeft, Clock, Calendar, User, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface TaskHistory {
  status: string;
  timestamp: string;
  userId: string;
  username?: string;
}

export default function TaskDetailPage({ params }: { params: { taskId: string } }) {
  const router = useRouter();
  const { taskId } = params;
  
  const [task, setTask] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [taskData, usersData] = await Promise.all([
          getTask(taskId),
          getUsers()
        ]);
        
        setTask(taskData);
        setUsers(usersData);
        setStatus(taskData.status || 'pending');
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load task details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [taskId]);

  const [updateDescription, setUpdateDescription] = useState('');
  
  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (status === task.status) {
      return; // No change
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      // Store current task data before update
      const currentTask = {...task};
      
      // Update the status
      await updateTaskStatus(taskId, status, updateDescription);
      
      // Force reload the page to get fresh data
      router.refresh();
      window.location.reload();
      
      setSuccessMessage('Status updated successfully');
      setUpdateDescription('');
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800';
      case 'behind': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => router.back()} 
            className="mt-2 text-blue-600 hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center">
          <p>Task not found</p>
          <Link href="/protected/tasks" className="mt-2 text-blue-600 hover:underline">
            Back to tasks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Link 
          href="/protected/tasks" 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tasks
        </Link>
      </div>

      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {successMessage}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-6">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(task.status || 'pending')}`}>
            {(task.status || 'pending').replace('_', ' ')}
          </span>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Description</h2>
          <p className="text-gray-700">{task.description || 'No description provided'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Due Date</p>
              <p className="font-medium">{formatDate(task.dueDate)}</p>
            </div>
          </div>
          
          <div className="flex items-center">
            <Clock className="w-5 h-5 text-gray-500 mr-2" />
            <div>
              <p className="text-sm text-gray-500">Created At</p>
              <p className="font-medium">{formatDate(task.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-lg font-medium mb-2">Assignees</h2>
          {task.assignee && task.assignee.length > 0 ? (
            <div className="space-y-2">
              {task.assignee.map((assignee: any, index: number) => (
                <div key={index} className="flex items-center bg-gray-50 p-3 rounded-md">
                  <User className="w-5 h-5 text-gray-500 mr-2" />
                  <div>
                    <p className="font-medium">{assignee.username}</p>
                    <p className="text-sm text-gray-500">{assignee.email}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No assignees</p>
          )}
        </div>

        <form onSubmit={handleStatusUpdate} className="mb-6">
          <h2 className="text-lg font-medium mb-2">Update Status</h2>
          <div className="space-y-4">
            <div>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="healthy">Healthy</option>
                <option value="in_progress">In Progress</option>
                <option value="at_risk">At Risk</option>
                <option value="behind">Behind</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <div>
              <textarea
                value={updateDescription}
                onChange={(e) => setUpdateDescription(e.target.value)}
                placeholder="Add a description for this update (optional)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                rows={2}
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || status === task.status}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </form>

        <div>
          <h2 className="text-lg font-medium mb-2">Task History</h2>
          {task.history && task.history.length > 0 ? (
            <div className="border rounded-md divide-y">
              {task.history.map((entry: TaskHistory, index: number) => (
                <div key={index} className="p-3 flex items-start">
                  <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${getStatusColor(entry.status)}`}></div>
                  <div>
                    <p>
                      Status changed to <span className="font-medium">{entry.status.replace('_', ' ')}</span>
                    </p>
                    {entry.description && (
                      <p className="text-sm text-gray-700 mt-1">
                        "{entry.description}"
                      </p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      {entry.username || 'Unknown user'} - {formatDateTime(entry.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No history available</p>
          )}
        </div>
      </div>
    </div>
  );
}