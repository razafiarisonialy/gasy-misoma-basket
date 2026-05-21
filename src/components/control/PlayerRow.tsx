import type { GameAction, Player, TeamSide } from "@/types";
import { isPlayerDisqualified } from "@/lib/fiba";

interface PlayerRowProps {
  player: Player;
  side: TeamSide;
  dispatch: (action: GameAction) => void;
  courtFull?: boolean;
  teamColor?: string;
}

export default function PlayerRow({ player, side, dispatch, courtFull = false, teamColor = "#6b7280" }: PlayerRowProps) {
  const disqualified = isPlayerDisqualified(player.fouls);

  return (
    <div
      className={`flex items-center gap-2 p-2 rounded-xl text-sm transition-all duration-200 border ${
        disqualified
          ? "bg-[--out-bg] border-[--out-danger]/30 shadow-inner shadow-red-950/5"
          : player.onCourt
            ? "bg-[--bg-surface-2]/40 border-[--border-subtle]"
            : "bg-[--bg-surface-2]/20 opacity-70 border-transparent hover:opacity-90"
      }`}
    >
      {/* Toggle ON / BANC */}
      <button
        onClick={() => dispatch({ type: "TOGGLE_ON_COURT", side, playerId: player.id })}
        disabled={!player.onCourt && courtFull}
        className={`w-9 h-8 rounded-lg text-xs font-black transition-all shrink-0 active:scale-90 flex items-center justify-center ${
          player.onCourt
            ? "bg-emerald-600 text-white cursor-pointer"
            : courtFull
              ? "bg-muted text-muted-foreground border border-[--border-subtle] opacity-50 cursor-not-allowed"
              : "bg-muted text-muted-foreground hover:bg-muted/70 border border-[--border-subtle] cursor-pointer"
        }`}
        title={player.onCourt ? "Retirer du terrain" : courtFull ? "Terrain complet (5/5)" : "Mettre sur le terrain"}
      >
        {player.onCourt ? "ON" : courtFull ? "5/5" : "BANC"}
      </button>

      {/* Numéro + Nom */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="font-mono font-bold text-[--text-secondary] w-6 text-center shrink-0 text-xs">
          {player.number.padStart(2, "0")}
        </span>
        <span className={`truncate font-extrabold uppercase tracking-wide text-sm flex-1 min-w-0 ${
          disqualified ? "text-[--out-danger] line-through opacity-80" : "text-[--text-primary]"
        }`}>
          {player.name}
        </span>
        {disqualified && (
          <span className="bg-[--out-danger] text-white text-[9px] font-black px-1.5 py-0.5 rounded leading-none shrink-0">
            OUT
          </span>
        )}
      </div>

      {/* Points + boutons score (-1, +1, +2) */}
      <div className="flex items-center gap-1 shrink-0">
        <span className="font-mono text-[--text-primary] font-black w-6 text-center tabular-nums text-sm">
          {player.points}
        </span>
        {player.onCourt && !disqualified && (
          <div className="flex gap-0.5">
            <button
              disabled={player.points === 0}
              onClick={() => dispatch({ type: "ADD_PLAYER_SCORE", side, playerId: player.id, points: -1 })}
              className="w-7 h-7 rounded bg-red-50/80 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-black transition-all cursor-pointer flex items-center justify-center"
              title="-1 pt"
            >
              -1
            </button>
            {[1, 2].map((pts) => (
              <button
                key={pts}
                onClick={() => dispatch({ type: "ADD_PLAYER_SCORE", side, playerId: player.id, points: pts })}
                className="w-7 h-7 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition-colors cursor-pointer flex items-center justify-center"
              >
                +{pts}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Fautes : 5 ronds couleur équipe + boutons -F / +F */}
      <div className="flex items-center gap-1 shrink-0">
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full transition-all duration-300"
              style={
                i < player.fouls
                  ? { backgroundColor: teamColor, borderColor: teamColor, border: "1px solid" }
                  : { border: "1px solid var(--border-strong)", backgroundColor: "transparent" }
              }
            />
          ))}
        </div>
        <div className="flex gap-0.5">
          {player.fouls > 0 && (
            <button
              onClick={() => dispatch({ type: "REMOVE_PLAYER_FOUL", side, playerId: player.id })}
              className="w-6 h-7 rounded bg-muted hover:bg-muted/70 border border-[--border-subtle] text-[--text-primary] text-[9px] font-black transition-all cursor-pointer active:scale-90 flex items-center justify-center"
              title="Retirer une faute (correction)"
            >
              -F
            </button>
          )}
          {!disqualified && (
            <button
              onClick={() => dispatch({ type: "ADD_PLAYER_FOUL", side, playerId: player.id })}
              className="w-7 h-7 rounded bg-amber-600 hover:bg-amber-500 text-white text-xs font-black transition-all cursor-pointer active:scale-90 flex items-center justify-center"
              title="Ajouter une faute"
            >
              +F
            </button>
          )}
        </div>
      </div>

      {/* Supprimer */}
      <button
        onClick={() => dispatch({ type: "REMOVE_PLAYER", side, playerId: player.id })}
        className="w-6 h-6 rounded text-muted-foreground hover:text-[--out-danger] hover:bg-muted text-xs transition-colors shrink-0 cursor-pointer flex items-center justify-center font-bold"
        title="Retirer du roster"
      >
        ✕
      </button>
    </div>
  );
}
