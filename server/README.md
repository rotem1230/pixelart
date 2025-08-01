# Pixel Art VJ - Backend Server

שרת Node.js עם MySQL לסנכרון נתונים בין מחשבים למערכת Pixel Art VJ.

## דרישות מוקדמות

### התקנת PostgreSQL

**אפשרות 1: הורדה ידנית**
1. **Windows**: הורד מ-[PostgreSQL Official](https://www.postgresql.org/download/windows/)
2. **macOS**: `brew install postgresql`
3. **Linux**: `sudo apt-get install postgresql postgresql-contrib`

**אפשרות 2: מנהלי חבילות**
- **Chocolatey**: `choco install postgresql`
- **Scoop**: `scoop install postgresql`

### הגדרה אוטומטית
```bash
npm run setup-db
```

### הגדרה ידנית
```sql
-- התחבר ל-PostgreSQL כ-postgres
psql -U postgres

-- צור משתמש חדש
CREATE USER pixelart_user WITH PASSWORD 'pixelart_password';

-- צור מסד נתונים
CREATE DATABASE pixelart_db OWNER pixelart_user;

-- תן הרשאות למשתמש
GRANT ALL PRIVILEGES ON DATABASE pixelart_db TO pixelart_user;
```

## התקנה והפעלה

### 1. התקנת תלויות
```bash
cd server
npm install
```

### 2. הגדרת PostgreSQL
```bash
npm run setup-db
```

### 3. הפעלת השרת
```bash
npm start
```

השרת יפעל על פורט 3001 ויציג את כתובות הרשת לגישה ממחשבים אחרים.

### הגדרת משתני סביבה (אופציונלי)
```bash
cp .env.example .env
# ערוך את .env עם פרטי ה-PostgreSQL שלך
```

## מה השרת עושה?

- **שמירת נתונים**: כל הנתונים נשמרים במסד נתונים MySQL
- **סנכרון בין מחשבים**: כשמשתמש נכנס ממחשב אחר, הוא רואה את כל הנתונים שלו
- **גישה רשתית**: מחשבים אחרים ברשת יכולים להתחבר לשרת
- **אימות משתמשים**: תמיכה במשתמשי ברירת המחדל
- **API מהיר**: עובד עם המערכת הקיימת ללא שינויים

## API Endpoints

- `GET /api/health` - בדיקת תקינות השרת
- `POST /api/auth/login` - התחברות משתמש
- `GET /api/sync/:entity/:userId` - קבלת נתונים לישות מסוימת
- `POST /api/sync/:entity/:userId` - שמירת נתונים לישות מסוימת
- `GET /api/sync/all/:userId` - קבלת כל הנתונים של המשתמש
- `DELETE /api/sync/:entity/:userId/:itemId` - מחיקת פריט מסוים

## משתמשי ברירת מחדל

השרת יוצר אוטומטית את המשתמשים הבאים:

**מנהל מערכת:**
- אימייל: `pixelartvj@gmail.com`
- סיסמה: `yvj{89kN$2.8`

**משתמש רגיל:**
- אימייל: `pixeloffice2025@gmail.com`
- סיסמה: `b)W17,>1@Z2C`

## קבצים

- `server.js` - השרת הראשי
- `.env` - הגדרות מסד הנתונים (צור מ-.env.example)
- `package.json` - הגדרות הפרויקט

## יתרונות MySQL

- **גישה רשתית**: מחשבים אחרים יכולים להתחבר מכל מקום
- **ביצועים גבוהים**: מהיר יותר מ-SQLite לכמויות נתונים גדולות
- **אמינות**: מסד נתונים מקצועי עם גיבויים אוטומטיים
- **סקלביליות**: תומך במספר רב של משתמשים בו-זמנית

## הערות

- השרת תומך בכמויות גדולות של נתונים (עד 50MB לבקשה)
- כל המידע מוצפן ומאובטח
- השרת עובד עם המערכת הקיימת ללא צורך בשינויים בקוד הלקוח
- MySQL מאפשר גישה ממחשבים אחרים ברשת אוטומטית
