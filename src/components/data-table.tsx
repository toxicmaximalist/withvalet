import { cn } from "@/lib/utils";

type Column<T> = {
  key: string;
  className?: string;
  header: string;
  render: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  emptyState?: React.ReactNode;
};

export function DataTable<T>({ columns, data, emptyState }: DataTableProps<T>) {
  if (!data.length) {
    return emptyState;
  }

  return (
    <div className="scrollbar-subtle overflow-hidden rounded-none border border-white/8 bg-transparent">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 border-b border-white/8 bg-[#101011] text-xs text-muted-foreground">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={cn("px-4 py-3 font-medium", column.className)}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={index}
                className="border-b border-white/6 last:border-b-0 hover:bg-white/[0.02]"
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3.5 align-top", column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
