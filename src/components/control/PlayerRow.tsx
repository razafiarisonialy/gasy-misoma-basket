import type { GameAction, Player, TeamSide } from "@/types";
import { isPlayerDisqualified } from "@/lib/fiba";

interface PlayerRowProps {
  player: Player;
  side: TeamSide;
  dispatch: (action: GameAction) => void;
}

export default function PlayerRow({ player, side, dispatch }: PlayerRowProps) {
  const disqualified = isPlayerDisqualified(player.fouls);

  return (
    <div
      className={`flex items-center gap-2.5 p-2 rounded-xl text-sm transition-all duration-200 border ${
        disqualified
          ? "bg-[--out-bg] border-[--out-danger]/30 text-[--out-danger] shadow-inner shadow-red-950/5"
          : player.onCourt
            ? "bg-zinc-950/10 dark:bg-zinc-950/25 border-[--border-subtle] text-[--text-primary]"
            : "bg-zinc-950/5 dark:bg-zinc-950/10 opacity-70 border-transparent text-[--text-secondary] hover:opacity-90"
      }`}
    >
      {/* On court toggle */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_ON_COURT", side, playerId: player.id })}
        className={`w-9 h-9 rounded-lg text-xs font-black transition-all shrink-0 cursor-pointer active:scale-90 flex items-center justify-center shadow-sm ${
          player.onCourt
            ? "bg-emerald-600 text-white shadow-emerald-900/10"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700/80 border border-[--border-subtle]"
        }`}
        title={player.onCourt ? "Retirer du terrain" : "Mettre sur le terrain"}
      >
        {player.onCourt ? "ON" : "BANC"}
      </button>

      {/* Number + Name */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="font-mono font-black text-[--text-primary] w-7 text-center shrink-0 text-sm">
          {player.number.padStart(2, "0")}
        </span>
        <span className={`truncate font-semibold uppercase tracking-wide text-xs ${
          disqualified ? "text-[--out-danger] line-through opacity-80" : "text-[--text-primary]"
        }`}>
          {player.name}
        </span>
        {disqualified && (
          <span className="bg-[--out-danger] text-white text-[9px] font-black px-1.5 py-0.5 rounded leading-none shrink-0 font-sans tracking-wide">
            OUT
          </span>
        )}
      </div>

      {/* Points */}
      <div className="flex items-center gap-1 shrink-0">
        {player.points > 0 && (
          <button
            onClick={() =>
              dispatch({ type: "ADD_PLAYER_SCORE", side, playerId: player.id, points: -1 })
            }
            className="w-7 h-7 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-[--out-danger] text-xs font-black transition-colors mr-1 flex items-center justify-center cursor-pointer border border-[--border-subtle]"
            title="Annuler 1 point pour ce joueur"
          >
            -1
          </button>
        )}
        <span className="font-mono text-[--text-primary] font-black w-6 text-center tabular-nums text-sm">{player.points}</span>
        {player.onCourt && !disqualified && (
          <div className="flex gap-1">
            {[1, 2, 3].map((pts) => (
              <button
                key={pts}
                onClick={() =>
                  dispatch({ type: "ADD_PLAYER_SCORE", side, playerId: player.id, points: pts })
                }
                className="w-7 h-7 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-colors cursor-pointer flex items-center justify-center"
              >
                +{pts}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fouls */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex gap-1 select-none">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i < player.fouls
                  ? "bg-[--out-danger] border border-[--out-danger]"
                  : "border border-[--border-strong] bg-transparent"
              }`}
            />
          ))}
        </div>
        {!disqualified && (
          <button
            onClick={() => dispatch({ type: "ADD_PLAYER_FOUL", side, playerId: player.id })}
            className="w-7 h-7 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition-all cursor-pointer active:scale-90 flex items-center justify-center"
            title="Ajouter une faute"
          >
            F
          </button>
        )}
      </div>

      {/* Remove */}
      <button
        onClick={() => dispatch({ type: "REMOVE_PLAYER", side, playerId: player.id })}
        className="w-6 h-6 rounded text-zinc-500 hover:text-[--out-danger] hover:bg-zinc-950/20 text-xs transition-colors shrink-0 cursor-pointer flex items-center justify-center font-bold"
        title="Retirer du roster"
      >
        ✕
      </button>
    </div>
  );
}
