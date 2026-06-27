export const ICONS = ["📋", "📄", "🏆", "📝", "✉️", "📊", "🧾", "📑", "🗒️", "✅", "📁", "🗂️", "💼", "🎓"];
export const COLORS = ["blue", "amber", "green", "purple", "rose", "slate"] as const;

export const COLOR_MAP: Record<string, string> = {
  blue: "from-blue-500 to-blue-600",
  amber: "from-amber-500 to-amber-600",
  green: "from-emerald-500 to-emerald-600",
  purple: "from-purple-500 to-purple-600",
  rose: "from-rose-500 to-rose-600",
  slate: "from-slate-500 to-slate-600",
};

export const COLOR_GRADIENT: Record<string, string> = {
  blue: "from-blue-400 to-blue-600",
  amber: "from-amber-400 to-amber-600",
  green: "from-emerald-400 to-emerald-600",
  purple: "from-purple-400 to-purple-600",
  rose: "from-rose-400 to-rose-600",
  slate: "from-slate-400 to-slate-600",
};
