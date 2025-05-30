'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { parseCookies } from 'nookies';
import { jwtDecode } from 'jwt-decode'

// Define a custom interface for the JWT payload
interface CustomJwtPayload {
  email?: string;
  sub?: string;
  'custom:tenantId'?: string;
  'custom:tenantName'?: string;
  [key: string]: any;
}

export default function AuthResolvePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function resolveAuth() {
      try {
        // Get the code from query params
        const code = searchParams.get('code');
        
        if (!code) {
          setError('No authorization code provided');
          setIsLoading(false);
          return;
        }

        // Make API call with the code
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/auth/token?code=${code}`, {
          method: 'GET',
          credentials: 'include', // Important: include cookies in the request
        });

        if (!response.ok) {
          throw new Error('Failed to exchange code for tokens');
        }

        // The API should set cookies in the response
        // Parse cookies to check for tenantId
        const cookies = parseCookies();
        const id_token_raw = cookies['id_token'];
        const id_token = id_token_raw ? jwtDecode<CustomJwtPayload>((id_token_raw)) : null;

        if (!id_token || !id_token.email || !id_token.sub) {
            throw new Error('Invalid code')
        }

        // Check if user has a tenant ID
        if (id_token['custom:tenantId'] && id_token['custom:tenantName']) {
            router.push('/protected/tasks');
            return
        } else {
          router.push('/auth/register');
          return
        }
        
      } catch (err) {
        console.error('Authentication error:', err);
        setError('Authentication failed. Please try again.');
        // Redirect to login after a delay
        setTimeout(() => router.push('/'), 3000);
      } finally {
        setIsLoading(false);
      }
    }

    resolveAuth();
  }, [router, searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4 max-w-md">
            <p className="text-red-700">{error}</p>
            <p className="text-gray-600 mt-2">Redirecting to login page...</p>
          </div>
        </div>
      </div>
    );
  }

  // This will only show briefly before redirect happens
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}