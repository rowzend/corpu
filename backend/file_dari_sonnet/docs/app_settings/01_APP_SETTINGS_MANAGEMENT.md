# ⚙️ App Settings Management

> **Status**: ✅ Completed  
> **Created**: 11 Mei 2026  
> **Category**: Data Aplikasi  
> **Purpose**: Dynamic application settings management  

---

## 📋 **Overview**

Fitur **App Settings Management** memungkinkan administrator untuk mengelola pengaturan aplikasi secara dinamis tanpa perlu mengubah kode. Semua pengaturan disimpan di database dan dapat diakses melalui UI admin maupun public API.

---

## 🎯 **Features**

### **1. CRUD Management**
- ✅ **Create**: Tambah setting baru dengan key unik
- ✅ **Read**: List semua settings dengan filtering dan search
- ✅ **Update**: Edit value, type, category, dan visibility
- ✅ **Delete**: Hapus setting (individual atau bulk)

### **2. Data Types**
- `string` - Text pendek
- `text` - Text panjang (multi-line)
- `integer` - Angka bulat
- `boolean` - True/False
- `json` - JSON object
- `file` - File path
- `url` - URL
- `email` - Email address

### **3. Categories**
- `general` - General settings (app name, version, dll)
- `contact` - Contact information (email, phone, address)
- `social` - Social media links
- `appearance` - UI/UX settings (logo, theme, colors)
- `system` - System configuration

### **4. Visibility Control**
- **Public**: Dapat diakses via public API (no auth required)
- **Private**: Hanya untuk internal/admin

### **5. Advanced Features**
- ✅ Search by key, value, or description
- ✅ Filter by category, type, and visibility
- ✅ Bulk delete with confirmation
- ✅ Statistics dashboard
- ✅ Type-safe value conversion
- ✅ Responsive design

---

## 🗄️ **Database Structure**

### **Table**: `app_settings`

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary key (auto increment) |
| `key` | VARCHAR(191) | Unique setting key |
| `value` | TEXT | Setting value |
| `type` | VARCHAR(191) | Data type (string, text, integer, boolean, json, file, url, email) |
| `category` | VARCHAR(191) | Category (general, contact, social, appearance, system) |
| `description` | TEXT | Description of the setting |
| `is_public` | TINYINT(1) | Whether accessible via public API (0=private, 1=public) |
| `created_at` | DATETIME(3) | Creation timestamp |
| `updated_at` | DATETIME(3) | Last update timestamp |

### **Indexes**:
- `key` (UNIQUE)
- `category`
- `is_public`

---

## 🔐 **Permissions**

### **Module**: `data_aplikasi`
### **Control**: `app_settings`
### **Functions**:
- `view` - Lihat daftar settings
- `create` - Tambah setting baru
- `edit` - Edit setting
- `delete` - Hapus setting

### **Permission Strings**:
```
data_aplikasi.app_settings.view
data_aplikasi.app_settings.create
data_aplikasi.app_settings.edit
data_aplikasi.app_settings.delete
```

---

## 🔗 **URLs**

### **Management URLs** (Admin):
```
GET  /manajemen-aplikasi/app-settings/                    # List all settings
GET  /manajemen-aplikasi/app-settings/create/             # Create form
POST /manajemen-aplikasi/app-settings/create/             # Create action
GET  /manajemen-aplikasi/app-settings/<id>/edit/          # Edit form
POST /manajemen-aplikasi/app-settings/<id>/edit/          # Update action
GET  /manajemen-aplikasi/app-settings/<id>/delete/        # Delete confirmation
POST /manajemen-aplikasi/app-settings/<id>/delete/        # Delete action
POST /manajemen-aplikasi/app-settings/                    # Bulk delete
```

### **Public API URLs** (No Auth Required):
```
GET /manajemen-aplikasi/api/public/settings/              # Get all public settings
GET /manajemen-aplikasi/api/public/settings/<key>/        # Get single setting by key
```

---

## 📡 **Public API Documentation**

### **1. Get All Public Settings**

#### **Endpoint**:
```
GET /manajemen-aplikasi/api/public/settings/
```

#### **Description**:
Returns all public settings grouped by category and also in flat structure.

