import { Role, ROLES } from '../api/models';

export interface JwtPayload {
  sub?: string;
  role?: Role;
  exp?: number;
}

/** Reads the claims of a JWT without verifying it; the server remains the authority. */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const segment = token.split('.')[1];
  if (!segment) {
    return null;
  }
  try {
    const base64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)) as JwtPayload;
    return payload.role && ROLES.includes(payload.role) ? payload : { ...payload, role: undefined };
  } catch {
    return null;
  }
}
