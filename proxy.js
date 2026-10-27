import authProxy from './proxy/cookie';

// Keeps the shared AUTH-T cookie fresh on every request (same behaviour as the main app)..
export default function middleware(req) {
  return authProxy(req);
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|images|icons|fonts).*)'],
};
