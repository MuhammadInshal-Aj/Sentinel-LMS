# 🏆 MY COURSES - REVISED FOR ACTUAL DATABASE SCHEMA

## 🎯 WHAT CHANGED

Your original database schema uses:
- **Level field**: `foundation`, `intermediate`, `advanced` (not "category")
- **Table structure**: Requires JOINs across multiple tables
- **Progress tracking**: Calculated from `user_lesson_progress` and `user_track_enrollments`

I've **completely revised** the integration to match your **actual Supabase schema**.

---

## 📦 FILES IN THIS PACKAGE

### ✅ REVISED Files (USE THESE):
1. **my-courses-enhanced-REVISED.js** - Matches your DB schema exactly
2. **my-courses-enhanced-REVISED.css** - Updated styling (same as before)
3. **HTML_STRUCTURE_UPDATE.md** - How to update your HTML
4. **README-REVISED.md** - This file

### ❌ OLD Files (IGNORE):
- ~~my-courses-enhanced.js~~ (used wrong field names)
- ~~README-INTEGRATION.md~~ (outdated instructions)

---

## 🚀 INSTALLATION (CORRECTED)

### Step 1: Update Your HTML Structure

In `index.html`, find the My Courses section and update it:

**CHANGE THIS:**
```html
<section class="course-category" id="fundamentals-section">
    <div class="category-header">
        <h2 class="category-title">Fundamentals</h2>
        <span class="category-badge" id="fundamentals-count">0 courses</span>
    </div>
    <div class="course-grid" id="fundamentals-grid">
```

**TO THIS:**
```html
<section class="course-category" id="foundation-section">
    <div class="category-header">
        <h2 class="category-title">Foundation</h2>
        <span class="category-badge" id="foundation-count">0 courses</span>
    </div>
    <div class="course-grid" id="foundation-grid">
```

**AND ADD:** (Advanced courses section)
```html
<!-- Advanced Courses -->
<section class="course-category" id="advanced-section">
    <div class="category-header">
        <h2 class="category-title">Advanced</h2>
        <span class="category-badge" id="advanced-count">0 courses</span>
    </div>
    <div class="course-grid" id="advanced-grid">
        <!-- Advanced courses will be rendered here -->
    </div>
</section>
```

### Step 2: Add JavaScript Files

Copy these to your `/frontend/` directory:
- `config.js` (you have this)
- `auth.js` (you have this)
- `my-courses-enhanced-REVISED.js` ← NEW

Then add to `index.html` before `</body>`:

```html
    <!-- Core Utilities -->
    <script src="config.js"></script>
    <script src="auth.js"></script>
    
    <!-- Enhanced My Courses (REVISED) -->
    <script src="my-courses-enhanced-REVISED.js"></script>
</body>
```

### Step 3: Update CSS

In your `<style>` section, find:
```css
/* MY COURSES SECTION STYLES */
```

Delete everything in that section and paste the contents of `my-courses-enhanced-REVISED.css`.

### Step 4: Remove Old My Courses JavaScript

In your `<script>` section, find and **DELETE**:
```javascript
// === MY COURSES FUNCTIONALITY ===
const coursesData = { ... }
// ... everything until the next section
```

The new `my-courses-enhanced-REVISED.js` handles everything!

---

## 📊 BACKEND API REQUIREMENTS

Your backend `/api/user/courses` endpoint **MUST** return data in this exact format:

```json
{
  "myCourses": [
    {
      "id": "infosec",
      "title": "Information Security",
      "slug": "information-security",
      "level": "foundation",
      "description": "Core principles of information security",
      "cover_image": "/assets/courses/infosec.jpg",
      
      "status": "in-progress",
      "overall_progress_percentage": 35,
      
      "lessons_completed": 7,
      "total_lessons": 20,
      "tokens_earned": 280,
      
      "next_lesson": {
        "id": "infosec-m01-l03",
        "title": "Threats, Vulnerabilities, and Risk",
        "module_title": "Security Mindset & Core Principles"
      }
    }
  ],
  "tokenBalance": 280
}
```

### SQL Query for Backend

Here's the query your backend should use:

```sql
-- Get enrolled courses with progress
SELECT 
  t.id,
  t.title,
  t.slug,
  t.level,
  t.description,
  t.meta->>'cover_image' as cover_image,
  
  ute.status,
  ute.overall_progress_percentage,
  
  -- Count completed lessons
  (SELECT COUNT(*) 
   FROM user_lesson_progress ulp
   JOIN lessons l ON ulp.lesson_id = l.id
   JOIN modules m ON l.module_id = m.id
   WHERE ulp.user_id = $1 
     AND ulp.status = 'completed' 
     AND m.track_id = t.id) as lessons_completed,
  
  -- Count total required lessons
  (SELECT COUNT(*) 
   FROM lessons l
   JOIN modules m ON l.module_id = m.id
   WHERE m.track_id = t.id 
     AND l.is_required = true) as total_lessons,
  
  -- Sum tokens earned
  (SELECT COALESCE(SUM(ulp.tokens_earned), 0) 
   FROM user_lesson_progress ulp
   JOIN lessons l ON ulp.lesson_id = l.id
   JOIN modules m ON l.module_id = m.id
   WHERE ulp.user_id = $1 
     AND m.track_id = t.id) as tokens_earned,
  
  -- Get next lesson details
  nl.id as next_lesson_id,
  nl.title as next_lesson_title,
  nm.title as next_module_title
  
FROM tracks t
JOIN user_track_enrollments ute ON t.id = ute.track_id
LEFT JOIN lessons nl ON nl.id = ute.current_lesson_id
LEFT JOIN modules nm ON nl.module_id = nm.id
WHERE ute.user_id = $1
  AND t.is_published = true
ORDER BY ute.enrolled_at DESC;
```

