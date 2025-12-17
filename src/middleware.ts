import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // /competitions/* → /tasks/* 리다이렉트
  if (pathname.startsWith('/competitions')) {
    const newPathname = pathname.replace('/competitions', '/tasks');
    const url = request.nextUrl.clone();
    url.pathname = newPathname;
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/competitions/:path*'],
};
