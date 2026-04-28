function LoadingLine({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-white/[0.08] ${className}`} />;
}

export default function WorkspaceLoading() {
  return (
    <div className="workspace-shell min-h-screen">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="hidden border-r border-white/8 bg-[#090a0c]/88 lg:block">
          <div className="px-5 py-6">
            <LoadingLine className="h-28 w-full rounded-[24px]" />
            <LoadingLine className="mt-5 h-12 w-full rounded-2xl" />
            <div className="mt-6 space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <LoadingLine key={index} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="border-b border-white/8 px-4 py-4 lg:px-8">
            <LoadingLine className="h-16 w-full rounded-[24px]" />
          </div>
          <main className="px-4 py-6 lg:px-8">
            <div className="space-y-8">
              <div>
                <LoadingLine className="h-8 w-52" />
                <LoadingLine className="mt-3 h-4 w-[34rem] max-w-full" />
              </div>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <LoadingLine key={index} className="h-28 w-full rounded-[24px]" />
                ))}
              </div>
              <div className="grid gap-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <LoadingLine key={index} className="h-20 w-full rounded-[24px]" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
