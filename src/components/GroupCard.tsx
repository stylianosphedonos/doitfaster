import Link from "next/link";
import { COLOR_MAP } from "@/lib/constants";
import type { FormGroup } from "@/lib/types";

interface GroupCardProps {
  group: FormGroup;
  formCount: number;
}

export function GroupCard({ group, formCount }: GroupCardProps) {
  const gradient = COLOR_MAP[group.color] ?? COLOR_MAP.slate;

  return (
    <Link
      href={`/groups/${group.id}`}
      className="group block rounded-2xl border border-zinc-200 bg-white overflow-hidden shadow-sm hover:shadow-md hover:border-zinc-300 transition-all"
    >
      <div className={`h-2 bg-gradient-to-r ${gradient}`} />
      <div className="p-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl">{group.icon}</span>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-zinc-900 group-hover:text-zinc-700 transition-colors">
              {group.title}
            </h2>
            {group.description && (
              <p className="mt-1 text-sm text-zinc-500 line-clamp-2">
                {group.description}
              </p>
            )}
            <p className="mt-3 text-xs text-zinc-400">
              {formCount} form{formCount !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>
    </Link>
  );
}
