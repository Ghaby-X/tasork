'use client';

import { useState } from 'react';
import Link from 'next/link';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    assignedTo: string;
    dueDate: string;
    assigneeName?: string;
  };
}

export default function TaskCard({ task }: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const statusColors = {
    healthy: 'bg-green-100 text-green-800',
    at_risk: 'bg-yellow-100 text-yellow-800',
    behind: 'bg-red-100 text-red-800',
    completed: 'bg-blue-100 text-blue-800',
    // Default for any other status
    default: 'bg-gray-100 text-gray-800'
  };

  const getStatusColor = (status: string) => {
    return statusColors[status as keyof typeof statusColors] || statusColors.default;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy': return 'Healthy';
      case 'at_risk': return 'At Risk';
      case 'behind': return 'Behind';
      case 'completed': return 'Completed';
      default: return status;
    }
  };

  const formattedDate = new Date(task.dueDate).toLocaleDateString();
  const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-primary">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{task.title}</h3>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
          {getStatusLabel(task.status)}
        </span>
      </div>
      
      <div className="mt-2">
        {task.description ? (
          <>
            {isExpanded ? (
              <p className="text-gray-600">{task.description}</p>
            ) : (
              <p className="text-gray-600 truncate">{task.description}</p>
            )}
            {task.description.length > 100 && (
              <button 
                className="text-primary text-sm mt-1"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </>
        ) : (
          <p className="text-gray-500 italic">No description</p>
        )}
      </div>
      
      <div className="mt-3 flex justify-between items-center text-sm">
        <div>
          <span className="text-gray-500">Assigned to: </span>
          <span>{task.assigneeName || 'Unassigned'}</span>
        </div>
        <div className={isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}>
          Due: {formattedDate}
          {isOverdue && ' (Overdue)'}
        </div>
      </div>
      
      <div className="mt-3 flex justify-end">
        <Link 
          href={`/tasks/${task.id}`}
          className="px-3 py-1 bg-primary text-white rounded-md text-sm hover:bg-blue-700"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}