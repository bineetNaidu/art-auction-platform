export interface SessionPayload {
  userId?: string;
  id?: string;
  role?: 'buyer' | 'seller' | 'admin';
}

/**
 * Extracts the raw session token from client-side cookies
 */
export function getClientToken(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  const match = document.cookie.match(/(^| )aura_session_token=([^;]+)/);
  return match ? match[2] : undefined;
}

/**
 * Decodes the session token payload securely on the browser thread
 */
export function getClientSession(): SessionPayload | null {
  const token = getClientToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;
    return JSON.parse(window.atob(payloadBase64));
  } catch (error) {
    console.error('Failed to process session token payload:', error);
    return null;
  }
}
