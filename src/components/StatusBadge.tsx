import { Badge } from "@/components/ui";
import {
  LEAD_STATUS_LABELS,
  STUDENT_STATUS_LABELS,
  MODULE_STATUS_LABELS,
  ATTENDANCE_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  PORTFOLIO_STATUS_LABELS,
  CERTIFICATE_STATUS_LABELS,
  EMI_STATUS_LABELS,
  LEAD_SOURCE_LABELS,
  PAYMENT_MODE_LABELS,
  DIFFICULTY_LABELS,
  COURSE_STATUS_LABELS,
} from "@/lib/constants";

const toneMap: Record<string, string> = {
  // Lead
  NEW: "blue",
  CONTACTED: "brand",
  INTERESTED: "violet",
  DEMO_SCHEDULED: "amber",
  DEMO_ATTENDED: "teal",
  FOLLOW_UP: "amber",
  CONVERTED: "green",
  NOT_INTERESTED: "slate",
  LOST: "red",
  // Student
  ACTIVE: "green",
  IN_PROGRESS: "blue",
  ON_HOLD: "amber",
  COMPLETED: "teal",
  CERTIFICATE_ISSUED: "brand",
  DROPPED: "red",
  // Module
  YET_TO_START: "slate",
  // Class / attendance
  PENDING: "slate",
  PRESENT: "green",
  ABSENT: "red",
  RESCHEDULED: "amber",
  CANCELLED: "slate",
  // Project
  SUBMITTED: "blue",
  INTERNAL_FEEDBACK: "amber",
  REWORK_REQUIRED: "red",
  APPROVED: "green",
  // Portfolio
  UNDER_REVIEW: "amber",
  // Certificate
  NOT_ELIGIBLE: "slate",
  ELIGIBLE: "green",
  GENERATED: "blue",
  ISSUED: "brand",
  // EMI
  PAID: "green",
  PARTIAL: "amber",
  OVERDUE: "red",
  // Course
  INACTIVE: "slate",
  ARCHIVED: "slate",
};

export function statusLabel(status: string): string {
  return (
    LEAD_STATUS_LABELS[status] ||
    STUDENT_STATUS_LABELS[status] ||
    MODULE_STATUS_LABELS[status] ||
    ATTENDANCE_STATUS_LABELS[status] ||
    PROJECT_STATUS_LABELS[status] ||
    PORTFOLIO_STATUS_LABELS[status] ||
    CERTIFICATE_STATUS_LABELS[status] ||
    EMI_STATUS_LABELS[status] ||
    LEAD_SOURCE_LABELS[status] ||
    PAYMENT_MODE_LABELS[status] ||
    DIFFICULTY_LABELS[status] ||
    COURSE_STATUS_LABELS[status] ||
    status.replace(/_/g, " ")
  );
}

export function StatusBadge({ status, kind }: { status: string; kind?: string }) {
  const key = kind ? `${kind}_${status}` : status;
  // kind-specific overrides if needed
  const tone = toneMap[status] || "slate";
  return <Badge tone={tone}>{statusLabel(status)}</Badge>;
}
