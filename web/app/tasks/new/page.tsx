'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useTaskStore } from '@/lib/store';
import { createTask, getUsers } from '@/lib/api';
import Navbar from '@/components/Navbar';

export default function NewTaskPage() {
  const router = useRouter();
  const { addTask } = useTaskStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedUsers, setAssignedUsers] = useState<string[]>([]);
  const [dueDate, setDueDate] = useState('');
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        setIsLoading(true);
        const usersData = await getUsers();
        // Filter to only team members (non-admin users)
        const teamMembersData = usersData.filter((u: any) => u.role === 'team_member' || u.role === 'member');
        setTeamMembers(teamMembersData);
      } catch (err) {
        setError('Failed to load team members');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleAssignedUser = (userId: string) => {
    setAssignedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !description || assignedUsers.length === 0 || !dueDate) {
      setError('Please fill in all required fields');
      return;
    }
    
    setIsSaving(true);
    setError('');
    
    try {
      if (title.length < 3 || description.length < 3) {
        setError('Description and title should be greater than 3');
        setIsSaving(false);
        return;
      }
      
      // Format assignees according to API requirements
      const assignee = assignedUsers.map(userId => {
        const member = teamMembers.find(m => m.id === userId);
        return {
          userId: `${userId}`,
          username: member?.name || '',
          email: member?.email || ''
        };
      });
      console.log(assignee)
      
      const newTask = await createTask({
        taskTitle: title,
        description,
        status: 'pending',
        deadline: dueDate,
        assignee
      });
      
      addTask(newTask);
      router.push('/tasks');
    } catch (err) {
      setError('Failed to create task');
      console.error(err);
    }
    finally {
      setIsSaving(false);
    }
  };

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
          <h1 className="text-2xl font-bold mb-6">Create New Task</h1>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assign To *
              </label>
              {isLoading ? (
                <div className="text-sm text-gray-500">Loading team members...</div>
              ) : (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-left flex justify-between items-center"
                  >
                    <span>
                      {assignedUsers.length === 0 
                        ? 'Select team members' 
                        : `${assignedUsers.length} member${assignedUsers.length !== 1 ? 's' : ''} selected`}
                    </span>
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                  
                  {dropdownOpen && (
                    <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300 max-h-60 overflow-y-auto">
                      {teamMembers.length === 0 ? (
                        <div className="p-3 text-sm text-gray-500">No team members available</div>
                      ) : (
                        <div className="py-1">
                          {teamMembers.map((member) => (
                            <div 
                              key={member.id} 
                              className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                              onClick={() => toggleAssignedUser(member.id)}
                            >
                              <input
                                type="checkbox"
                                checked={assignedUsers.includes(member.id)}
                                // onChange={() => {}} // Handled by the parent div's onClick
                                className="h-4 w-4 text-primary border-gray-300 rounded"
                              />
                              <label className="ml-2 block text-sm text-gray-900">
                                {member.name} ({member.email || 'No email'})
                              </label>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
              {assignedUsers.length === 0 && (
                <p className="mt-1 text-sm text-red-500">Please select at least one team member</p>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date *
              </label>
              <input
                type="date"
                value={dueDate.split('T')[0]}
                onChange={(e) => setDueDate(new Date(e.target.value).toISOString())}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => router.push('/tasks')}
                className="px-4 py-2 bg-gray-200 rounded-md mr-2"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                disabled={isSaving}
              >
                {isSaving ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}