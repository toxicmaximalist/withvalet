import { CONTACT_STATUS_LABELS } from "@/lib/constants";
import type { Database } from "@/types/database";

const STATUS_STYLES: Record<Database["public"]["Enums"]["contact_status"], string> = {
  new: "border-white/10 bg-white/6 text-white",
  contacted: "border-accent/20 bg-accent/10 text-accent-foreground",
  replied: "border-sky-500/25 bg-sky-500/10 text-sky-200",
  interested: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
  not_interested: "border-zinc-500/25 bg-zinc-500/10 text-zinc-300",
  meeting_scheduled: "border-amber-500/25 bg-amber-500/10 text-amber-200",
  closed: "border-violet-500/25 bg-violet-500/10 text-violet-200",
  archived: "border-white/10 bg-white/4 text-zinc-400",
};

export function StatusBadge({
  status,
}: {
  status: Database["public"]["Enums"]["contact_status"];
}) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {CONTACT_STATUS_LABELS[status]}
    </span>
  );
}
