'use client';

import { useState } from 'react';
import { inviteUser } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function InviteUserPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Email is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      
      // Log the data being sent
      console.log('Sending invite data:', { email, role });
      
      await inviteUser(email, role);
      
      setSuccess('Invitation sent successfully!');
      setEmail('');
      
      // Redirect after a short delay with a refresh flag
      setTimeout(() => {
        router.push('/protected/users?refresh=' + new Date().getTime());
      }, 2000);
      
    } catch (err: any) {
      console.error('Invite error details:', err);
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4">
      <div className="mb-6">
        <Link 
          href="/protected/users" 
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Users
        </Link>
      </div>
      
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Invite User</h1>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="user@example.com"
              required
            />
          </div>
          
          <div className="mb-6">
            <label htmlFor="role" className="block text-gray-700 font-medium mb-2">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
          </button>
        </form>
      </div>
    </div>
  );
}