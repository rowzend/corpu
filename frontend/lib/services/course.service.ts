/**
 * Course Service
 * Handle semua operasi terkait kursus
 */

import { api } from '../api';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  duration: string;
  instructor: string;
  thumbnail?: string;
  participants: number;
  rating?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CourseFilter {
  category?: string;
  level?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const courseService = {
  /**
   * Get all courses dengan filter
   */
  async getCourses(filter?: CourseFilter): Promise<{ data: Course[]; total: number }> {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.level) params.append('level', filter.level);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const queryString = params.toString();
    return api.get(`/courses${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get course by ID
   */
  async getCourseById(id: string): Promise<Course> {
    return api.get(`/courses/${id}`);
  },

  /**
   * Get latest courses
   */
  async getLatestCourses(limit: number = 4): Promise<Course[]> {
    return api.get(`/courses/latest?limit=${limit}`);
  },

  /**
   * Get popular courses
   */
  async getPopularCourses(limit: number = 4): Promise<Course[]> {
    return api.get(`/courses/popular?limit=${limit}`);
  },

  /**
   * Enroll to course
   */
  async enrollCourse(courseId: string): Promise<any> {
    return api.post(`/courses/${courseId}/enroll`);
  },

  /**
   * Get user enrolled courses
   */
  async getEnrolledCourses(): Promise<Course[]> {
    return api.get('/courses/enrolled');
  },

  /**
   * Get course progress
   */
  async getCourseProgress(courseId: string): Promise<any> {
    return api.get(`/courses/${courseId}/progress`);
  },

  /**
   * Update course progress
   */
  async updateProgress(courseId: string, lessonId: string, completed: boolean): Promise<any> {
    return api.post(`/courses/${courseId}/progress`, { lessonId, completed });
  },
};
