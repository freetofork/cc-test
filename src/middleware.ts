import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const res = NextResponse.next();

  // CORS Headers for API routes
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Determine origin
    const origin = request.headers.get('origin');
    
    // In production, restrict this to your actual domain.
    // For local dev, allow localhost.
    const allowedOrigins = ['http://localhost:3000', 'https://contextcraft.com'];
    
    if (origin && allowedOrigins.includes(origin)) {
      res.headers.set('Access-Control-Allow-Origin', origin);
    } else if (process.env.NODE_ENV === 'development') {
      res.headers.set('Access-Control-Allow-Origin', '*'); // Allow all in dev
    }
    
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, apikey');
    
    // Handle OPTIONS request preflight
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { headers: res.headers, status: 200 });
    }
  }

  // To truly protect /dashboard at the edge, we would need Supabase SSR configured to use cookies.
  // Since we are using standard LocalStorage auth for the prototype, the /dashboard.html file 
  // handles its own redirect if no session exists.
  
  return res;
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard',
    '/dashboard.html',
  ],
};
