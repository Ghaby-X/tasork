'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [loginUrl, setLoginUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user is already authenticated
    const token = document.cookie.includes('id_token=')
    if (token) {
      router.push('/protected/dashboard')
    }
    
    // Fetch login URL from backend
    async function fetchLoginUrl() {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/auth/login`)
        if (response.ok) {
          const data = await response.json()
          setLoginUrl(data.login_url)
        }
      } catch (error) {
        console.error('Failed to fetch login URL:', error)
      }
    }
    
    fetchLoginUrl()
  }, [router])

  const handleAuth = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsLoading(true)
    
    if (loginUrl) {
      router.push(loginUrl)
    } else {
      console.error('Login URL not available')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Tasork</h1>
          <div>
            <button 
              onClick={handleAuth}
              disabled={isLoading || !loginUrl}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? 'Loading...' : 'Sign In'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Manage your tasks</span>
              <span className="block text-primary">with ease</span>
            </h2>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Tasork helps teams organize, track, and manage their work efficiently.
            </p>
            <div className="mt-5 max-w-md mx-auto">
              <div className="rounded-md shadow">
                <button
                  onClick={handleAuth}
                  disabled={isLoading || !loginUrl}
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-blue-700 disabled:bg-gray-400 md:py-4 md:text-lg md:px-10"
                >
                  {isLoading ? 'Loading...' : 'Get Started'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Tasork. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}