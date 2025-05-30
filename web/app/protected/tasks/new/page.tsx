'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createTask, getUsers } from '@/lib/api';
import { useTaskStore } from '@/lib/store';
import { X, ChevronDown, Check } from 'lucide-react';

interface User {
  userId: string;
  username: string;
  email: string;
}

interface Assignee {
  userId: string;
  username: string;
  email: string;
}

export default function NewTaskPage() {
  const router = useRouter();
  const { addTask } = useTaskStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  
  const [taskTitle, setTaskTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('healthy');
  const [deadline, setDeadline] = useState('');
  
  // Assignee fields
  const [assignees, setAssignees] = useState<Assignee[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch users on component mount
  useEffect(() => {
    async function fetchUsers() {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
      } finally {
        setIsLoadingUsers(false);
      }
    }

    fetchUsers();
  }, []);

  const toggleAssignee = (user: User) => {
    const isSelected = assignees.some(a => a.userId === user.userId);
    
    if (isSelected) {
      // Remove user from assignees
      setAssignees(assignees.filter(a => a.userId !== user.userId));
    } else {
      // Add user to assignees
      setAssignees([...assignees, {
        userId: user.userId,
        username: user.username,
        email: user.email
      }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!taskTitle || !deadline) {
      setError('Task title and deadline are required');
      setIsLoading(false);
      return;
    }

    try {
      const taskData = {
        taskTitle,
        description,
        status,
        deadline,
        assignee: assignees
      };

      await createTask(taskData);
      
      // Show success and navigate back to tasks list
      router.push('/protected/tasks');
    } catch (err: any) {
      console.error('Error creating task:', err);
      setError(err.response?.data?.message || 'Failed to create task. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Create New Task</h1>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title *
            </label>
            <input
              id="taskTitle"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="healthy">Healthy</option>
              <option value="at_risk">At Risk</option>
              <option value="behind">Behind</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline *
            </label>
            <input
              id="deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div className="border-t border-gray-200 pt-6">
            <h2 className="text-lg font-medium mb-4">Assignees</h2>
            
            {/* Selected assignees list */}
            {assignees.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-sm text-gray-500 mb-2">Selected assignees:</p>
                {assignees.map((assignee, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <div>
                      <p className="font-medium">{assignee.username}</p>
                      <p className="text-sm text-gray-500">{assignee.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleAssignee(assignee)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {/* Dropdown checkbox for users */}
            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Assignees
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoadingUsers}
              >
                <span>
                  {assignees.length === 0 
                    ? 'Select users' 
                    : `${assignees.length} user${assignees.length > 1 ? 's' : ''} selected`}
                </span>
                <ChevronDown size={16} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {isLoadingUsers ? (
                    <div className="p-3 text-center text-gray-500">Loading users...</div>
                  ) : users.length === 0 ? (
                    <div className="p-3 text-center text-gray-500">No users found</div>
                  ) : (
                    users.map(user => {
                      const isSelected = assignees.some(a => a.userId === user.userId);
                      return (
                        <div 
                          key={user.userId}
                          onClick={() => toggleAssignee(user)}
                          className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        >
                          <div className={`w-5 h-5 border rounded mr-2 flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-gray-300'}`}>
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                          <div>
                            <p className="font-medium">{user.username}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}