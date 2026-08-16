# היום שלי — Freelance Hub (v1)

אפליקציה אישית לניהול לקוחות ולימודים. נבנתה עם Next.js (App Router), TypeScript, Tailwind CSS ו-Supabase.

## הרצה מקומית

1. **התקנת תלויות:**
   ```bash
   npm install
   ```

2. **יצירת פרויקט Supabase:**
   - היכנסי ל-[supabase.com](https://supabase.com) וצרי פרויקט חדש.
   - בלשונית SQL Editor, הריצי את כל התוכן של `supabase/schema.sql` — זה ייצור את כל הטבלאות, ה-RLS וה-indexes.
   - בלשונית Authentication → Providers, ודאי ש-Email מופעל (עם או בלי אימות סיסמה, לבחירתך — האפליקציה תומכת גם בקישור קסם וגם בסיסמה).

3. **משתני סביבה:**
   - העתיקי את `.env.local.example` ל-`.env.local`.
   - מלאי את `NEXT_PUBLIC_SUPABASE_URL` ו-`NEXT_PUBLIC_SUPABASE_ANON_KEY` מתוך Project Settings → API בפרויקט ה-Supabase שלך.

4. **הרצה:**
   ```bash
   npm run dev
   ```
   האפליקציה תרוץ על http://localhost:3000 ותפנה אוטומטית ל-`/login`.

5. **יצירת משתמש:**
   - בעמוד ההתחברות, הזיני אימייל וסיסמה ולחצי "כניסה" (אם זה משתמש חדש, ניתן ליצור אותו ידנית ב-Supabase Authentication → Users, או להשתמש בקישור הקסם לאימייל).

## פריסה ל-Vercel

1. דחפי את הפרויקט ל-GitHub.
2. ב-Vercel, ייבאי את הריפו.
3. הוסיפי את משתני הסביבה (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) בהגדרות הפרויקט ב-Vercel.
4. Deploy — זהו.

## מבנה הפרויקט

- `app/(auth)/login` — מסך כניסה
- `app/(main)` — כל המסכים הראשיים (היום, לקוחות, לימודים, שבוע, הגדרות), עטופים ב-layout עם הסיידבר
- `components/` — כל רכיבי ה-UI, מאורגנים לפי תחום (tasks, clients, studies, week, ui)
- `lib/supabase` — חיבור ל-Supabase (client + server) וטיפוסים
- `lib/queries` — כל הפעולות מול מסד הנתונים (CRUD)
- `supabase/schema.sql` — הסכמה המלאה להרצה ב-Supabase

## מה כלול בגרסה 1

✅ היום שלי — 4 סקשנים, הוספת משימה מהירה
✅ לקוחות — רשימה + עמוד לקוח עם 5 טאבים (יומי, חודשי, משימות, תוכן, הערות)
✅ לימודים — קורסים, הגשות, משימות לימודים
✅ שבוע — תצוגה שבועית ויזואלית
✅ הגדרות — בסיסי (חשבון)
✅ RTL מלא, עברית בלבד, עיצוב קליל עם כרטיסים

## מה לא כלול עדיין (לגרסה הבאה)

- תצוגת מובייל מותאמת (כרגע desktop-first בלבד כפי שביקשת)
- ניהול קטגוריות/צבעים מתקדם בהגדרות
- מחיקת לקוחות/קורסים מהממשק (כרגע רק דרך Supabase ישירות)
