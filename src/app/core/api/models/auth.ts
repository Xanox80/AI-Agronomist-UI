import { Role } from './enums';
import { PageQuery } from './common';

export interface UserDto {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  locale: string;
  geoCollectionEnabled: boolean;
  trustWeight: number;
  farmId: string;
  regionCode?: string;
}

export interface LoginRequest { email: string; password: string }
export interface LoginResponse { accessToken: string; refreshToken?: string; expiresIn: number; user: UserDto }
export interface RefreshRequest { refreshToken: string }
export interface RefreshResponse { accessToken: string; refreshToken: string; expiresIn: number }
export interface UpdateProfileRequest { displayName?: string; locale?: string; geoCollectionEnabled?: boolean }
export interface CreateUserRequest {
  email: string; password: string; displayName: string; role: Role; regionCode?: string;
}
export interface UpdateUserRequest {
  displayName?: string; role?: Role; isActive?: boolean; trustWeight?: number; password?: string;
}

export interface SafetyBuffers { water: number; apiary: number; settlement: number }
export interface FarmDto {
  id: string; name: string; regionCode: string; timezone: string; defaultSafetyBuffers: SafetyBuffers;
}
export type UpdateFarmRequest = Partial<Omit<FarmDto, 'id'>>;

export interface AuditEntryDto {
  id: string;
  userId?: string;
  action: string;
  entityType: string;
  entityId: string;
  meta: Record<string, unknown>;
  createdAt: string;
}
export interface AuditLogQuery extends PageQuery { userId?: string; entityType?: string; from?: string; to?: string }
