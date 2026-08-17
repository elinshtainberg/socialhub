export type TaskCategory = "client" | "study" | "personal" | "workout";
export type TaskPriority = "low" | "medium" | "urgent";
export type TaskStatus = "open" | "in_progress" | "done";
export type ContentType = "post" | "reel" | "story";
export type SocialPlatform = "instagram" | "tiktok" | "facebook" | "general";
export type ContentStatus = "idea" | "in_progress" | "done" | "future";
export type ClientType = "ongoing" | "one_time";
export type InvoiceStatus = "not_issued" | "sent" | "paid";

// Unified calendar item type — used by ALL calendar views:
// client monthly tab, /month, and /week day panels.
// "post" | "reel" | "story" originated in the client monthly tab;
// "holiday" | "event" originated in the general month page;
// "meeting" | "shoot" exist in both.
// Having one enum eliminates the two-silo architecture bug.
export type CalendarItemType =
  | "post"      // פוסט
  | "reel"      // ריל
  | "story"     // סטורי
  | "tiktok"    // טיקטוק
  | "other"     // תוכן אחר
  | "holiday"   // חג
  | "event"     // אירוע
  | "meeting"   // פגישה
  | "shoot"     // יום צילום
  | "workout";  // אימון

// Content deliverable types — a subset of CalendarItemType that always
// belongs to a client. These are scheduling entries, not tasks: they have
// no status/completion. "Did I post it" is tracked by marking the day off
// the calendar, same as a meeting or shoot.
export const CONTENT_CALENDAR_TYPES: CalendarItemType[] = ["post", "reel", "story", "tiktok", "other"];

export interface Client {
  id: string;
  user_id: string;
  name: string;
  business_name: string | null;
  client_type: ClientType;
  monthly_retainer: number | null;
  project_date: string | null;
  content_summary: string | null;
  color: string;
  created_at: string;
  // Billing info — single source of truth used by Invoices page
  billing_name: string | null; // official name on invoice (may differ from display name)
  company_id: string | null;   // ח.פ / עוסק מורשה (text, may have leading zeroes)
  // Social / external links
  drive_url: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  // CRM
  next_action: string | null;
}

export interface ClientCollab {
  id: string;
  client_id: string;
  name: string;
  handle: string;
  platforms: string[];
  type: string;
  status: string;
  last_post: string | null;
  amount: string;
  notes: string;
  created_at: string;
}

export interface Study {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
  semester_start: string | null;
  semester_end: string | null;
  course_number: string | null;
  lecturer: string | null;
  credits: number | null;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category: TaskCategory;
  client_id: string | null;
  study_id: string | null;
  project_id: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  is_daily: boolean;
  sort_order: number;
  created_at: string;
  // Optional workout-context fields (duration/notes). Generic on the model,
  // but only surfaced in the UI for category === "workout".
  duration_minutes: number | null;
  notes: string | null;
  // Workout-specific type tag. String (not enum) so new types can be added
  // without a schema migration. Null for all non-workout tasks.
  workout_type: string | null;
  google_task_id?: string | null;
  google_task_list_id?: string | null;
}

export interface ContentItem {
  id: string;
  user_id: string;
  client_id: string;
  title: string;
  type: ContentType;
  platform: SocialPlatform;
  status: ContentStatus;
  created_at: string;
}

// Single unified calendar item. Used everywhere — client monthly tab,
// /month, /week. Items with client_id show in that client's tab AND in the
// global views. Items without client_id are global-only.
export interface CalendarItem {
  id: string;
  user_id: string;
  date: string; // "YYYY-MM-DD"
  type: CalendarItemType;
  title: string;
  notes: string | null;
  client_id: string | null;
  project_id: string | null;
  start_time: string | null; // "HH:MM"
  google_event_id?: string | null;
  source?: "google"; // marked on items imported from Google Calendar
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  main_goal: string;
  description: string | null;
  deadline: string | null; // "YYYY-MM-DD"
  budget: number | null;
  created_at: string;
}

export interface Note {
  id: string;
  user_id: string;
  client_id: string;
  content: string;
  updated_at: string;
}

export type StudyItemType = "deadline" | "assignment" | "exam";

export type AssignmentStatus = "not_started" | "in_progress" | "submitted";

export interface StudyDeadline {
  id: string;
  user_id: string;
  study_id: string;
  title: string;
  due_date: string | null;
  planned_hours: number | null;
  item_type: StudyItemType;
  notes: string | null;
  submission_status: AssignmentStatus | null;
  grade: string | null;
  weight: number | null; // % of final grade
}

export interface Invoice {
  id: string;
  user_id: string;
  client_id: string;
  month: string; // "YYYY-MM"
  description: string;
  amount: number | null;
  tax_id: string | null;
  status: InvoiceStatus;
  notes: string | null;
}

export type Database = {
  public: {
    Tables: {
      clients: { Row: Client; Insert: Partial<Client>; Update: Partial<Client> };
      studies: { Row: Study; Insert: Partial<Study>; Update: Partial<Study> };
      tasks: { Row: Task; Insert: Partial<Task>; Update: Partial<Task> };
      content_items: { Row: ContentItem; Insert: Partial<ContentItem>; Update: Partial<ContentItem> };
      calendar_items: { Row: CalendarItem; Insert: Partial<CalendarItem>; Update: Partial<CalendarItem> };
      notes: { Row: Note; Insert: Partial<Note>; Update: Partial<Note> };
      study_deadlines: { Row: StudyDeadline; Insert: Partial<StudyDeadline>; Update: Partial<StudyDeadline> };
      invoices: { Row: Invoice; Insert: Partial<Invoice>; Update: Partial<Invoice> };
    };
  };
};
