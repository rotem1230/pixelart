# הגדרת Supabase לסנכרון אוטומטי בין מחשבים

## מה זה Supabase?
Supabase הוא מסד נתונים PostgreSQL בענן עם API מובנה. זה מאפשר לאפליקציה לעבוד ישירות עם מסד הנתונים ללא צורך בשרת backend.

## יתרונות:
✅ **ללא שרת** - עובד ישירות מהדפדפן
✅ **סנכרון אוטומטי** - נתונים מסונכרנים בין כל המחשבים
✅ **חינמי** - עד 500MB ו-2GB bandwidth בחודש
✅ **מהיר** - PostgreSQL מהיר ואמין
✅ **אבטחה** - הצפנה מובנית

## הגדרה (5 דקות):

### 1. צור חשבון Supabase
1. עבור ל-[supabase.com](https://supabase.com)
2. לחץ על "Start your project"
3. התחבר עם GitHub או Google
4. צור פרויקט חדש:
   - שם: `pixelart-vj`
   - סיסמה: בחר סיסמה חזקה (שמור אותה!)
   - אזור: בחר הקרוב אליך

### 2. צור טבלאות
1. בפאנל של Supabase, עבור ל-"SQL Editor"
2. הדבק את הקוד הבא ולחץ "Run":

```sql
-- Create users table
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create user_data table
CREATE TABLE user_data (
  id SERIAL PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  entity_id VARCHAR(255) NOT NULL,
  data TEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (user_id, entity_name, entity_id)
);

-- Create default users
INSERT INTO users (id, email, password, name, role) VALUES 
('admin_1', 'pixelartvj@gmail.com', '$2b$10$example_hash_here', 'Pixel Art VJ', 'admin'),
('admin_2', 'pixeloffice2025@gmail.com', '$2b$10$example_hash_here', 'Pixel Office 2025', 'user');

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for now)
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on user_data" ON user_data FOR ALL USING (true);
```

### 3. קבל את פרטי החיבור
1. עבור ל-"Settings" → "API"
2. העתק:
   - **Project URL** (משהו כמו: `https://abcdefgh.supabase.co`)
   - **anon public key** (מפתח ארוך שמתחיל ב-`eyJ...`)

### 4. הגדר את האפליקציה
1. צור קובץ `.env` בתיקיית הפרויקט:
```bash
cp .env.example .env
```

2. ערוך את `.env` והוסף את הפרטים:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 5. הפעל את האפליקציה
```bash
npm run dev
```

## זהו! 🎉

עכשיו האפליקציה תעבוד עם Supabase:
- ✅ נתונים נשמרים בענן
- ✅ סנכרון אוטומטי בין מחשבים
- ✅ ללא צורך בשרת נוסף
- ✅ עובד מכל מקום עם אינטרנט

## בדיקה:
1. צור משימות או אירועים במחשב אחד
2. פתח את האפליקציה במחשב אחר
3. היכנס עם אותם פרטי משתמש
4. תראה את כל הנתונים! 🚀

## פתרון בעיות:
- **שגיאת חיבור**: בדוק שה-URL וה-API key נכונים
- **אין נתונים**: בדוק שהטבלאות נוצרו נכון
- **שגיאת הרשאות**: בדוק שה-RLS policies מוגדרות נכון
