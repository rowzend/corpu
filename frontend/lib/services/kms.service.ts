/**
 * KMS (Knowledge Management System) Service
 * Handle semua operasi terkait knowledge management
 */

import { api } from '../api';

export interface KnowledgeItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: string;
  author: string;
  date: string;
  views: number;
  likes: number;
  comments: number;
  content?: string;
  tags?: string[];
}

export interface KMSFilter {
  category?: string;
  type?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const kmsService = {
  /**
   * Get all knowledge items dengan filter
   */
  async getKnowledgeItems(filter?: KMSFilter): Promise<{ data: KnowledgeItem[]; total: number }> {
    const params = new URLSearchParams();
    if (filter?.category) params.append('category', filter.category);
    if (filter?.type) params.append('type', filter.type);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.page) params.append('page', filter.page.toString());
    if (filter?.limit) params.append('limit', filter.limit.toString());

    const queryString = params.toString();
    return api.get(`/kms${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get knowledge item by ID
   */
  async getKnowledgeById(id: string): Promise<KnowledgeItem> {
    return api.get(`/kms/${id}`);
  },

  /**
   * Create new knowledge item
   */
  async createKnowledge(data: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    return api.post('/kms', data);
  },

  /**
   * Update knowledge item
   */
  async updateKnowledge(id: string, data: Partial<KnowledgeItem>): Promise<KnowledgeItem> {
    return api.put(`/kms/${id}`, data);
  },

  /**
   * Delete knowledge item
   */
  async deleteKnowledge(id: string): Promise<any> {
    return api.delete(`/kms/${id}`);
  },

  /**
   * Like knowledge item
   */
  async likeKnowledge(id: string): Promise<any> {
    return api.post(`/kms/${id}/like`);
  },

  /**
   * Add comment to knowledge item
   */
  async addComment(id: string, comment: string): Promise<any> {
    return api.post(`/kms/${id}/comments`, { comment });
  },

  /**
   * Get comments for knowledge item
   */
  async getComments(id: string): Promise<any[]> {
    return api.get(`/kms/${id}/comments`);
  },
};
