import { useState } from "react";
import type { GameAction, Period } from "@/types";
import { formatGameClock, formatShotClock } from "@/lib/clock";
import { getPeriodLabel } from "@/lib/fiba";
import { playBuzzer } from "@/lib/sound";
import { send } from "@/lib/channel";

interface ClockPanelProps {
  gameClockMs: number;
  gameClockRunning: boolean;
  shotClockMs: number;
  shotClockRunning: boolean;
  period: Period;
  dispatch: (action: GameAction) => void;
}

export default function ClockPanel({
  gameClockMs,
  gameClockRunning,
  shotClockMs,
  shotClockRunning,
  period,
  dispatch,
}: ClockPanelProps) {
  const [editing, setEditing] = useState(false);
  const [editMin, setEditMin] = useState("");
  const [editSec, setEditSec] = useState("");

  const isLastFive = gameClockMs <= 5000 && gameClockMs > 0;

  const handleEditSubmit = () => {
    const m = parseInt(editMin || "0", 10);
    const s = parseInt(editSec || "0", 10);
    if (!isNaN(m) && !isNaN(s)) {
      dispatch({ type: "SET_GAME_CLOCK", ms: (m * 60 + s) * 1000 });
    }
    setEditing(false);
  };

  const handleEditStart = () => {
    const totalSec = Math.floor(gameClockMs / 1000);
    setEditMin(Math.floor(totalSec / 60).toString());
    setEditSec((totalSec % 60).toString());
    setEditing(true);
  };

  return (
    <div className="h-full min-h-0 bg-[--bg-surface] text-[--text-primary] rounded-xl border border-[--border-subtle] p-4 flex flex-col gap-4 shadow-md">
      <div className="flex items-center justify-between border-b border-[--border-subtle] pb-2">
        <h3 className="text-xs font-bold text-[--text-secondary] uppercase tracking-wider">
          Chronos — {getPeriodLabel(period as 1 | 2 | 3 | 4 | `OT${number}`)}
        </h3>
        <button
          onClick={() => {
            playBuzzer();
            send({ type: "PLAY_BUZZER" });
          }}
          className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-wider transition-all duration-200 active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer shadow-red-900/10"
          title="Sonne le buzzer manuel (Raccourci: B)"
        >
          🚨 BUZZER (B)
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-0">
        {/* Game Clock Panel */}
        <div className="flex flex-col gap-2 bg-[--bg-surface-2]/40 p-3 rounded-xl border border-[--border-subtle] justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-[--text-secondary] font-bold uppercase tracking-wider">Temps de Jeu</span>
            <div className="flex items-center mt-1.5 min-h-[60px]">
              {editing ? (
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={editMin}
                    onChange={(e) => setEditMin(e.target.value)}
                    className="w-12 h-9 bg-[--bg-canvas] text-[--text-primary] border border-[--border-subtle] text-center rounded-lg font-mono font-bold text-sm focus:outline-none focus:border-primary/50"
                    autoFocus
                  />
                  <span className="text-[--text-primary] font-mono font-bold">:</span>
                  <input
                    type="number"
                    min={0}
                    max={59}
                    value={editSec}
                    onChange={(e) => setEditSec(e.target.value)}
                    className="w-12 h-9 bg-[--bg-canvas] text-[--text-primary] border border-[--border-subtle] text-center rounded-lg font-mono font-bold text-sm focus:outline-none focus:border-primary/50"
                  />
                  <button
                    onClick={handleEditSubmit}
                    className="bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
                  >
                    OK
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    className="bg-muted hover:bg-muted/70 text-foreground px-2 py-1 rounded-md text-xs font-bold transition-all cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleEditStart}
                  className={`font-mono text-5xl font-black cursor-pointer transition-colors duration-200 tracking-tighter tabular-nums ${
                    isLastFive
                      ? "clock--urgent"
                      : gameClockRunning
                        ? "text-[--text-primary]"
                        : "text-[--clock-amber]"
                  }`}
                  title="Cliquer pour modifier le temps"
                >
                  {formatGameClock(gameClockMs)}
                </button>
              )}
            </div>
          </div>
          
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => dispatch({ type: "TOGGLE_GAME_CLOCK" })}
              className={`flex-1 h-9 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5 shadow-sm text-white ${
                gameClockRunning
                  ? "bg-rose-600 hover:bg-rose-500 shadow-rose-900/10"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/10"
              }`}
            >
              {gameClockRunning ? "⏸ Pause" : "▶ Relancer"}
            </button>
            <button
              onClick={() => dispatch({ type: "RESET_GAME_CLOCK" })}
              className="h-9 px-3 rounded-lg bg-muted hover:bg-muted/70 border border-[--border-subtle] text-foreground font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              ↺ Reset
            </button>
          </div>
        </div>

        {/* Shot Clock Panel */}
        <div className="flex flex-col gap-2 bg-[--bg-surface-2]/40 p-3 rounded-xl border border-[--border-subtle] justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-[--text-secondary] font-bold uppercase tracking-wider">Lancers (Shot)</span>
            <div className="flex items-center gap-3 mt-1.5 min-h-[60px]">
              <span
                className={`font-mono text-5xl font-black tracking-tighter tabular-nums transition-all duration-200 ${
                  shotClockMs <= 5000 ? "text-[--out-danger] animate-pulse scale-105" : "text-[--text-primary]"
                }`}
              >
                {formatShotClock(shotClockMs)}
              </span>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase font-sans tracking-wider ${
                shotClockRunning ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10"
              }`}>
                {shotClockRunning ? "En Cours" : "Arrêté"}
              </span>
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={() => dispatch({ type: "TOGGLE_SHOT_CLOCK" })}
              className={`h-9 w-10 rounded-lg text-white font-bold text-sm transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                shotClockRunning ? "bg-rose-600 hover:bg-rose-500" : "bg-emerald-600 hover:bg-emerald-500"
              }`}
            >
              {shotClockRunning ? "⏸" : "▶"}
            </button>
            <button
              onClick={() => dispatch({ type: "RESET_SHOT_CLOCK", to: 24 })}
              className="flex-1 h-9 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              24s
            </button>
            <button
              onClick={() => dispatch({ type: "RESET_SHOT_CLOCK", to: 14 })}
              className="flex-1 h-9 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95"
            >
              14s
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