#### **Authentication**: None required

#### **Response Example**:
```json
{
  "success": true,
  "settings": {
    "grouped": {
      "general": {
        "app_name": {
          "value": "BKPSDM Pesisir Selatan",
          "type": "string",
          "description": "Application name displayed in header and title"
        },
        "app_version": {
          "value": "3.0.0",
          "type": "string",
          "description": "Current application version"
        }
      },
      "contact": {
        "contact_email": {
          "value": "bkpsdm@pesisirselatankab.go.id",
          "type": "email",
          "description": "Primary contact email"
        },
        "contact_phone": {
          "value": "(0756) 21046",
          "type": "string",
          "description": "Primary contact phone number"
        }
      },
      "social": {
        "social_facebook": {
          "value": "https://www.facebook.com/Bkpsdmpesisirselatan/",
          "type": "url",
          "description": "Facebook page URL"
        }
      }
    },
    "flat": {
      "app_name": "BKPSDM Pesisir Selatan",
      "app_version": "3.0.0",
      "contact_email": "bkpsdm@pesisirselatankab.go.id",
      "contact_phone": "(0756) 21046",
      "social_facebook": "https://www.facebook.com/Bkpsdmpesisirselatan/"
    }
  },
  "total": 25
}
```

#### **Usage Example (JavaScript)**:
```javascript
// Fetch all public settings
fetch('http://localhost:8008/manajemen-aplikasi/api/public/settings/')
  .then(response => response.json())
  .then(data => {
    // Use grouped structure
    const appName = data.settings.grouped.general.app_name.value;
    const contactEmail = data.settings.grouped.contact.contact_email.value;
    
    // Or use flat structure
    const appNameFlat = data.settings.flat.app_name;
    const contactEmailFlat = data.settings.flat.contact_email;
    
    console.log('App Name:', appName);
    console.log('Contact Email:', contactEmail);
  });
```

---

### **2. Get Single Setting by Key**

#### **Endpoint**:
```
GET /manajemen-aplikasi/api/public/settings/<key>/
```

#### **Description**:
Returns a single public setting by its key.

#### **Authentication**: None required

#### **Parameters**:
- `key` (path parameter) - Setting key (e.g., `app_name`, `contact_email`)

#### **Response Example (Success)**:
```json
{
  "success": true,
  "setting": {
    "key": "app_name",
    "value": "BKPSDM Pesisir Selatan",
    "type": "string",
    "category": "general",
    "description": "Application name displayed in header and title"
  }
}
```

#### **Response Example (Not Found)**:
```json
{
  "success": false,
  "error": "Setting \"invalid_key\" not found or not public"
}
```

#### **Usage Example (JavaScript)**:
```javascript
// Fetch single setting
fetch('http://localhost:8008/manajemen-aplikasi/api/public/settings/app_name/')
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      const appName = data.setting.value;
      document.title = appName;
      console.log('App Name:', appName);
    } else {
      console.error('Error:', data.error);
    }
  });
```

---

## 💻 **Frontend Integration Examples**

### **Example 1: Display App Name in Header**
```javascript
// Fetch and display app name
fetch('/manajemen-aplikasi/api/public/settings/app_name/')
  .then(r => r.json())
  .then(data => {
    if (data.success) {
      document.getElementById('app-name').textContent = data.setting.value;
    }
  });
```

### **Example 2: Display Contact Information**
```javascript
// Fetch all settings and display contact info
fetch('/manajemen-aplikasi/api/public/settings/')
  .then(r => r.json())
  .then(data => {
    const contact = data.settings.grouped.contact;
    
    document.getElementById('contact-email').textContent = contact.contact_email.value;
    document.getElementById('contact-phone').textContent = contact.contact_phone.value;
    document.getElementById('contact-address').textContent = contact.contact_address.value;
  });
```

### **Example 3: Display Social Media Links**
```javascript
// Fetch and display social media links
fetch('/manajemen-aplikasi/api/public/settings/')
  .then(r => r.json())
  .then(data => {
    const social = data.settings.grouped.social;
    
    if (social.social_facebook && social.social_facebook.value) {
      document.getElementById('facebook-link').href = social.social_facebook.value;
    }
    
    if (social.social_instagram && social.social_instagram.value) {
      document.getElementById('instagram-link').href = social.social_instagram.value;
    }
    
    if (social.social_youtube && social.social_youtube.value) {
      document.getElementById('youtube-link').href = social.social_youtube.value;
    }
  });
```

