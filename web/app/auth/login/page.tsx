'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchLoginUrl() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/auth/login`)
        if (response.ok) {
          const loginUrl = await response.text()
          window.location.href = loginUrl
        } else {
          throw new Error('Failed to get login URL')
        }
      } catch (err) {
        console.error('Login error:', err)
        setError('Failed to connect to authentication service. Please try again.')
        setIsLoading(false)
      }
    }

    fetchLoginUrl()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="ml-2 text-gray-600">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  )
}