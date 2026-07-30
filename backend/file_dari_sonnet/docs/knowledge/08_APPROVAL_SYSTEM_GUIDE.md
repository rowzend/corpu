# ✅ Knowledge Base - Approval/Validation System

## 🎯 Overview

Sistem **Approval/Validasi** untuk artikel sebelum dipublikasi dengan fitur:
- ✅ **Workflow approval** (draft → pending → approved/rejected → published)
- ✅ **Validasi oleh staff** (approve/reject)
- ✅ **Keterangan ditolak** (rejection reason)
- ✅ **Riwayat approval** (history berapa kali ditolak)
- ✅ **Tracking approver** (siapa yang approve/reject)

---

## 📊 Workflow Status

```
┌─────────┐
│  DRAFT  │ ← Author creates article
└────┬────┘
     │ submit_for_approval()
     ▼
┌─────────────────┐
│ PENDING APPROVAL│ ← Waiting for staff review
└────┬────────────┘
     │
     ├─── approve() ──→ ┌──────────┐
     │                  │ APPROVED │
     │                  └────┬─────┘
     │                       │ publish()
     │                       ▼
     │                  ┌───────────┐
     │                  │ PUBLISHED │ ← Live on site
     │                  └───────────┘
     │
     └─── reject() ───→ ┌──────────┐
                        │ REJECTED │ ← Can resubmit
                        └──────────┘
```

---

## 📊 Database Schema

### Updated: `knowledge_articles`

**New Fields:**
| Field | Type | Description |
|-------|------|-------------|
| `status` | VARCHAR(20) | draft/pending/approved/rejected/published/archived |
| `submitted_at` | TIMESTAMP | Waktu submit untuk approval |
| `approved_by` | BIGINT FK | User yang approve (nullable) |
| `approved_at` | TIMESTAMP | Waktu approved (nullable) |
| `rejection_reason` | TEXT | Alasan ditolak (nullable) |
| `rejection_count` | INTEGER | Jumlah kali ditolak |

### New Table: `knowledge_approval_history`

| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key |
| `article_id` | BIGINT FK | Foreign key ke `knowledge_articles` |
| `action` | VARCHAR(20) | submitted/approved/rejected/published |
| `actor` | BIGINT FK | User yang melakukan aksi |
| `reason` | TEXT | Alasan/keterangan (nullable) |
| `created_at` | TIMESTAMP | Waktu aksi |

**Indexes:**
- `(article_id, action)` - Fast filtering by article and action
- `(created_at)` - Fast sorting by date

---

## 🚀 API Endpoints

### Submit for Approval

```bash
POST /api/knowledge/articles/{slug}/submit_for_approval/
Authorization: Bearer <token>

# Response
{
  "message": "Article submitted for approval successfully",
  "status": "pending",
  "submitted_at": "2024-05-07T10:30:00Z"
}
```

**Rules:**
- ✅ Only author can submit their own article
- ✅ Only draft or rejected articles can be submitted
- ✅ Creates history record

### Approve Article

```bash
POST /api/knowledge/articles/{slug}/approve/
Authorization: Bearer <staff-token>

# Body (optional)
{
  "reason": "Article meets quality standards"
}

# Response
{
  "message": "Article approved successfully",
  "status": "approved",
  "approved_by": "John Doe",
  "approved_at": "2024-05-07T11:00:00Z"
}
```

**Rules:**
- ✅ Only staff can approve
- ✅ Only pending articles can be approved
- ✅ Creates history record
- ✅ Clears previous rejection reason

### Reject Article

```bash
POST /api/knowledge/articles/{slug}/reject/
Authorization: Bearer <staff-token>

# Body (required)
{
  "reason": "Content needs improvement. Please add more details and fix grammar errors."
}

# Response
{
  "message": "Article rejected",
  "status": "rejected",
  "rejection_reason": "Content needs improvement...",
  "rejection_count": 1
}
```