### **Example 4: Load All Settings on Page Load**
```javascript
// Create a global settings object
window.appSettings = {};

// Fetch all settings on page load
document.addEventListener('DOMContentLoaded', function() {
  fetch('/manajemen-aplikasi/api/public/settings/')
    .then(r => r.json())
    .then(data => {
      // Store in global object for easy access
      window.appSettings = data.settings.flat;
      
      // Update page title
      document.title = window.appSettings.app_name;
      
      // Update meta description
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.content = window.appSettings.app_description;
      }
      
      // Update footer
      document.getElementById('footer-text').textContent = window.appSettings.footer_tagline;
    });
});

// Later, access settings anywhere in your code
console.log(window.appSettings.app_name);
console.log(window.appSettings.contact_email);
```

---

## 📊 **Initial Settings Data**

### **General Settings** (5 items):
- `app_name` - BKPSDM Pesisir Selatan
- `app_description` - Website Utama Badan Kepegawaian...
- `app_version` - 3.0.0
- `footer_tagline` - Website OPD BKPSDM Kab. Pesisir Selatan
- `footer_description` - Badan Kepegawaian dan Pengembangan...
- `footer_developer_name` - IT BKPSDM Pesisir Selatan
- `footer_developer_url` - http://it.bkpsdm.pesisirselatankab.go.id

### **Contact Information** (6 items):
- `contact_email` - bkpsdm@pesisirselatankab.go.id
- `contact_phone` - (0756) 21046
- `contact_fax` - (0756) 21046
- `contact_address` - Jl. Ilyas Yacub Paiman...
- `contact_postal_code` - 25652
- `contact_website` - https://bkpsdm.pesisirselatankab.go.id

### **Social Media** (5 items):
- `social_facebook` - https://www.facebook.com/Bkpsdmpesisirselatan/
- `social_instagram` - https://www.instagram.com/bkpsdm_pessel/
- `social_youtube` - https://www.youtube.com/channel/...
- `social_twitter` - (empty)
- `social_tiktok` - https://www.tiktok.com/@bkpsdm.pessel...

### **Appearance** (4 items):
- `theme_color` - (empty)
- `theme_mode` - system (private)
- `logo` - /uploads/settings/logo-17e2f7335903.png
- `logo_small` - /uploads/settings/logo_small-17e2f7342990.png
- `favicon` - /uploads/settings/favicon-17e2477345997.png

### **Work Hours** (3 items):
- `work_hours_weekday` - (empty)
- `work_hours_friday` - (empty)
- `work_hours_weekend` - (empty)

**Total**: 26 settings (25 public, 1 private)

---

## 🎨 **UI Features**

### **List Page**:
- ✅ Statistics cards (Total, Public, Private, Categories)
- ✅ Advanced filtering (category, type, visibility)
- ✅ Search functionality
- ✅ Bulk selection with checkboxes
- ✅ Bulk delete with confirmation
- ✅ Pagination
- ✅ Color-coded badges for type and category
- ✅ Responsive design

### **Create/Edit Form**:
- ✅ Key input (readonly on edit)
- ✅ Value textarea
- ✅ Type dropdown (8 types)
- ✅ Category dropdown (5 categories)
- ✅ Description textarea
- ✅ Public checkbox
- ✅ Validation with error messages
- ✅ Help section with guidelines

### **Delete Page**:
- ✅ Warning message
- ✅ Setting details display
- ✅ Confirmation form
- ✅ Cancel button

---

## 🔧 **Technical Implementation**

### **Model**: `AppSettings`
- Location: `apps/manajemen/models.py`
- Features:
  - Type choices with validation
  - Category choices for grouping
  - `get_value()` method for type-safe conversion
  - Indexes for performance

