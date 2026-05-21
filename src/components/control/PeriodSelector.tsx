import type { GameAction, Period } from "@/types";
import { getPeriodLabel, isOvertime } from "@/lib/fiba";

interface PeriodSelectorProps {
  period: Period;
  dispatch: (action: GameAction) => void;
  homeScore: number;
  awayScore: number;
}

export default function PeriodSelector({
  period,
  dispatch,
  homeScore,
  awayScore,
}: PeriodSelectorProps) {
  const periods: Period[] = [1, 2, 3, 4];
  const isTied = homeScore === awayScore;

  return (
    <div className="h-full min-h-0 bg-card text-card-foreground rounded-xl border border-border p-4 shadow-sm flex flex-col">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 shrink-0">
        Période & match
      </h3>

      <div className="flex gap-2 mb-3 flex-wrap shrink-0">
        {periods.map((p) => (
          <button
            key={p}
            onClick={() => dispatch({ type: "SET_PERIOD", period: p })}
            className={`px-3 py-1.5 rounded-lg font-semibold text-sm transition-colors ${
              period === p
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {getPeriodLabel(p)}
          </button>
        ))}
        {isOvertime(period) && (
          <span className="px-3 py-1.5 rounded-lg bg-purple-700 text-white font-semibold text-sm">
            {getPeriodLabel(period)}
          </span>
        )}
      </div>

      <button
        onClick={() => dispatch({ type: "NEXT_PERIOD" })}
        className="w-full px-4 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-colors mt-auto shrink-0"
      >
        QT Suivant →
        {period === 4 && isTied && (
          <span className="ml-2 text-xs opacity-75">(→ Prolongation)</span>
        )}
      </button>
    </div>
  );
}