Then format it as JSON:

```javascript
app.get('/api/user/courses', authenticateToken, async (req, res) => {
    const userId = req.user.id;
    
    try {
        // Get courses
        const { data: courses, error: coursesError } = await supabase
            .rpc('get_user_courses', { p_user_id: userId });
        
        // Get token balance
        const { data: tokens, error: tokensError } = await supabase
            .from('user_tokens')
            .select('tokens_available')
            .eq('user_id', userId)
            .single();
        
        const myCourses = courses.map(course => ({
            id: course.id,
            title: course.title,
            slug: course.slug,
            level: course.level,
            description: course.description,
            cover_image: course.cover_image || `/assets/courses/${course.slug}.jpg`,
            
            status: course.status || 'not-started',
            overall_progress_percentage: course.overall_progress_percentage || 0,
            
            lessons_completed: course.lessons_completed || 0,
            total_lessons: course.total_lessons || 0,
            tokens_earned: course.tokens_earned || 0,
            
            next_lesson: course.next_lesson_id ? {
                id: course.next_lesson_id,
                title: course.next_lesson_title,
                module_title: course.next_module_title
            } : null
        }));
        
        res.json({
            myCourses,
            tokenBalance: tokens?.tokens_available || 0
        });
        
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Failed to fetch courses' });
    }
});
```

---

## 🧪 TESTING CHECKLIST

### Test 1: Database Check
```sql
-- Should return your enrolled courses
SELECT * FROM user_track_enrollments WHERE user_id = 'your-user-id';

-- Should return your token balance
SELECT * FROM user_tokens WHERE user_id = 'your-user-id';
```

### Test 2: Backend API Check
```bash
# Test the endpoint
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/user/courses
```

Should return JSON with `myCourses` array and `tokenBalance`.

### Test 3: Frontend Check

1. Login to your app
2. Click "My Courses" in sidebar
3. Open browser console (F12)
4. Should see:
   ```
   ✅ My Courses Enhanced (REVISED - DB Schema Compatible) loaded
   ```
5. Courses should appear in three sections:
   - Foundation
   - Intermediate
   - Advanced

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Failed to load courses"

**Solution 1:** Check backend is returning correct format
```javascript
// In browser console
fetch('http://localhost:3000/api/user/courses', {
    headers: { 'Authorization': `Bearer ${localStorage.getItem('sentinel_token')}` }
})
.then(r => r.json())
.then(data => console.log(data));
```

**Solution 2:** Check for CORS errors in console

**Solution 3:** Verify user is enrolled in at least one course
```sql
SELECT * FROM user_track_enrollments WHERE user_id = 'your-user-id';
```

### Issue: "Courses showing in wrong section"

**Check:** Database `level` values
```sql
SELECT id, title, level FROM tracks;
```

Should be: `foundation`, `intermediate`, or `advanced` (lowercase)

### Issue: "Progress not updating"

**Check:** User lesson progress
```sql
SELECT * FROM user_lesson_progress WHERE user_id = 'your-user-id';
```

**Check:** Track progress calculation
```sql
SELECT * FROM calculate_track_progress('your-user-id', 'infosec');
```

---

## 🎯 WHAT'S DIFFERENT FROM ORIGINAL

| Original | Revised | Reason |
|----------|---------|--------|
| `category` field | `level` field | Matches DB schema |
| `fundamentals` | `foundation` | Matches DB enum values |
| Static stats | Calculated stats | Uses real progress data |
| Hardcoded data | API-driven | Real backend integration |

---

## ✅ FINAL CHECKLIST

Before going live:

- [ ] Updated HTML to use `foundation` instead of `fundamentals`
- [ ] Added `advanced-section` to HTML
- [ ] Copied `my-courses-enhanced-REVISED.js` to `/frontend/`
- [ ] Added script tags to `index.html`
- [ ] Updated CSS section
- [ ] Removed old My Courses JavaScript
- [ ] Backend returns data in correct format
- [ ] Tested with real user account
- [ ] Courses display in correct sections
- [ ] Progress bars animate
- [ ] Token counter updates
- [ ] "Continue Learning" button works
- [ ] No console errors

---

## 🚀 NEXT STEPS

Once My Courses is working:

1. **Build infoSec.html** - Split-view lesson player
2. **Add lesson content** - Markdown files in `/content/`
3. **Test complete flow** - Enroll → Learn → Complete → Earn Tokens

---

**You now have a database-accurate, production-ready My Courses section! 🎉**

Any questions? Check the inline comments in `my-courses-enhanced-REVISED.js` - they explain exactly how it maps to your database schema.## Folder Structure

- `backend/` API server and business logic
- `frontend/` HTML/CSS/JS client
- `database/` SQL schema and policies
- `curriculum/` course design notes
- `labs/` lab specs and drafts
- `content/` lesson markdown and simulation JSON
- `assets/` shared images and logos
- `docs/` project documentation index
- `scripts/` developer utilities
- `tools/` local tooling helpers
- `tests/` automated tests
- `config/` config templates and examples

Local-only (gitignored):
- `.temp/` temporary files
- `logs/` runtime logs
- `infra/` local infrastructure experiments
- `design/` local design explorations
