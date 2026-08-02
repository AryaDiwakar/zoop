export const ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
  COUNSELLOR: "COUNSELLOR",
  TUTOR: "TUTOR",
  FINANCE: "FINANCE",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Admin",
  COUNSELLOR: "Counsellor",
  TUTOR: "Tutor",
  FINANCE: "Finance",
};

export const LEAD_SOURCES = [
  "FACEBOOK",
  "INSTAGRAM",
  "GOOGLE_ADS",
  "WEBSITE",
  "WALK_IN",
  "PHONE",
  "REFERRAL",
  "OTHER",
] as const;

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "DEMO_SCHEDULED",
  "DEMO_ATTENDED",
  "FOLLOW_UP",
  "CONVERTED",
  "NOT_INTERESTED",
  "LOST",
] as const;

export const STUDENT_STATUSES = [
  "ACTIVE",
  "IN_PROGRESS",
  "ON_HOLD",
  "COMPLETED",
  "CERTIFICATE_ISSUED",
  "DROPPED",
] as const;

export const MODULE_STATUSES = ["YET_TO_START", "IN_PROGRESS", "COMPLETED"] as const;

export const ATTENDANCE_STATUSES = [
  "PENDING",
  "PRESENT",
  "ABSENT",
  "RESCHEDULED",
  "CANCELLED",
] as const;

export const PROJECT_STATUSES = [
  "YET_TO_START",
  "IN_PROGRESS",
  "SUBMITTED",
  "INTERNAL_FEEDBACK",
  "REWORK_REQUIRED",
  "APPROVED",
] as const;

export const PORTFOLIO_STATUSES = [
  "YET_TO_START",
  "IN_PROGRESS",
  "SUBMITTED",
  "UNDER_REVIEW",
  "APPROVED",
] as const;

export const CERTIFICATE_STATUSES = [
  "NOT_ELIGIBLE",
  "ELIGIBLE",
  "GENERATED",
  "ISSUED",
] as const;

export const EMI_STATUSES = ["PENDING", "PAID", "PARTIAL", "OVERDUE"] as const;

export const PAYMENT_MODES = ["CASH", "UPI", "CARD", "BANK_TRANSFER", "CHEQUE"] as const;

export const PAYMENT_TYPES = ["LUMPSUM", "EMI"] as const;

export const CONTACT_METHODS = ["PHONE", "WHATSAPP", "EMAIL", "VISIT", "OTHER"] as const;

export const DIFFICULTY = ["BEGINNER", "INTERMEDIATE", "ADVANCED"] as const;

export const COURSE_STATUSES = ["ACTIVE", "INACTIVE", "ARCHIVED"] as const;

export const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DEFAULT_ACADEMIC_STATUS = {
  ACTIVE: "ACTIVE",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  ON_HOLD: "ON_HOLD",
  CERTIFICATE_ISSUED: "CERTIFICATE_ISSUED",
  DROPPED: "DROPPED",
};

// Human readable labels -----------------------------------------------------

export const LEAD_SOURCE_LABELS: Record<string, string> = {
  FACEBOOK: "Facebook",
  INSTAGRAM: "Instagram",
  GOOGLE_ADS: "Google Ads",
  WEBSITE: "Website",
  WALK_IN: "Walk-in",
  PHONE: "Phone",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export const LEAD_STATUS_LABELS: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  INTERESTED: "Interested",
  DEMO_SCHEDULED: "Demo Scheduled",
  DEMO_ATTENDED: "Demo Attended",
  FOLLOW_UP: "Follow-up",
  CONVERTED: "Converted",
  NOT_INTERESTED: "Not Interested",
  LOST: "Lost",
};

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  IN_PROGRESS: "In Progress",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  CERTIFICATE_ISSUED: "Certificate Issued",
  DROPPED: "Dropped",
};

export const MODULE_STATUS_LABELS: Record<string, string> = {
  YET_TO_START: "Yet to Start",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PRESENT: "Present",
  ABSENT: "Absent",
  RESCHEDULED: "Rescheduled",
  CANCELLED: "Cancelled",
};

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  YET_TO_START: "Yet to Start",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  INTERNAL_FEEDBACK: "Internal Feedback",
  REWORK_REQUIRED: "Rework Required",
  APPROVED: "Approved",
};

export const PORTFOLIO_STATUS_LABELS: Record<string, string> = {
  YET_TO_START: "Yet to Start",
  IN_PROGRESS: "In Progress",
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
};

export const CERTIFICATE_STATUS_LABELS: Record<string, string> = {
  NOT_ELIGIBLE: "Not Eligible",
  ELIGIBLE: "Eligible",
  GENERATED: "Certificate Generated",
  ISSUED: "Certificate Issued",
};

export const EMI_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  PARTIAL: "Partial",
  OVERDUE: "Overdue",
};

export const PAYMENT_MODE_LABELS: Record<string, string> = {
  CASH: "Cash",
  UPI: "UPI",
  CARD: "Card",
  BANK_TRANSFER: "Bank Transfer",
  CHEQUE: "Cheque",
};

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  LUMPSUM: "Lump Sum",
  EMI: "EMI",
};

export const DIFFICULTY_LABELS: Record<string, string> = {
  BEGINNER: "Beginner",
  INTERMEDIATE: "Intermediate",
  ADVANCED: "Advanced",
};

export const COURSE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  ARCHIVED: "Archived",
};