**Rules:**
- ✅ Only staff can reject
- ✅ Only pending articles can be rejected
- ✅ Rejection reason is **required**
- ✅ Increments rejection_count
- ✅ Creates history record

### Publish Article

```bash
POST /api/knowledge/articles/{slug}/publish/
Authorization: Bearer <token>

# Response
{
  "message": "Article published successfully",
  "status": "published",
  "published_at": "2024-05-07T12:00:00Z"
}
```

**Rules:**
- ✅ Only staff or author can publish
- ✅ Only approved articles can be published
- ✅ Creates history record

### Get Approval History

```bash
GET /api/knowledge/articles/{slug}/approval_history/

# Response
{
  "article_id": 17,
  "article_title": "My Article",
  "current_status": "published",
  "rejection_count": 2,
  "history": [
    {
      "id": 5,
      "action": "published",
      "action_display": "Published",
      "actor": 3,
      "actor_name": "John Doe",
      "actor_username": "john.doe",
      "reason": "Article published",
      "created_at": "2024-05-07T12:00:00Z"
    },
    {
      "id": 4,
      "action": "approved",
      "action_display": "Approved",
      "actor": 2,
      "actor_name": "Jane Smith",
      "actor_username": "jane.smith",
      "reason": "Article meets quality standards",
      "created_at": "2024-05-07T11:00:00Z"
    },
    {
      "id": 3,
      "action": "submitted",
      "action_display": "Submitted for Approval",
      "actor": 1,
      "actor_name": "Author Name",
      "actor_username": "author",
      "reason": "Submitted for approval",
      "created_at": "2024-05-07T10:30:00Z"
    },
    {
      "id": 2,
      "action": "rejected",
      "action_display": "Rejected",
      "actor": 2,
      "actor_name": "Jane Smith",
      "actor_username": "jane.smith",
      "reason": "Content needs improvement",
      "created_at": "2024-05-06T15:00:00Z"
    },
    {
      "id": 1,
      "action": "submitted",
      "action_display": "Submitted for Approval",
      "actor": 1,
      "actor_name": "Author Name",
      "actor_username": "author",
      "reason": "Submitted for approval",
      "created_at": "2024-05-06T14:00:00Z"
    }
  ]
}
```

### Get Pending Articles (Staff Only)

```bash
GET /api/knowledge/articles/pending_approval/
Authorization: Bearer <staff-token>

# Response
{
  "count": 5,
  "articles": [...]
}
```

### Get My Articles (All Statuses)

```bash
GET /api/knowledge/articles/my_articles/
Authorization: Bearer <token>

# Response
{
  "count": 10,
  "articles": [
    {
      "id": 1,
      "title": "My Article",
      "status": "pending",
      "rejection_count": 0,
      ...
    },
    ...
  ]
}
```

---

## 💻 Frontend Implementation

### React Component - Article Submission

