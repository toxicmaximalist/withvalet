import {
  CalendarDays,
  ChevronRight,
  Link2,
  Mail,
  Phone,
  Send,
  StickyNote,
} from "lucide-react";

import { getActivityContentText } from "@/lib/activity-content";
import { ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { ActivityListItem } from "@/lib/data";
import type { Database } from "@/types/database";

type ActivityFeedTableProps = {
  activities: ActivityListItem[];
  onSelect: (activity: ActivityListItem) => void;
};

export function ActivityFeedTable({
  activities,
  onSelect,
}: ActivityFeedTableProps) {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/8 bg-[#0f1012]">
      <div className="hidden grid-cols-[84px_minmax(0,1fr)_minmax(0,1.15fr)_120px_150px_32px] gap-4 border-b border-white/8 px-5 py-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground lg:grid">
        <span>Type</span>
        <span>Contact</span>
        <span>Content</span>
        <span>Status</span>
        <span>Date</span>
        <span />
      </div>

      <div className="divide-y divide-white/8">
        {activities.map((activity) => (
          <button
            key={activity.id}
            type="button"
            onClick={() => {
              if (isOptimisticActivityId(activity.id)) {
                return;
              }

              onSelect(activity);
            }}
            disabled={isOptimisticActivityId(activity.id)}
            className="group grid w-full gap-3 bg-[#0f1012] px-4 py-4 text-left hover:bg-[#15171b] disabled:cursor-wait disabled:opacity-70 disabled:hover:bg-[#0f1012] lg:grid-cols-[84px_minmax(0,1fr)_minmax(0,1.15fr)_120px_150px_32px] lg:items-center lg:gap-4 lg:px-5"
          >
            <div className="flex items-center gap-3 lg:gap-2">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-[#17191d] text-muted">
                <ActivityTypeIcon type={activity.type} className="size-4" />
              </div>
              <span className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                {ACTIVITY_TYPE_LABELS[activity.type]}
              </span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {activity.contactName ?? "Unknown contact"}
                </span>
                {activity.organizationName ? (
                  <span className="truncate text-xs text-muted">
                    {activity.organizationName}
                  </span>
                ) : null}
              </div>
            </div>

            <p className="line-clamp-3 min-w-0 whitespace-pre-wrap break-words text-sm leading-6 text-muted lg:line-clamp-2">
              {getActivityContentText(activity.content)}
            </p>

            <div>
              <ActivityStatusBadge status={activity.status} />
            </div>

            <div className="text-xs text-muted-foreground">
              {isOptimisticActivityId(activity.id)
                ? "Saving..."
                : formatDate(activity.activity_date, "No date", "MMM d, yyyy")}
            </div>

            <div className="flex justify-end">
              <ChevronRight className="size-4 shrink-0 text-muted transition group-hover:text-foreground group-disabled:text-muted/40" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function isOptimisticActivityId(id: string) {
  return id.startsWith("temp-activity-");
}

const ACTIVITY_STATUS_STYLES: Record<
  Database["public"]["Enums"]["activity_status"],
  string
> = {
  planned: "border-white/10 bg-white/6 text-white",
  sent: "border-accent/20 bg-accent/10 text-accent-foreground",
  replied: "border-sky-500/25 bg-sky-500/10 text-sky-200",
  followed_up_1: "border-amber-500/25 bg-amber-500/10 text-amber-200",
  followed_up_2: "border-orange-500/25 bg-orange-500/10 text-orange-200",
};

function ActivityStatusBadge({
  status,
}: {
  status: Database["public"]["Enums"]["activity_status"];
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${ACTIVITY_STATUS_STYLES[status]}`}
    >
      {ACTIVITY_STATUS_LABELS[status]}
    </span>
  );
}

function ActivityTypeIcon({
  className,
  type,
}: {
  className?: string;
  type: ActivityListItem["type"];
}) {
  const Icon = {
    call: Phone,
    demo: CalendarDays,
    email: Mail,
    follow_up: StickyNote,
    linkedin_message: Link2,
    telegram_message: Send,
  }[type];

  return <Icon className={className} />;
}
