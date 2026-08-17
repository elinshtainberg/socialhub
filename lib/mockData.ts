import type {
  CalendarItem,
  Client,
  ContentItem,
  Invoice,
  Note,
  Project,
  Study,
  StudyDeadline,
  Task,
} from "@/lib/supabase/types";

import { localDateStr } from "@/lib/utils";

// Set to true while previewing without real Supabase keys.
// Flip to false (or delete the override) once real auth + env keys are wired up.
export const USE_MOCK_DATA = false;

const todayISO = localDateStr(new Date());
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowISO = localDateStr(tomorrow);

export const mockClients: Client[] = [
  {
    id: "client-1",
    user_id: "mock-user",
    name: "סטודיו לונה",
    business_name: "לונה דיגיטל בע\"מ",
    client_type: "ongoing",
    monthly_retainer: 3500,
    project_date: null,
    content_summary: "3 סטוריז ביום, 2 פוסטים בשבוע, ריל אחד",
    color: "purple",
    created_at: todayISO,
    billing_name: "לונה דיגיטל בע\"מ",
    company_id: "514123456",
    drive_url: "https://drive.google.com",
    instagram_url: "https://instagram.com/studioLuna",
    tiktok_url: "https://tiktok.com/@studioLuna",
    facebook_url: "https://facebook.com/studioLuna",
    linkedin_url: null,
    next_action: null,
  },
  {
    id: "client-2",
    user_id: "mock-user",
    name: "קליניקת נופר",
    business_name: null,
    client_type: "ongoing",
    monthly_retainer: 2200,
    project_date: null,
    content_summary: "פוסט שבועי + סטורי יומי",
    color: "pink",
    created_at: todayISO,
    billing_name: null,
    company_id: "302456789",
    drive_url: null,
    instagram_url: "https://instagram.com/nofarClinic",
    tiktok_url: "https://tiktok.com/@nofarClinic",
    facebook_url: null,
    linkedin_url: null,
    next_action: null,
  },
  {
    id: "client-3",
    user_id: "mock-user",
    name: "חתונה של דנה ויונתן",
    business_name: null,
    client_type: "one_time",
    monthly_retainer: 4800,
    project_date: tomorrowISO,
    content_summary: "צילום חתונה + עריכת היילייטס",
    color: "blue",
    created_at: todayISO,
    billing_name: null,
    company_id: null,
    drive_url: null,
    instagram_url: null,
    tiktok_url: null,
    facebook_url: null,
    linkedin_url: null,
    next_action: null,
  },
];

export const mockStudies: Study[] = [
  { id: "study-1", user_id: "mock-user", name: "עיצוב UX מתקדם", color: "blue", created_at: todayISO },
  { id: "study-2", user_id: "mock-user", name: "שיווק דיגיטלי", color: "blue", created_at: todayISO },
];

export const mockProjects: Project[] = [
  {
    id: "project-1",
    user_id: "mock-user",
    name: "מציאת דירה",
    color: "blue",
    main_goal: "למצוא דירה עד סוף ספטמבר",
    description: "חיפוש דירה באזור המרכז, 3 חדרים, תקציב עד 7000 ₪",
    deadline: "2026-09-30",
    budget: 12000,
    created_at: todayISO,
  },
  {
    id: "project-2",
    user_id: "mock-user",
    name: "שיפוץ הסלון",
    color: "orange",
    main_goal: "לשפץ ולעדכן את הסלון",
    description: null,
    deadline: null,
    budget: 8000,
    created_at: todayISO,
  },
];

// Free-text notes per project — keyed by project id.
export const mockProjectNotes: Record<string, string> = {
  "project-1": "לבדוק את שכונת פלורנטין ודיזנגוף",
};

