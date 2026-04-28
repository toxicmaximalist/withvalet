import Link from "next/link";

type OrganizationBadgeProps = {
  href?: string;
  name: string | null;
};

export function OrganizationBadge({ href, name }: OrganizationBadgeProps) {
  if (!name) {
    return <span className="text-sm text-muted-foreground">Unassigned</span>;
  }

  const content = (
    <span className="inline-flex rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-foreground">
      {name}
    </span>
  );

  if (!href) {
    return content;
  }

  return (
    <Link href={href} className="hover:opacity-80">
      {content}
    </Link>
  );
}
