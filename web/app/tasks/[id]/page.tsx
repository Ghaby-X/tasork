'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/lib/store';
import { getTask, updateTask } from '@/lib/api';
import Navbar from '@/components/Navbar';
import Link from 'next/link';

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentTask, setCurrentTask } = useTaskStore();
  
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchTask = async () => {
      try {
        const taskData = await getTask(params.id);
        setCurrentTask(taskData);
        setStatus(taskData.status);
      } catch (err) {
        setError('Failed to load task details');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTask();
  }, [params.id, setCurrentTask]);

  const handleUpdateStatus = async () => {
    if (!currentTask) return;
    
    setIsSaving(true);
    setError('');
    setSuccessMessage('');
    
    try {
      await updateTask(currentTask.id, { status });
      setSuccessMessage('Task status updated successfully');
      
      // Update the current task in the store
      setCurrentTask({ ...currentTask, status });
    } catch (err) {
      setError('Failed to update task status');
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-10">Loading task details...</div>
        </main>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div>
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">Task not found</p>
          </div>
          <button
            onClick={() => router.push('/tasks')}
            className="mt-4 px-4 py-2 bg-gray-200 rounded-md"
          >
            Back to Tasks
          </button>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <button
            onClick={() => router.push('/tasks')}
            className="text-primary hover:underline"
          >
            ← Back to Tasks
          </button>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h1 className="text-2xl font-bold">{currentTask.title}</h1>
            <Link 
              href={`/tasks/${currentTask.id}/history`}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
            >
              View History
            </Link>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
              <p className="text-green-700">{successMessage}</p>
            </div>
          )}
          
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-2">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{currentTask.description || 'No description provided.'}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Details</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="mb-2">
                  <span className="font-medium">Assigned to: </span>
                  <span>{currentTask.assigneeName || 'Unassigned'}</span>
                </div>
                <div className="mb-2">
                  <span className="font-medium">Due date: </span>
                  <span>{new Date(currentTask.dueDate).toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium">Created: </span>
                  <span>{new Date(currentTask.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h2 className="text-lg font-semibold mb-2">Update Status</h2>
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={isSaving}
                  >
                    <option value="healthy">Healthy</option>
                    <option value="at_risk">At Risk</option>
                    <option value="behind">Behind</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason for Update *
                  </label>
                  <textarea
                    id="updateDescription"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows={3}
                    placeholder="Please explain why you're updating this task"
                    disabled={isSaving}
                    required
                  />
                </div>
                <button
                  onClick={() => {
                    const description = (document.getElementById('updateDescription') as HTMLTextAreaElement).value;
                    if (!description) {
                      setError('Please provide a reason for the update');
                      return;
                    }
                    handleUpdateStatus();
                  }}
                  disabled={isSaving || status === currentTask.status}
                  className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}