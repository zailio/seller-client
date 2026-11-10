import config from '../utils/config';

// Re-sets the shared AUTH-T cookie on the outgoing response so it stays fresh.
// (Middleware cannot widen a cookie's scope; this only keeps it consistent.)
export function refreshAuthCookie(request, response) {
  const auth = request.cookies.get('AUTH-T');
  if (!auth) return response;

  const isProd = process.env.NODE_ENV === 'production';
  response.cookies.set({
    name: 'AUTH-T',
    value: auth.value,
    ...(isProd ? { domain: `.${config.domain}` } : {}),
    path: '/',
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    maxAge: 60 * 60 * 24 * 180,
  });
  return response;
}

