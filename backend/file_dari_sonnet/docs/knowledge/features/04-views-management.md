# Views Management - Knowledge Base

> **Feature**: Analisis dan tracking view artikel  
> **Created**: 11 Mei 2026  
> **Status**: ✅ Completed  

## 📋 Overview

Views Management adalah fitur untuk melacak, menganalisis, dan mengelola view tracking artikel Knowledge Base. Fitur ini memberikan insight tentang artikel mana yang paling banyak dilihat, dari mana traffic berasal, dan pola konsumsi konten.

## 🎯 Features

### 1. **View Tracking**
- ✅ Automatic view tracking berdasarkan IP address
- ✅ Unique view counting (1 IP = 1 view per artikel)
- ✅ User tracking untuk logged-in users
- ✅ Anonymous view tracking
- ✅ User agent recording (browser/device info)

### 2. **Analytics Dashboard**
- ✅ **Statistics Cards**:
  - Total Views
  - Unique IPs
  - Logged In Users
  - Anonymous Views
  
- ✅ **Views Per Day Chart**:
  - Line chart showing views trend (last 30 days)
  - Interactive Chart.js visualization
  
- ✅ **Top 10 Most Active IPs**:
  - List of IPs with highest view count
  - Useful for detecting bot traffic or suspicious activity
  
- ✅ **Top 10 Most Viewed Articles**:
  - Articles ranked by view count
  - Direct links to articles

### 3. **Filtering & Search**
- ✅ Filter by article
- ✅ Filter by user (logged-in users only)
- ✅ Filter by IP address
- ✅ Filter by date range (from - to)
- ✅ Search by article title, username, or IP address
- ✅ Reset filters functionality

### 4. **Management Tools**
- ✅ View list with pagination (50 items per page)
- ✅ Delete individual view record
- ✅ Bulk delete selected view records
- ✅ Select all checkbox
- ✅ Confirmation dialogs with SweetAlert2

## 🗄️ Database Schema

### ArticleView Model
```python
class ArticleView(models.Model):
    article = ForeignKey(Article)           # Artikel yang dilihat
    ip_address = GenericIPAddressField()    # IP address viewer
    user = ForeignKey(User, null=True)      # User (jika login)
    user_agent = TextField(null=True)       # Browser/device info
    viewed_at = DateTimeField()             # Waktu view
    
    unique_together = ('article', 'ip_address')  # 1 IP = 1 view per artikel
```

## 🔐 Permissions

| Permission | Key | Description |
|------------|-----|-------------|
| View - Read | `knowledge.view.read` | Can view article views list and analytics |
| View - Delete | `knowledge.view.delete` | Can delete article view records |

## 🎨 UI Components

### 1. **Statistics Cards**
- Gradient background colors (purple, pink, blue, green)
- Icon indicators
- Large number display
- Responsive grid layout

### 2. **Charts**
- Line chart for views per day trend
- Bar-style list for top IPs
- Grid layout for top articles

### 3. **Filters Section**
- 6 filter inputs (article, user, IP, date from, date to, search)
- Filter and Reset buttons
- Preserves filter state in pagination

### 4. **Data Table**
- Checkbox for bulk selection
- Article title with link
- User name (or "Anonymous")
- IP address (monospace font)
- User agent (truncated)
- Timestamp
- Delete action button

## 📊 Analytics Insights

### View Patterns
- **Peak viewing times**: Identify when users are most active
- **Content popularity**: See which articles resonate most
- **User engagement**: Track logged-in vs anonymous views

### Traffic Analysis
- **Geographic distribution**: Analyze IP addresses (can be enhanced with geolocation)
- **Bot detection**: Identify suspicious IPs with high view counts
- **Referrer tracking**: Can be added to track traffic sources

### Content Strategy
- **Popular topics**: Identify trending content
- **Content gaps**: See which categories need more articles
- **Update priorities**: Focus on updating popular articles

## 🚀 Usage

### For Administrators

1. **Access Views Management**:
   - Navigate to: Knowledge Base → Views
   - Permission required: `knowledge.view.read`

2. **View Analytics**:
   - Check statistics cards for overview
   - Review views per day chart for trends
   - Identify top IPs and articles

3. **Filter Data**:
   - Select article to see its views
   - Filter by date range for specific periods
   - Search by IP to track specific users

4. **Manage View Records**:
   - Delete suspicious or bot views
   - Bulk delete spam traffic
   - Clean up old view records

### For Developers

**Tracking Views in Article Detail**:
```python
# In article detail view
def article_detail(request, slug):
    article = get_object_or_404(Article, slug=slug)
    
    # Get client IP
    ip_address = get_client_ip(request)
    
    # Track view (only counts unique IPs)
    article.increment_view_count(
        ip_address=ip_address,
        user=request.user if request.user.is_authenticated else None
    )
    
    return render(request, 'article_detail.html', {'article': article})
```

**Get Client IP Helper**:
```python
def get_client_ip(request):
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip
```

## 🔧 Technical Implementation

### Views
- `view_manage_list()` - Main list view with analytics
- `view_delete()` - Delete single view record
- `view_bulk_delete()` - AJAX bulk delete

### URLs
```python
path('manage/views/', views.view_manage_list, name='view_manage_list'),
path('manage/views/<int:view_id>/delete/', views.view_delete, name='view_delete'),
path('ajax/views/bulk-delete/', views.view_bulk_delete, name='view_bulk_delete'),
```

### Templates
- `templates/knowledge/views/view_list.html` - Main list with analytics
- `templates/knowledge/views/view_delete.html` - Delete confirmation

### JavaScript Libraries
- **Chart.js** - For views per day line chart
- **SweetAlert2** - For confirmation dialogs
- **Vanilla JS** - For bulk operations

## 📈 Future Enhancements

### Priority 1
- [ ] **IP Geolocation**: Add country/city information
- [ ] **Export to CSV/Excel**: Download view data
- [ ] **Real-time Dashboard**: Live view tracking with WebSockets

### Priority 2
- [ ] **Referrer Tracking**: Track where traffic comes from
- [ ] **Device Analytics**: Browser, OS, device type breakdown
- [ ] **View Duration**: Track how long users stay on articles

### Priority 3
- [ ] **Heatmap Visualization**: Geographic view distribution
- [ ] **Comparison Tools**: Compare view trends between articles
- [ ] **Automated Reports**: Weekly/monthly view reports via email

## 🐛 Known Issues

None at this time.

## 📝 Notes

1. **Unique View Counting**: Each IP address can only be counted once per article. This prevents view count inflation from page refreshes.

2. **Anonymous vs Logged-in**: The system tracks both anonymous (IP only) and logged-in users (IP + user ID).

3. **User Agent Storage**: User agent strings are stored for future analysis but not currently displayed in detail.

4. **Performance**: For high-traffic sites, consider:
   - Database indexing on `viewed_at` and `ip_address`
   - Archiving old view records
   - Caching analytics queries

5. **Privacy**: View tracking respects user privacy by:
   - Not storing personal information beyond IP
   - Allowing administrators to delete view records
   - Following GDPR principles (can be enhanced)

## 🔗 Related Features

- **Article Management**: View counts displayed in article list
- **Rating Management**: Correlate views with ratings
- **Approval History**: Track views after publication

## 📞 Support

For questions or issues:
- Check the TODO list: `file_dari_sonnet/todo/KNOWLEDGE_BASE_TODO.md`
- Review the models: `apps/knowledge/models.py`
- Contact: Development Team

---

*Last updated: 11 Mei 2026*
