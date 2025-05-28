import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the id_token cookie
  const idToken = request.cookies.get('id_token');

  // Check if the path is dashboard
  if (request.nextUrl.pathname === '/dashboard') {
    // If no id_token cookie exists, redirect to login
    if (!idToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run only on the dashboard path
export const config = {
  matcher: ['/dashboard'],
};