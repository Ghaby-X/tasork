'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getTaskHistory, getTask } from '@/lib/api';
import Navbar from '@/components/Navbar';

interface HistoryItem {
  id: string;
  taskId: string;
  status: string;
  updateDescription: string;
  updatedAt: string;
  updatedBy: string;
}

export default function TaskHistoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [taskTitle, setTaskTitle] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch task details to get the title
        const taskData = await getTask(params.id);
        setTaskTitle(taskData.title);
        
        // Fetch task history
        const historyData = await getTaskHistory(params.id);
        setHistory(historyData);
      } catch (err) {
        setError('Failed to load task history');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'at_risk': return 'bg-yellow-100 text-yellow-800';
      case 'behind': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <button
            onClick={() => router.push(`/tasks/${params.id}`)}
            className="text-primary hover:underline"
          >
            ← Back to Task
          </button>
        </div>

        <h1 className="text-2xl font-bold mb-2">Task History</h1>
        <h2 className="text-lg text-gray-600 mb-6">{taskTitle}</h2>

        {isLoading ? (
          <div className="text-center py-10">Loading history...</div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No history found for this task.
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
            
            {/* Timeline items */}
            <div className="space-y-6 ml-8">
              {history.map((item) => (
                <div key={item.id} className="relative">
                  {/* Timeline dot */}
                  <div className="absolute -left-10 mt-1.5 w-4 h-4 rounded-full border-2 border-white bg-primary"></div>
                  
                  <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex items-center mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">
                        {formatDate(item.updatedAt)}
                      </span>
                    </div>
                    <p className="text-gray-800">{item.updateDescription}</p>
                    <p className="text-sm text-gray-500 mt-1">Updated by: {item.updatedBy}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}