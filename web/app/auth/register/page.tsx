'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [tenantName, setTenantName] = useState('')
  const [username, setUsername] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (!tenantName || !username) {
      setError('Organization name and username are required')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/auth/registerTenant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          tenantName,
          username
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Registration failed')
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/protected/tasks')
      }, 2000)
    } catch (err: any) {
      console.error('Registration error:', err)
      setError(err.message || 'Failed to register. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete your registration
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Set up your organization to get started
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4">
            <p className="text-green-700">Registration successful! Redirecting...</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="organization-name" className="sr-only">Organization Name</label>
              <input
                id="organization-name"
                name="organization"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Organization Name"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                disabled={isLoading || success}
              />
            </div>
            <div>
              <label htmlFor="username" className="sr-only">Your Name</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading || success}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || success}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:bg-gray-400"
            >
              {isLoading ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
          
          <div className="text-sm text-center">
            <Link href="/" className="font-medium text-primary hover:text-blue-500">
              Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}