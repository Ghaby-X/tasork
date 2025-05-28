import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Task Management System',
  description: 'Task Management System for field teams',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
}