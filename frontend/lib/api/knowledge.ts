import { api } from '../api';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Category {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    parent: number | null;
    parent_name?: string;
    order_index: number;
    is_active: boolean;
    article_count: number;
    course_count: number;
    children?: Category[];
    created_at: string;
    updated_at: string;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    color: string;
    is_active: boolean;
    article_count: number;
    created_at: string;
}

export interface Article {
    id: number;
    title: string;
    slug: string;
    content: string;
    excerpt: string | null;
    thumbnail: string | null;
    content_type: 'article' | 'video' | 'document' | 'link';

    // Media fields
    file_url: string | null;
    file_upload: string | null;
    file_size: number | null;
    file_type: string | null;
    youtube_url: string | null;
    youtube_embed_id: string | null;
    video_duration: string | null;
    external_url: string | null;

    // Relations
    author: {
        id: number;
        username: string;
        name: string;
        email: string;
    };
    category: Category | null;
    tags: Tag[];

    // Status & metadata
    status: 'draft' | 'pending' | 'approved' | 'rejected' | 'published' | 'archived';
    is_featured: boolean;
    view_count: number;
    like_count: number;
    dislike_count: number;
    share_count: number;
    rating_avg: number;
    rating_count: number;
    comment_count: number;

    // Approval fields
    submitted_at: string | null;
    approved_by: number | null;
    approved_at: string | null;
    rejection_reason: string | null;
    rejection_count: number;

    // Timestamps
    published_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface ArticleListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Article[];
}

export interface ArticleDetailResponse {
    status?: string;
    data?: Article;
    // Direct article response
    id?: number;
    title?: string;
    [key: string]: any;
}

export interface CategoryListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Category[];
}

export interface TagListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Tag[];
}

export interface KnowledgeStatsResponse {
    total_articles: number;
    published_articles: number;
    draft_articles: number;
    pending_articles: number;
    total_categories: number;
    total_tags: number;
    total_views: number;
    total_likes: number;
    total_comments: number;
    featured_articles: number;
    recent_articles: number;
    popular_articles: Array<{
        id: number;
        title: string;
        slug: string;
        view_count: number;
        like_count: number;
    }>;
    generated_at: string;
}

export interface Comment {
    id: number;
    article: number;
    user: number;
    user_name: string;
    user_username: string;
    parent: number | null;
    content: string;
    like_count: number;
    dislike_count: number;
    like_percentage?: number;
    is_edited: boolean;
    created_at: string;
    updated_at: string;
    replies?: Comment[];
    reply_count?: number;
    user_like_status?: 'like' | 'dislike' | null;
}

export interface CommentListResponse {
    count: number;
    next: string | null;
    previous: string | null;
    results: Comment[];
}

// ============================================================================
// CATEGORY API
// ============================================================================

/**
 * Get list of categories
 * For admin use - uses authenticated endpoint
 */
export async function getCategories(params?: {
    search?: string;
    parent?: number | null;
    is_active?: boolean;
}): Promise<CategoryListResponse> {
    // Use authenticated admin endpoint for category management
    return api.getAdminCategories(params) as Promise<CategoryListResponse>;
}

/**
 * Get single category by ID or slug
 */
export async function getCategory(idOrSlug: string | number): Promise<{ status: string; data: Category }> {
    return api.get(`knowledge/categories/${idOrSlug}/`, undefined, false);
}

/**
 * Create new category
 */
export async function createCategory(data: {
    name: string;
    description?: string;
    parent?: number | null;
    order_index?: number;
    is_active?: boolean;
}): Promise<{ status: string; data: Category }> {
    return api.post('knowledge/categories/', data, true);
}

/**
 * Update existing category
 */
export async function updateCategory(slugOrId: string | number, data: Partial<{
    name: string;
    description: string;
    parent: number | null;
    order_index: number;
    is_active: boolean;
}>): Promise<{ status: string; data: Category }> {
    return api.put(`knowledge/categories/${slugOrId}/`, data);
}

/**
 * Delete category
 */
export async function deleteCategory(slugOrId: string | number): Promise<{ status: string; message: string }> {
    // Use ID for delete endpoint
    return api.delete(`knowledge/categories/${slugOrId}/`);
}