```jsx
import React, { useState } from 'react';

function ArticleSubmission({ article, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmitForApproval = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/knowledge/articles/${article.slug}/submit_for_approval/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Article submitted for approval!');
        onUpdate();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit article');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="article-submission">
      <h3>Article Status: {article.status}</h3>
      
      {article.status === 'draft' && (
        <button onClick={handleSubmitForApproval} disabled={loading}>
          {loading ? 'Submitting...' : 'Submit for Approval'}
        </button>
      )}
      
      {article.status === 'pending' && (
        <div className="pending-notice">
          <p>⏳ Waiting for approval...</p>
          <p>Submitted: {new Date(article.submitted_at).toLocaleString()}</p>
        </div>
      )}
      
      {article.status === 'rejected' && (
        <div className="rejection-notice">
          <h4>❌ Article Rejected</h4>
          <p><strong>Reason:</strong> {article.rejection_reason}</p>
          <p><strong>Rejection Count:</strong> {article.rejection_count}</p>
          <button onClick={handleSubmitForApproval} disabled={loading}>
            Resubmit for Approval
          </button>
        </div>
      )}
      
      {article.status === 'approved' && (
        <div className="approved-notice">
          <p>✅ Article approved!</p>
          <p>Approved by: {article.approved_by_name}</p>
          <p>Approved at: {new Date(article.approved_at).toLocaleString()}</p>
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### React Component - Approval Actions (Staff)

```jsx
function ApprovalActions({ article, onUpdate }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    setLoading(true);
    
    try {
      const response = await fetch(
        `/api/knowledge/articles/${article.slug}/approve/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: approvalReason })
        }
      );
      
      if (response.ok) {
        alert('Article approved!');
        onUpdate();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Rejection reason is required');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = await fetch(
        `/api/knowledge/articles/${article.slug}/reject/`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );
      
      if (response.ok) {
        alert('Article rejected');
        onUpdate();
      }
    } finally {
      setLoading(false);
    }
  };

  if (article.status !== 'pending') {
    return null;
  }

  return (
    <div className="approval-actions">
      <h3>Review Article</h3>
      
      <div className="approve-section">
        <textarea
          placeholder="Approval notes (optional)"
          value={approvalReason}
          onChange={(e) => setApprovalReason(e.target.value)}
        />
        <button onClick={handleApprove} disabled={loading}>
          ✅ Approve
        </button>
      </div>
      
      <div className="reject-section">
        {!showRejectForm ? (
          <button onClick={() => setShowRejectForm(true)}>
            ❌ Reject
          </button>
        ) : (
          <>
            <textarea
              placeholder="Rejection reason (required)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
            />
            <button onClick={handleReject} disabled={loading}>
              Confirm Rejection
            </button>
            <button onClick={() => setShowRejectForm(false)}>
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
```

### React Component - Approval History

```jsx
function ApprovalHistory({ articleSlug }) {
  const [history, setHistory] = useState(null);

  useEffect(() => {
    loadHistory();
  }, [articleSlug]);

  const loadHistory = async () => {
    const response = await fetch(
      `/api/knowledge/articles/${articleSlug}/approval_history/`
    );
    const data = await response.json();
    setHistory(data);
  };

  if (!history) return <div>Loading...</div>;

  return (
    <div className="approval-history">
      <h3>Approval History</h3>
      <p>Total Rejections: {history.rejection_count}</p>
      
      <div className="history-timeline">
        {history.history.map(item => (
          <div key={item.id} className={`history-item ${item.action}`}>
            <div className="history-icon">
              {item.action === 'approved' && '✅'}
              {item.action === 'rejected' && '❌'}
              {item.action === 'submitted' && '📝'}
              {item.action === 'published' && '🚀'}
            </div>
            <div className="history-content">
              <h4>{item.action_display}</h4>
              <p>By: {item.actor_name} (@{item.actor_username})</p>
              <p>Date: {new Date(item.created_at).toLocaleString()}</p>
              {item.reason && (
                <p className="reason"><strong>Reason:</strong> {item.reason}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## 🎨 CSS Styling

```css
/* Approval Status Badges */
.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.status-badge.draft {
  background: #e0e0e0;
  color: #666;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.approved {
  background: #d4edda;
  color: #155724;
}

.status-badge.rejected {
  background: #f8d7da;
  color: #721c24;
}

.status-badge.published {
  background: #d1ecf1;
  color: #0c5460;
}

/* Rejection Notice */
.rejection-notice {
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.rejection-notice h4 {
  color: #721c24;
  margin-bottom: 10px;
}

/* Approval History Timeline */
.history-timeline {
  position: relative;
  padding-left: 40px;
}

.history-item {
  position: relative;
  padding: 15px;
  margin-bottom: 20px;
  background: white;
  border-radius: 8px;
  border-left: 3px solid #ddd;
}

.history-item.approved {
  border-left-color: #28a745;
}

.history-item.rejected {
  border-left-color: #dc3545;
}

.history-item.published {
  border-left-color: #17a2b8;
}

.history-icon {
  position: absolute;
  left: -40px;
  top: 15px;
  font-size: 24px;
}

.reason {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
  font-style: italic;
}
```

---

## 📝 Permission Matrix

| Action | Author | Staff | Admin |
|--------|--------|-------|-------|
| Create draft | ✅ | ✅ | ✅ |
| Submit for approval | ✅ (own) | ✅ | ✅ |
| Approve | ❌ | ✅ | ✅ |
| Reject | ❌ | ✅ | ✅ |
| Publish | ✅ (if approved) | ✅ | ✅ |
| View pending list | ❌ | ✅ | ✅ |
| View history | ✅ (own) | ✅ | ✅ |

---

## 🔄 Workflow Examples

### Example 1: Successful Approval

```
1. Author creates article (status: draft)
2. Author submits for approval (status: pending)
3. Staff approves (status: approved)
4. Author/Staff publishes (status: published)
```

### Example 2: Rejection and Resubmission

```
1. Author creates article (status: draft)
2. Author submits for approval (status: pending)
3. Staff rejects with reason (status: rejected, rejection_count: 1)
4. Author fixes issues
5. Author resubmits (status: pending)
6. Staff approves (status: approved)
7. Author publishes (status: published)
```

### Example 3: Multiple Rejections

```
1. Submit → Reject (rejection_count: 1)
2. Resubmit → Reject (rejection_count: 2)
3. Resubmit → Approve (rejection_count: 2, but approved)
4. Publish
```

---

## 📊 Analytics Queries

### Get Rejection Statistics

```python
from apps.knowledge.models import Article
from django.db.models import Avg, Count

# Average rejection count
avg_rejections = Article.objects.filter(
    status='published'
).aggregate(Avg('rejection_count'))

# Articles by rejection count
rejection_stats = Article.objects.values('rejection_count').annotate(
    count=Count('id')
).order_by('rejection_count')

print(f"Average rejections before publish: {avg_rejections['rejection_count__avg']}")
```

### Get Pending Articles

```python
pending = Article.objects.filter(status='pending').order_by('-submitted_at')

print(f"{pending.count()} articles waiting for approval:")
for article in pending:
    days_waiting = (timezone.now() - article.submitted_at).days
    print(f"- {article.title} (waiting {days_waiting} days)")
```

### Get Approver Performance

```python
from apps.knowledge.models import ApprovalHistory
from django.db.models import Count

approver_stats = ApprovalHistory.objects.filter(
    action__in=['approved', 'rejected']
).values('actor__username', 'action').annotate(
    count=Count('id')
).order_by('actor__username')

for stat in approver_stats:
    print(f"{stat['actor__username']}: {stat['count']} {stat['action']}")
```

---

## 🧪 Testing

```bash
# Test submit for approval
curl -X POST http://localhost:8000/api/knowledge/articles/my-article/submit_for_approval/ \
  -H "Authorization: Bearer <author-token>"

# Test approve (staff only)
curl -X POST http://localhost:8000/api/knowledge/articles/my-article/approve/ \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Looks good!"}'

# Test reject (staff only)
curl -X POST http://localhost:8000/api/knowledge/articles/my-article/reject/ \
  -H "Authorization: Bearer <staff-token>" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Needs improvement"}'

# Test publish
curl -X POST http://localhost:8000/api/knowledge/articles/my-article/publish/ \
  -H "Authorization: Bearer <token>"

# Get approval history
curl http://localhost:8000/api/knowledge/articles/my-article/approval_history/

# Get pending articles (staff only)
curl http://localhost:8000/api/knowledge/articles/pending_approval/ \
  -H "Authorization: Bearer <staff-token>"
```

---

## 📝 Notes

1. **Rejection Reason Required**: Staff must provide reason when rejecting
2. **History Tracking**: All actions are logged in approval_history
3. **Rejection Count**: Increments each time article is rejected
4. **Status Workflow**: Must follow proper sequence (can't skip steps)
5. **Permission Checks**: Enforced at API level

---

**Author:** ASN Corpu Development Team  
**Last Updated:** 2026-05-07  
**Version:** 2.2 (with Approval System)
