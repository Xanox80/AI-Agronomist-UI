import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from './api-client';
import { toHttpParams } from './api-base-url';
import {
  AuditEntryDto, AuditLogQuery, CreateUserRequest, FarmDto, LoginRequest, LoginResponse, Page, PageQuery,
  RefreshRequest, RefreshResponse, UpdateFarmRequest, UpdateProfileRequest, UpdateUserRequest, UserDto,
} from './models';

@Injectable({ providedIn: 'root' })
export class AuthApi extends ApiClient {
  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(this.url('/auth/login'), body);
  }

  refresh(body: RefreshRequest): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(this.url('/auth/refresh'), body);
  }

  logout(body: RefreshRequest): Observable<void> {
    return this.http.post<void>(this.url('/auth/logout'), body);
  }

  me(): Observable<UserDto> {
    return this.http.get<UserDto>(this.url('/auth/me'));
  }

  updateMe(body: UpdateProfileRequest): Observable<UserDto> {
    return this.http.patch<UserDto>(this.url('/auth/me'), body);
  }

  listUsers(query: PageQuery = {}): Observable<Page<UserDto>> {
    return this.http.get<Page<UserDto>>(this.url('/users'), { params: toHttpParams(query) });
  }

  createUser(body: CreateUserRequest): Observable<UserDto> {
    return this.http.post<UserDto>(this.url('/users'), body);
  }

  updateUser(id: string, body: UpdateUserRequest): Observable<UserDto> {
    return this.http.patch<UserDto>(this.url(`/users/${id}`), body);
  }

  auditLog(query: AuditLogQuery = {}): Observable<Page<AuditEntryDto>> {
    return this.http.get<Page<AuditEntryDto>>(this.url('/audit-log'), { params: toHttpParams(query) });
  }

  getFarm(): Observable<FarmDto> {
    return this.http.get<FarmDto>(this.url('/farms/me'));
  }

  updateFarm(body: UpdateFarmRequest): Observable<FarmDto> {
    return this.http.patch<FarmDto>(this.url('/farms/me'), body);
  }
}