// ============================================================================
// TAG API
// ============================================================================

/**
 * Get list of tags
 * For admin use - uses authenticated endpoint
 */
export async function getTags(params?: {
    search?: string;
    is_active?: boolean;
}): Promise<TagListResponse> {
    return api.get('/knowledge/tags/', params, false);
}

/**
 * Get single tag by ID or slug
 */
export async function getTag(idOrSlug: string | number): Promise<{ status: string; data: Tag }> {
    return api.get(`/knowledge/tags/${idOrSlug}/`, undefined, false);
}

/**
 * Create new tag
 */
export async function createTag(data: {
    name: string;
    description?: string;
    color?: string;
    is_active?: boolean;
}): Promise<{ status: string; data: Tag }> {
    return api.post('/knowledge/tags/', data, true);
}

/**
 * Update existing tag
 */
export async function updateTag(idOrSlug: string | number, data: Partial<{
    name: string;
    description: string;
    color: string;
    is_active: boolean;
}>): Promise<{ status: string; data: Tag }> {
    return api.put(`/knowledge/tags/${idOrSlug}/`, data);
}

/**
 * Delete tag
 */
export async function deleteTag(idOrSlug: string | number): Promise<{ status: string; message: string }> {
    // Use ID for delete endpoint
    return api.delete(`knowledge/tags/${idOrSlug}/`);
}

// ============================================================================
// ARTICLE API
// ============================================================================

/**
 * Get list of articles with pagination and filters
 * For admin use - uses authenticated endpoint
 */
export async function getArticles(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    tag?: string;
    status?: string;
    content_type?: string;
    is_featured?: boolean;
    author?: number;
}): Promise<ArticleListResponse> {
    // Use authenticated endpoint for admin access
    return api.get('knowledge/articles/', params, false);
}

/**
 * Get single article by ID or slug
 */
export async function getArticle(idOrSlug: string | number): Promise<ArticleDetailResponse> {
    return api.get(`/knowledge/articles/${idOrSlug}/`, undefined, false);
}

/**
 * Create new article
 */
export async function createArticle(data: {
    title: string;
    content: string;
    excerpt?: string;
    category?: number;
    tags?: number[];
    content_type?: 'article' | 'video' | 'document' | 'link';
    status?: 'draft' | 'pending' | 'published';
    is_featured?: boolean;

    // Media fields
    thumbnail?: File | string;
    file_url?: string;
    file_upload?: File;
    youtube_url?: string;
    external_url?: string;
}): Promise<ArticleDetailResponse> {
    return api.post('/knowledge/articles/', data, true);
}

/**
 * Update existing article
 */
export async function updateArticle(idOrSlug: string | number, data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    category: number;
    tags: number[];
    content_type: 'article' | 'video' | 'document' | 'link';
    status: 'draft' | 'pending' | 'published';
    is_featured: boolean;

    // Media fields
    thumbnail: File | string;
    file_url: string;
    file_upload: File;
    youtube_url: string;
    external_url: string;
}>): Promise<ArticleDetailResponse> {
    return api.put(`/knowledge/articles/${idOrSlug}/`, data);
}

/**
 * Delete article
 */
export async function deleteArticle(idOrSlug: string | number): Promise<{ status: string; message: string }> {
    // Use ID for delete endpoint
    return api.delete(`knowledge/articles/${idOrSlug}/`);
}

/**
 * Submit article for approval
 */
export async function submitArticleForApproval(id: number): Promise<ArticleDetailResponse> {
    return api.post(`/knowledge/articles/${id}/submit/`);
}

/**
 * Approve article
 */
export async function approveArticle(id: number, reason?: string): Promise<ArticleDetailResponse> {
    return api.post(`/knowledge/articles/${id}/approve/`, { reason });
}

/**
 * Reject article
 */
export async function rejectArticle(id: number, reason: string): Promise<ArticleDetailResponse> {
    return api.post(`/knowledge/articles/${id}/reject/`, { reason });
}

/**
 * Publish article
 */
export async function publishArticle(id: number): Promise<ArticleDetailResponse> {
    return api.post(`/knowledge/articles/${id}/publish/`);
}

