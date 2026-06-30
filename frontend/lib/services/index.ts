/**
 * Services Index
 * Export all services from a single entry point
 */

export { authService } from './auth.service';
export type { LoginCredentials, LoginResponse } from './auth.service';
export { type AuthUser } from './auth.service';
export * from './dashboard.service';
export { userService } from './user.service';
export type {
  User,
  CreateUserData,
  UpdateUserData,
  UserListParams,
  UserListResponse,
} from './user.service';
export * from './role.service';
export * from './permission.service';
export * from './profile.service';
export { newsService } from './news.service';
export type { NewsItem, NewsListResponse } from './news.service';
export { simpegService } from './simpeg.service';
export type { PegawaiItem } from './simpeg.service';