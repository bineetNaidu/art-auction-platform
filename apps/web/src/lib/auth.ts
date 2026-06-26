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

/**
 * The Logout Function
 */
export function logout() {
  if (typeof window === 'undefined') return false;
  // Evict session token from client domain memory context
  document.cookie = 'aura_session_token=; path=/; max-age=0; SameSite=Strict; Secure';

  return true;
}

/**
 * Universally decodes JWT payload segments across both Server and Client runtimes
 */
export function decodeToken(token: string): SessionPayload | null {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return null;

    const jsonString =
      typeof window === 'undefined'
        ? Buffer.from(payloadBase64, 'base64').toString('utf-8')
        : window.atob(payloadBase64);

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Cryptographic extraction failure:', error);
    return null;
  }
}