/**
 * Like/Unlike article
 */
export async function likeArticle(id: number, isLike: boolean): Promise<{ status: string; message: string }> {
    return api.post(`/knowledge/articles/${id}/like/`, { is_like: isLike });
}

/**
 * Share article (increment share count)
 */
export async function shareArticle(id: number): Promise<{ status: string; message: string }> {
    return api.post(`/knowledge/articles/${id}/share/`);
}

/**
 * Get knowledge base statistics
 * For admin use - uses authenticated endpoint
 */
export async function getKnowledgeStats(): Promise<KnowledgeStatsResponse> {
    return api.get('knowledge/stats/', undefined, false);
}

// ============================================================================
// PUBLIC API (for non-authenticated users)
// ============================================================================

/**
 * Get public articles (published only)
 */
export async function getPublicArticles(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    tag?: string;
    status?: string;
}): Promise<ArticleListResponse> {
    return api.getKnowledgeArticles(params) as Promise<ArticleListResponse>;
}

/**
 * Get public categories
 */
export async function getPublicCategories(params?: {
    search?: string;
    is_active?: boolean;
    per_page?: number;
}): Promise<CategoryListResponse> {
    return api.getKnowledgeCategories(params) as Promise<CategoryListResponse>;
}

/**
 * Get public knowledge stats
 */
export async function getPublicKnowledgeStats(): Promise<KnowledgeStatsResponse> {
    return api.getKnowledgeStats() as Promise<KnowledgeStatsResponse>;
}

/**
 * Get public article by slug
 */
export async function getPublicArticle(slug: string): Promise<ArticleDetailResponse> {
  return api.get(`/knowledge/articles/${slug}/`, undefined, false);
}

/**
 * Get featured articles
 */
export async function getFeaturedArticles(limit: number = 5): Promise<ArticleListResponse> {
    return api.get('/knowledge/articles/', { is_featured: true, per_page: limit });
}

/**
 * Get popular articles (by views)
 */
export async function getPopularArticles(limit: number = 10): Promise<ArticleListResponse> {
    return api.get('/knowledge/articles/', { ordering: '-view_count', per_page: limit });
}

/**
 * Get recent articles
 */
export async function getRecentArticles(limit: number = 10): Promise<ArticleListResponse> {
    return api.get('/knowledge/articles/', { ordering: '-published_at', per_page: limit });
}

// ============================================================================
// COMMENT API
// ============================================================================

/**
 * Get comments for an article
 */
export async function getComments(articleSlug: string, params?: {
    parent?: number | null;
    page?: number;
    per_page?: number;
}): Promise<CommentListResponse> {
    // Use the correct endpoint: /knowledge/comments/ with article_slug parameter
    return api.get(`/knowledge/comments/`, { 
        article_slug: articleSlug,
        ...params 
    }, false);
}

/**
 * Add comment to article
 */
export async function addComment(articleSlug: string, data: {
    content: string;
    parent?: number | null;
}): Promise<Comment> {
    // Use the correct endpoint: /knowledge/comments/ with article_slug in the body
    return api.post(`/knowledge/comments/`, { 
        article_slug: articleSlug,
        ...data 
    }, true);
}

/**
 * Update comment
 */
export async function updateComment(commentId: number, data: {
    content: string;
}): Promise<{ status: string; data: Comment }> {
    return api.put(`/knowledge/comments/${commentId}/`, data);
}

/**
 * Delete comment
 */
export async function deleteComment(commentId: number): Promise<{ status: string; message: string }> {
    return api.delete(`/knowledge/comments/${commentId}/`);
}

/**
 * Like/Unlike comment
 */
export async function likeComment(commentId: number, isLike: boolean): Promise<{ 
    status: string; 
    message: string;
    like_count: number;
    dislike_count: number;
}> {
    return api.post(`/knowledge/comments/${commentId}/like/`, { is_like: isLike });
}

/**
 * Get replies for a comment
 */
export async function getCommentReplies(commentId: number): Promise<CommentListResponse> {
    return api.get(`/knowledge/comments/${commentId}/replies/`, undefined, false);
}
