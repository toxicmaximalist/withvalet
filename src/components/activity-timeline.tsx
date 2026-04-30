import { getActivityContentText } from "@/lib/activity-content";
import { ACTIVITY_STATUS_LABELS, ACTIVITY_TYPE_LABELS } from "@/lib/constants";
import { formatDate } from "@/lib/utils";
import type { Database } from "@/types/database";

export type TimelineActivity = {
  activity_date: string;
  contactName?: string;
  content: string;
  id: string;
  organizationName?: string | null;
  status: Database["public"]["Enums"]["activity_status"];
  type: Database["public"]["Enums"]["activity_type"];
};

export function ActivityTimeline({
  activities,
}: {
  activities: TimelineActivity[];
}) {
  if (!activities.length) {
    return (
      <div className="panel rounded-2xl px-4 py-5 text-sm text-muted">
        No outreach activity has been logged yet.
      </div>
    );
  }

  return (
    <div className="panel rounded-[28px] px-5 py-3">
      <div className="space-y-0">
        {activities.map((activity, index) => (
          <div key={activity.id} className="relative flex gap-4 py-5">
            <div className="flex w-6 flex-col items-center">
              <div className="mt-1 size-2.5 rounded-full bg-accent shadow-[0_0_18px_rgba(251,75,78,0.45)]" />
              {index < activities.length - 1 ? (
                <div className="mt-2 h-full w-px bg-white/10" />
              ) : null}
            </div>
            <div className="min-w-0 flex-1 rounded-[22px] border border-white/8 bg-white/[0.025] px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-white/4 px-2.5 py-1 text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  {ACTIVITY_TYPE_LABELS[activity.type]}
                </span>
                <span className="text-xs text-muted">
                  {ACTIVITY_STATUS_LABELS[activity.status]}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(activity.activity_date)}
                </span>
              </div>
              <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
                {getActivityContentText(activity.content)}
              </p>
              {activity.contactName || activity.organizationName ? (
                <p className="mt-2 text-xs text-muted">
                  {[activity.contactName, activity.organizationName].filter(Boolean).join(" · ")}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