export const mockTasks: Task[] = [
  {
    id: "task-1",
    user_id: "mock-user",
    title: "להעלות סטורי לסטודיו לונה",
    category: "client",
    client_id: "client-1",
    study_id: null,
    project_id: null,
    due_date: todayISO,
    priority: "medium",
    status: "open",
    is_daily: true,
    sort_order: 1,
    duration_minutes: null,
    notes: null,
    workout_type: null,
    created_at: todayISO,
  },
  {
    id: "task-2",
    user_id: "mock-user",
    title: "לשלוח חשבונית לקליניקת נופר",
    category: "client",
    client_id: "client-2",
    study_id: null,
    project_id: null,
    due_date: todayISO,
    priority: "urgent",
    status: "open",
    is_daily: false,
    sort_order: 2,
    duration_minutes: null,
    notes: null,
    workout_type: null,
    created_at: todayISO,
  },
  {
    id: "task-3",
    user_id: "mock-user",
    title: "להגיש תרגיל UX",
    category: "study",
    client_id: null,
    study_id: "study-1",
    project_id: null,
    due_date: tomorrowISO,
    priority: "medium",
    status: "open",
    is_daily: false,
    sort_order: 3,
    duration_minutes: null,
    notes: null,
    workout_type: null,
    created_at: todayISO,
  },
  {
    id: "task-4",
    user_id: "mock-user",
    title: "לקבוע פגישה עם רואה חשבון",
    category: "personal",
    client_id: null,
    study_id: null,
    project_id: null,
    due_date: null,
    priority: "low",
    status: "open",
    is_daily: false,
    sort_order: 4,
    duration_minutes: null,
    notes: null,
    workout_type: null,
    created_at: todayISO,
  },
  {
    id: "task-5",
    user_id: "mock-user",
    title: "ריצה בפארק",
    category: "workout",
    client_id: null,
    study_id: null,
    project_id: null,
    due_date: todayISO,
    priority: "medium",
    status: "open",
    is_daily: false,
    sort_order: 5,
    duration_minutes: 30,
    notes: null,
    workout_type: "running",
    created_at: todayISO,
  },
  {
    id: "task-6",
    user_id: "mock-user",
    title: "פלג גוף עליון",
    category: "workout",
    client_id: null,
    study_id: null,
    project_id: null,
    due_date: tomorrowISO,
    priority: "medium",
    status: "open",
    is_daily: false,
    sort_order: 6,
    duration_minutes: 45,
    notes: "להביא כפפות",
    workout_type: "strength",
    created_at: todayISO,
  },
  {
    id: "task-7",
    user_id: "mock-user",
    title: "יוגה בוקר",
    category: "workout",
    client_id: null,
    study_id: null,
    project_id: null,
    due_date: todayISO,
    priority: "low",
    status: "done",
    is_daily: false,
    sort_order: 7,
    duration_minutes: 20,
    notes: null,
    workout_type: "yoga",
    created_at: todayISO,
  },
];

export const mockContentItems: ContentItem[] = [
  {
    id: "content-1",
    user_id: "mock-user",
    client_id: "client-1",
    title: "ריל - מאחורי הקלעים בסטודיו",
    type: "reel",
    platform: "instagram",
    status: "idea",
    created_at: todayISO,
  },
  {
    id: "content-2",
    user_id: "mock-user",
    client_id: "client-1",
    title: "פוסט השקת קולקציה חדשה",
    type: "post",
    platform: "facebook",
    status: "in_progress",
    created_at: todayISO,
  },
  {
    id: "content-3",
    user_id: "mock-user",
    client_id: "client-1",
    title: "טיקטוק - ״יום בחיים של מעצבת״",
    type: "reel",
    platform: "tiktok",
    status: "idea",
    created_at: todayISO,
  },
  {
    id: "content-4",
    user_id: "mock-user",
    client_id: "client-2",
    title: "פוסט שבועי - טיפ לשמירה על בריאות הגב",
    type: "post",
    platform: "instagram",
    status: "done",
    created_at: todayISO,
  },
  {
    id: "content-5",
    user_id: "mock-user",
    client_id: "client-2",
    title: "טיקטוק - ״3 תרגילים בבית״",
    type: "reel",
    platform: "tiktok",
    status: "in_progress",
    created_at: todayISO,
  },
];

export const mockNotes: Note[] = [
  { id: "note-1", user_id: "mock-user", client_id: "client-1", content: "ללקוחה יש העדפה לטונים פסטליים.", updated_at: todayISO },
];

export const mockDeadlines: StudyDeadline[] = [
  { id: "deadline-1", user_id: "mock-user", study_id: "study-1", title: "פרויקט גמר", due_date: tomorrowISO, planned_hours: 6, item_type: "assignment", notes: null },
  { id: "deadline-2", user_id: "mock-user", study_id: "study-1", title: "מבחן אמצע סמסטר", due_date: null, planned_hours: null, item_type: "exam", notes: "חומר פתוח" },
  { id: "deadline-3", user_id: "mock-user", study_id: "study-2", title: "ממ\"ן 11", due_date: tomorrowISO, planned_hours: 4, item_type: "assignment", notes: null },
];

const now = new Date();
const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

export const mockInvoices: Invoice[] = [
  {
    id: "invoice-1",
    user_id: "mock-user",
    client_id: "client-1",
    month: currentMonthStr,
    description: "ניהול תוכן חודשי - סושיאל",
    amount: 3500,
    tax_id: "514123456",
    status: "sent",
    notes: null,
  },
];

// Single shared calendar items array — used by ALL views:
// client monthly tab (filters by client_id), /month, /week.
// Items with client_id appear in both the client tab and global views.
// Items without client_id are global-only.
export const mockCalendarItems: CalendarItem[] = [
  {
    id: "calitem-1",
    user_id: "mock-user",
    date: tomorrowISO,
    type: "shoot",
    title: "צילום תוכן לסטודיו לונה",
    notes: null,
    client_id: "client-1",
    project_id: null,
  },
  {
    id: "calitem-2",
    user_id: "mock-user",
    date: todayISO,
    type: "post",
    title: "פוסט שבועי קליניקת נופר",
    notes: null,
    client_id: "client-2",
    project_id: null,
  },
];
