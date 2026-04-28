type AIPlaceholderCardProps = {
  title: string;
  description: string;
};

export function AIPlaceholderCard({
  title,
  description,
}: AIPlaceholderCardProps) {
  return (
    <div className="panel-strong rounded-3xl border p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-accent">AI placeholder</p>
      <h3 className="mt-3 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
    </div>
  );
}
