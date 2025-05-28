'use client';

import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const router = useRouter();
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-center text-3xl font-bold text-gray-900">
            Unauthorized Access
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            You need to be logged in to access this page
          </p>
        </div>
        
        <div className="mt-6">
          <button
            onClick={() => router.push('/')}
            className="w-full py-2 px-4 border border-transparent rounded-md text-white bg-primary hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
}