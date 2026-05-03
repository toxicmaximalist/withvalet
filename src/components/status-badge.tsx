import { CONTACT_STATUS_LABELS } from "@/lib/constants";
import type { Database } from "@/types/database";

const STATUS_STYLES: Record<Database["public"]["Enums"]["contact_status"], string> = {
  fresh: "border-white/10 bg-white/6 text-white",
  contacted: "border-accent/20 bg-accent/10 text-accent-foreground",
  replied: "border-sky-500/25 bg-sky-500/10 text-sky-200",
  followed_up: "border-amber-500/25 bg-amber-500/10 text-amber-200",
  call_scheduled: "border-orange-500/25 bg-orange-500/10 text-orange-200",
  call_done: "border-cyan-500/25 bg-cyan-500/10 text-cyan-200",
  interested: "border-emerald-500/25 bg-emerald-500/10 text-emerald-200",
  not_interested: "border-zinc-500/25 bg-zinc-500/10 text-zinc-300",
  ghosted: "border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-200",
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
