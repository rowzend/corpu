import { api } from '../api';

export interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  thumbnail?: string;
  status: 'draft' | 'published';
  views: number;
  published_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NewsListResponse {
  success: boolean;
  data: NewsItem[];
  total: number;
  pagination?: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

export const newsService = {
  async getNews(page: number = 1, limit: number = 10): Promise<NewsListResponse> {
    return api.get(`/news/?page=${page}&limit=${limit}`);
  },

  async getNewsBySlug(slug: string): Promise<{ success: boolean; data: NewsItem }> {
    return api.get(`/news/${slug}/`);
  },

  async getLatestNews(limit: number = 3): Promise<{ success: boolean; data: NewsItem[] }> {
    return api.get(`/news/latest/?limit=${limit}`);
  },

  async getNewsByCategory(category: string, limit: number = 10): Promise<{ success: boolean; data: NewsItem[] }> {
    return api.get(`/news/category/${category}/?limit=${limit}`);
  },

  async createNews(data: FormData | Partial<NewsItem>): Promise<{ success: boolean; data: NewsItem }> {
    return api.post('/news/', data);
  },

  async updateNews(id: number, data: FormData | Partial<NewsItem>): Promise<{ success: boolean; data: NewsItem }> {
    return api.put(`/news/${id}/`, data);
  },

  async deleteNews(id: number): Promise<{ success: boolean }> {
    return api.delete(`/news/${id}/`);
  },
};