### **Views**: `apps/manajemen/app_settings.py`
- `app_settings_list()` - List with filtering, search, bulk delete
- `app_settings_create()` - Create new setting
- `app_settings_edit()` - Edit existing setting
- `app_settings_delete()` - Delete setting
- `public_settings_api()` - Public API for all settings
- `public_setting_by_key_api()` - Public API for single setting

### **Templates**:
- `templates/manajemen_aplikasi/app_settings/list.html`
- `templates/manajemen_aplikasi/app_settings/form.html`
- `templates/manajemen_aplikasi/app_settings/delete.html`

### **Seeders**:
- `seed_app_settings.py` - Initial settings data
- `seed_app_settings_permissions.py` - Permissions
- `seed_app_settings_menu.py` - Menu items

---

## 📝 **Usage Guide**

### **For Administrators**:

1. **Access Management Page**:
   - Navigate to sidebar: **Data Aplikasi** → **Pengaturan Aplikasi**
   - URL: http://localhost:8008/manajemen-aplikasi/app-settings/

2. **Add New Setting**:
   - Click "Tambah Setting" button
   - Fill in key (use snake_case, e.g., `new_setting_key`)
   - Enter value
   - Select type and category
   - Add description (optional)
   - Check "Public" if accessible via API
   - Click "Simpan Setting"

3. **Edit Setting**:
   - Click edit icon (pencil) on the setting row
   - Update value, type, category, or visibility
   - Click "Update Setting"

4. **Delete Setting**:
   - Click delete icon (trash) on the setting row
   - Confirm deletion
   - Or use bulk delete for multiple settings

5. **Filter Settings**:
   - Use search box to find by key, value, or description
   - Filter by category, type, or visibility
   - Click "Filter" to apply

### **For Frontend Developers**:

1. **Fetch All Settings**:
   ```javascript
   fetch('/manajemen-aplikasi/api/public/settings/')
     .then(r => r.json())
     .then(data => console.log(data.settings));
   ```

2. **Fetch Single Setting**:
   ```javascript
   fetch('/manajemen-aplikasi/api/public/settings/app_name/')
     .then(r => r.json())
     .then(data => console.log(data.setting.value));
   ```

3. **Use in Vue.js**:
   ```javascript
   export default {
     data() {
       return {
         settings: {}
       }
     },
     mounted() {
       this.fetchSettings();
     },
     methods: {
       async fetchSettings() {
         const response = await fetch('/manajemen-aplikasi/api/public/settings/');
         const data = await response.json();
         this.settings = data.settings.flat;
       }
     }
   }
   ```

4. **Use in React**:
   ```javascript
   const [settings, setSettings] = useState({});
   
   useEffect(() => {
     fetch('/manajemen-aplikasi/api/public/settings/')
       .then(r => r.json())
       .then(data => setSettings(data.settings.flat));
   }, []);
   ```

---

## ✅ **Testing**

### **Test Management UI**:
```
1. Access: http://localhost:8008/manajemen-aplikasi/app-settings/
2. Verify statistics cards display correctly
3. Test search functionality
4. Test filters (category, type, visibility)
5. Test create new setting
6. Test edit existing setting
7. Test delete setting
8. Test bulk delete
```

### **Test Public API**:
```bash
# Test get all settings
curl http://localhost:8008/manajemen-aplikasi/api/public/settings/

# Test get single setting
curl http://localhost:8008/manajemen-aplikasi/api/public/settings/app_name/

# Test non-existent setting
curl http://localhost:8008/manajemen-aplikasi/api/public/settings/invalid_key/

# Test private setting (should return 404)
curl http://localhost:8008/manajemen-aplikasi/api/public/settings/theme_mode/
```

---

## 🎉 **Summary**

✅ **Complete CRUD** for app settings  
✅ **26 initial settings** seeded  
✅ **Public API** for frontend integration  
✅ **Type-safe** value conversion  
✅ **Category-based** organization  
✅ **Visibility control** (public/private)  
✅ **Advanced filtering** and search  
✅ **Bulk operations** support  
✅ **Responsive design** with Tailwind CSS  
✅ **Permission-based** access control  

**Status**: 🟢 **PRODUCTION READY** 🎉

---

*Created: 11 Mei 2026*  
*Developer: Kiro AI Assistant*  
*Project: ASN Corpu Backend Python*

