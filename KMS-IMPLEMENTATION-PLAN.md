# KMS (Knowledge Management System) Implementation Plan

## Current Status
- ✅ Backend: Database models lengkap (Category, Tag, Article, Comments, Likes, Views, dll)
- ✅ Backend: API endpoints tersedia
- ✅ Frontend: API client sudah dibuat (`lib/api/knowledge.ts`)
- ❌ Frontend Admin: Masih dummy data
- ❌ Frontend Public: Masih dummy data

## Implementation Phases

### Phase 1: Category & Tag Management (Admin)
**Priority: HIGH** - Diperlukan sebelum bisa create articles

#### 1.1 Category Management
**Route**: `/dashboard/knowledge/categories`

**Features**:
- List categories dengan tree view (parent-child)
- Create category (dengan pilihan parent)
- Edit category
- Delete category (dengan validasi jika ada articles)
- Reorder categories (drag & drop atau up/down buttons)
- Show article count per category

**Pages**:
- `/dashboard/knowledge/categories` - List page
- `/dashboard/knowledge/categories/create` - Create page
- `/dashboard/knowledge/categories/[id]` - Edit page

#### 1.2 Tag Management
**Route**: `/dashboard/knowledge/tags`

**Features**:
- List tags dengan color preview
- Create tag (dengan color picker)
- Edit tag
- Delete tag (dengan validasi jika ada articles)
- Show article count per tag

**Pages**:
- `/dashboard/knowledge/tags` - List page
- `/dashboard/knowledge/tags/create` - Create page
- `/dashboard/knowledge/tags/[id]` - Edit page

### Phase 2: Article Management (Admin)
**Priority: HIGH**

#### 2.1 Article CRUD
**Route**: `/dashboard/knowledge/articles`

**Features**:
- List articles dengan filters (status, category, tag, author)
- Create article dengan rich text editor
- Edit article
- Delete article
- Upload thumbnail
- Upload file attachments
- Embed YouTube video
- Add external links
- Select category & tags
- Set content type (article/video/document/link)
- Set featured status
- Draft/Publish workflow

**Pages**:
- `/dashboard/knowledge` - List page (existing, update dengan real data)
- `/dashboard/knowledge/create` - Create page
- `/dashboard/knowledge/[slug]` - Edit page

#### 2.2 Article Editor Features
- Rich text editor (TinyMCE atau Tiptap)
- Image upload dalam content
- Code syntax highlighting
- Table support
- Embed media (YouTube, etc)
- Preview mode
- Auto-save draft

### Phase 3: Public KMS Landing
**Priority: MEDIUM**

#### 3.1 Update Public KMS Page
**Route**: `/kms`

**Features**:
- Show published articles only
- Filter by category
- Filter by tag
- Search articles
- Sort by (newest, popular, most liked)
- Show article stats (views, likes, comments)
- Featured articles section
- Popular articles sidebar
- Recent articles

#### 3.2 Article Detail Page
**Route**: `/kms/[slug]`

**Features**:
- Show full article content
- Show author info
- Show category & tags
- View count tracking (IP-based)
- Like/Dislike buttons
- Share buttons (social media)
- Related articles
- Comments section (Phase 4)
- Table of contents (for long articles)

### Phase 4: Advanced Features (Optional)
**Priority: LOW**

#### 4.1 Comments System
- Add comment
- Reply to comment
- Like/Dislike comment
- Edit/Delete own comment
- Nested comments display

#### 4.2 Approval Workflow
- Submit for approval
- Approve/Reject article
- Approval history
- Rejection reason
- Email notifications

#### 4.3 Analytics Dashboard
- Article views over time
- Popular articles
- Popular categories
- Popular tags
- User engagement metrics

#### 4.4 Search & Discovery
- Advanced search
- Full-text search
- Search suggestions
- Search history
- Bookmarks/Favorites

## Database Structure (Already Exists)

### Tables:
1. `knowledge_categories` - Categories with parent-child relationship
2. `knowledge_tags` - Tags with colors
3. `knowledge_articles` - Main articles table
4. `knowledge_article_tags` - Many-to-many Article-Tag
5. `knowledge_article_views` - View tracking (IP-based)
6. `knowledge_article_likes` - Like/Dislike
7. `knowledge_comments` - Comments with nested replies
8. `knowledge_comment_likes` - Comment likes
9. `knowledge_approval_history` - Approval workflow history

### Key Fields in Article:
- Content types: article, video, document, link
- Status: draft, pending, approved, rejected, published, archived
- Media: thumbnail, file_upload, file_url, youtube_url, external_url
- Stats: view_count, like_count, dislike_count, share_count, rating_avg
- Approval: submitted_at, approved_by, approved_at, rejection_reason

## UI Components Needed

### Existing (from shadcn/ui):
- ✅ Card, Button, Input, Label, Textarea, Badge

### Need to Add:
- Rich Text Editor (TinyMCE/Tiptap)
- Color Picker (for tags)
- File Upload component
- Image Upload with preview
- Tree View (for categories)
- Tabs component
- Dialog/Modal component
- Select/Dropdown component
- Checkbox component
- Radio component

## API Endpoints (Backend)

### Categories:
- GET `/api/knowledge/categories/` - List
- GET `/api/knowledge/categories/{slug}/` - Detail
- POST `/api/knowledge/categories/` - Create
- PUT `/api/knowledge/categories/{id}/` - Update
- DELETE `/api/knowledge/categories/{id}/` - Delete

### Tags:
- GET `/api/knowledge/tags/` - List
- GET `/api/knowledge/tags/{slug}/` - Detail
- POST `/api/knowledge/tags/` - Create
- PUT `/api/knowledge/tags/{id}/` - Update
- DELETE `/api/knowledge/tags/{id}/` - Delete

### Articles:
- GET `/api/knowledge/articles/` - List (with filters)
- GET `/api/knowledge/articles/{slug}/` - Detail
- POST `/api/knowledge/articles/` - Create
- PUT `/api/knowledge/articles/{id}/` - Update
- DELETE `/api/knowledge/articles/{id}/` - Delete
- POST `/api/knowledge/articles/{id}/submit/` - Submit for approval
- POST `/api/knowledge/articles/{id}/approve/` - Approve
- POST `/api/knowledge/articles/{id}/reject/` - Reject
- POST `/api/knowledge/articles/{id}/publish/` - Publish
- POST `/api/knowledge/articles/{id}/like/` - Like/Unlike
- POST `/api/knowledge/articles/{id}/share/` - Share

### Stats:
- GET `/api/knowledge/stats/` - Overall statistics

## Next Steps

1. **Start with Phase 1**: Category & Tag Management
   - Buat halaman list categories
   - Buat form create/edit category
   - Buat halaman list tags
   - Buat form create/edit tag

2. **Then Phase 2**: Article Management
   - Update existing knowledge page dengan real data
   - Buat form create/edit article
   - Integrate rich text editor
   - Handle file uploads

3. **Then Phase 3**: Public KMS
   - Update public KMS landing dengan real data
   - Buat article detail page
   - Implement view tracking
   - Implement like/share

4. **Optional Phase 4**: Advanced features
   - Comments system
   - Approval workflow
   - Analytics
   - Advanced search

## Estimated Timeline

- Phase 1 (Categories & Tags): 2-3 hours
- Phase 2 (Articles CRUD): 4-5 hours
- Phase 3 (Public KMS): 2-3 hours
- Phase 4 (Advanced): 5-6 hours

**Total**: ~15-20 hours for complete implementation

---
**Created**: 2026-05-19
**Status**: Planning Phase
