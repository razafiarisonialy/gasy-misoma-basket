import { useState, useEffect } from "react";
import type { GameState } from "@/types";
import { formatGameClock, formatShotClock } from "@/lib/clock";
import { getPeriodLabel, isOvertime, isTeamInBonus } from "@/lib/fiba";
import { TEAM_FOUL_BONUS_THRESHOLD } from "@/constants";

/**
 * Mode COMPACT — logique propre :
 * - Pas de roster ni de banc (réservé au display complet)
 * - Mise en avant maximale : scores, chrono, 24s, identité équipes, fautes/timeouts
 * - Typographie en vw/vh pour écrans larges type bandeau LED / second écran
 */
interface DisplayCompactProps {
  state: GameState;
}

function formatCustomClock(ms: number, forceSSd: boolean): string {
  if (ms <= 0) return "0.0";
  const totalSeconds = ms / 1000;

  if (forceSSd) {
    const seconds = Math.floor(totalSeconds);
    const tenths = Math.floor((ms % 1000) / 100);
    return `${seconds.toString().padStart(2, "0")}.${tenths}`;
  }

  return formatGameClock(ms);
}

export default function DisplayCompact({ state }: DisplayCompactProps) {
  const isLastFive = state.gameClock.remainingMs <= 5000 && state.gameClock.remainingMs > 0;
  const shotClockMs = state.shotClock.remainingMs;
  const isShotUrgent = shotClockMs <= 5000 && shotClockMs > 0;
  const shotClockDisplay = formatShotClock(shotClockMs);

  const isQT4OrOT = (typeof state.period === "number" && state.period >= 4) || isOvertime(state.period);
  const isUnder2Minutes = state.gameClock.remainingMs <= 120000;
  const shouldFormatSSd = isQT4OrOT && isUnder2Minutes;

  const clockColorClass = isLastFive ? "clock--urgent font-bold" : "text-[--clock-amber]";

  return (
    <div className="h-full w-full bg-[--bg-canvas] text-[--text-primary] p-2 sm:p-3 flex flex-col font-sans transition-colors duration-300 relative select-none overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col bg-[--bg-surface] border border-[--border-strong] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Barre statut — pas de possession ici (sous le 24s) */}
        <div className="flex items-center justify-between px-5 sm:px-8 py-2.5 text-xs uppercase tracking-widest text-[--text-secondary] font-semibold border-b border-[--border-subtle] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[--live-red] live-dot" />
            <span className="font-semibold text-[--live-red] text-[clamp(0.9rem,1.8vh,1.25rem)]">LIVE</span>
            <span className="ml-2 sm:ml-3 font-mono font-bold text-[clamp(1rem,2vh,1.35rem)] text-[--text-primary] tabular-nums">
              {getPeriodLabel(state.period)} · {formatGameClock(state.gameClock.remainingMs)}
            </span>
          </div>
          <span className="text-[clamp(0.8rem,1.6vh,1.1rem)] tracking-[0.2em] text-[--text-tertiary] font-bold">
            MODE COMPACT
          </span>
        </div>

        <div className="flex h-1 w-full overflow-hidden shrink-0">
          <div className="h-full" style={{ width: "35%", backgroundColor: state.home.color }} />
          <div className="h-full bg-[--border-subtle]" style={{ width: "30%" }} />
          <div className="h-full" style={{ width: "35%", backgroundColor: state.away.color }} />
        </div>

        {/* Identité équipes + QT — bandeau haut (logo/nom optimisés ~10 m) */}
        <div className="grid grid-cols-[1.35fr_auto_1.35fr] items-center gap-3 sm:gap-6 px-3 sm:px-6 py-3 sm:py-4 shrink-0 min-h-[clamp(5rem,18vh,12rem)]">
          <CompactTeamHeader team={state.home} align="left" />
          <div className="flex flex-col items-center justify-center px-2 min-w-[clamp(4rem,8vw,7rem)] shrink-0">
            <span className="text-[clamp(1rem,2.2vh,1.4rem)] tracking-[0.28em] font-black text-[--text-secondary] uppercase text-center">
              QUART-TEMPS
            </span>
            <span className="text-[clamp(2rem,5vh,4rem)] font-extrabold font-mono text-[--text-primary] tracking-tighter mt-1 tabular-nums leading-none">
              {typeof state.period === "number" ? state.period : state.period.replace("OT", "OT ")}
            </span>
          </div>
          <CompactTeamHeader team={state.away} align="right" />
        </div>

        {/* Zone héro : scores + chrono (remplit l'écran) */}
        <div className="flex-1 min-h-0 flex items-center justify-center px-2 sm:px-4 py-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 w-full h-full max-w-[2000px]">
            <CompactScoreColumn
              score={state.home.score}
              color={state.home.color}
              teamFouls={state.home.teamFouls}
              timeoutsLeft={state.home.timeoutsLeft}
              inBonus={isTeamInBonus(state.home.teamFouls)}
            />

            <div className="flex flex-col items-center justify-center h-full min-w-[clamp(8rem,20vw,16rem)] px-2">
              <span
                className={`font-mono font-bold text-[clamp(3rem,10vw,8rem)] leading-none tracking-tighter tabular-nums ${clockColorClass}`}
              >
                {formatCustomClock(state.gameClock.remainingMs, shouldFormatSSd)}
              </span>
              <div className="w-[clamp(6rem,15vw,12rem)] h-px bg-[--border-default] my-[clamp(0.75rem,2vh,1.75rem)]" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-[clamp(1rem,2.2vh,1.4rem)] font-black tracking-[0.28em] text-[--text-secondary] uppercase">
                  TEMPS DE POSSESION
                </span>
                <span
                  className={`font-mono font-bold text-[clamp(2rem,7vw,5.5rem)] leading-none tracking-tighter transition-all duration-200 ${
                    isShotUrgent ? "text-[--out-danger] scale-105" : "text-[--text-primary]"
                  }`}
                >
                  {shotClockDisplay}
                </span>
              </div>
              <CompactPossessionIndicator
                possession={state.possessionArrow}
                homeShort={state.home.shortName}
                awayShort={state.away.shortName}
                homeColor={state.home.color}
                awayColor={state.away.color}
              />
            </div>

            <CompactScoreColumn
              score={state.away.score}
              color={state.away.color}
              teamFouls={state.away.teamFouls}
              timeoutsLeft={state.away.timeoutsLeft}
              inBonus={isTeamInBonus(state.away.teamFouls)}
            />
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => {
          if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
          } else {
            document.exitFullscreen().catch(() => {});
          }
        }}
        className="absolute bottom-3 right-3 bg-[--bg-surface] hover:bg-[--bg-surface-2] border border-[--border-default] text-[--text-secondary] hover:text-[--text-primary] px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-widest uppercase transition-all duration-200 z-20 shadow-sm"
      >
        ⛶ Plein écran
      </button>
    </div>
  );
}

function CompactTeamHeader({
  team,
  align,
}: {
  team: GameState["home"];
  align: "left" | "right";
}) {
  const label = align === "left" ? "ÉQUIPE LOCALE" : "ÉQUIPE VISITEUR";
  /* ~28vw sur 1080p ≈ 300px — cible lisibilité logo à ~10 m sur grand écran */
  const logoSize = "w-[clamp(9rem,28vw,22rem)] h-[clamp(9rem,28vw,22rem)]";

  const logo = team.logoUrl ? (
    <div
      className={`${logoSize} rounded-2xl border-[4px] flex items-center justify-center p-2 sm:p-2.5 overflow-hidden shrink-0`}
      style={{
        borderColor: team.color,
        backgroundColor: `${team.color}1A`,
        boxShadow: `0 4px 40px ${team.color}30`,
      }}
    >
      <img src={team.logoUrl} alt={team.shortName} className="w-full h-full object-contain drop-shadow-md" />
    </div>
  ) : (
    <div
      className={`${logoSize} rounded-2xl border-[4px] flex items-center justify-center font-black font-mono shrink-0 text-[clamp(2rem,6vw,4rem)]`}
      style={{ color: team.color, borderColor: team.color, backgroundColor: `${team.color}1A` }}
    >
      {team.shortName.slice(0, 2)}
    </div>
  );

  return (
    <div
      className={`flex flex-1 min-w-0 items-center gap-5 sm:gap-8 ${
        align === "right" ? "flex-row-reverse text-right" : "flex-row text-left"
      }`}
    >
      {logo}
      <div className="flex flex-col justify-center gap-2 sm:gap-2.5 min-w-0 flex-1 items-center">
        <span
          className="text-[clamp(1.1rem,3vw,2.2rem)] font-black uppercase leading-[1.02] tracking-tight line-clamp-2 max-w-full text-center break-words"
          style={{
            color: team.color,
            textShadow: `0 2px 20px ${team.color}40`,
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
          title={team.name}
        >
          {team.name}
        </span>
        <span className="text-[clamp(1.1rem,2.4vh,1.65rem)] tracking-[0.3em] font-black uppercase text-[--text-secondary]">
          {label}
        </span>
      </div>
    </div>
  );
}

function CompactScoreColumn({
  score,
  color,
  teamFouls,
  timeoutsLeft,
  inBonus,
}: {
  score: number;
  color: string;
  teamFouls: number;
  timeoutsLeft: number;
  inBonus: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 sm:gap-6">
      <CompactScoreDisplay score={score} color={color} />
      <CompactTeamStats teamFouls={teamFouls} timeoutsLeft={timeoutsLeft} inBonus={inBonus} teamColor={color} />
    </div>
  );
}

function CompactScoreDisplay({ score, color }: { score: number; color: string }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    const start = setTimeout(() => setFlash(true), 0);
    const end = setTimeout(() => setFlash(false), 250);
    return () => {
      clearTimeout(start);
      clearTimeout(end);
    };
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-mono font-bold select-none text-[clamp(3.5rem,12vw,10rem)] leading-none tracking-tighter text-[--text-primary] ${
          flash ? "score--flash" : ""
        }`}
      >
        {score.toString().padStart(2, "0")}
      </span>
      <div className="h-[6px] w-[50%] rounded-full mt-3 sm:mt-4" style={{ backgroundColor: color }} />
    </div>
  );
}

function CompactPossessionIndicator({
  possession,
  homeShort,
  awayShort,
  homeColor,
  awayColor,
}: {
  possession: "home" | "away";
  homeShort: string;
  awayShort: string;
  homeColor: string;
  awayColor: string;
}) {
  const homeActive = possession === "home";
  const awayActive = possession === "away";
  const activeClass =
    "text-[--clock-amber] poss-indicator drop-shadow-[0_0_14px_rgba(251,191,36,0.65)]";
  const idleClass = "text-[--text-tertiary] opacity-20";

  return (
    <div className="flex flex-col items-center gap-2 mt-[clamp(0.75rem,2vh,1.5rem)] w-full max-w-[min(90vw,28rem)]">
      <span className="text-[clamp(1rem,2.2vh,1.4rem)] font-black tracking-[0.28em] text-[--text-secondary] uppercase">
        Possession
      </span>
      <div className="flex items-center justify-center gap-5 sm:gap-7 w-full">
        <div className={`flex items-center gap-1 ${awayActive ? activeClass : idleClass}`}>
          <span className="text-[clamp(1rem,2.5vw,1.75rem)] font-black leading-none">◀</span>
          <span className="text-[clamp(1rem,2.5vw,1.75rem)] font-black leading-none">◀</span>
        </div>
        <span
          className="text-[clamp(1.2rem,3vw,2rem)] font-black uppercase tracking-wide truncate max-w-[32vw] text-center"
          style={{ color: homeActive ? homeColor : awayColor }}
        >
          {homeActive ? homeShort : awayShort}
        </span>
        <div className={`flex items-center gap-1 ${homeActive ? activeClass : idleClass}`}>
          <span className="text-[clamp(1rem,2.5vw,1.75rem)] font-black leading-none">▶</span>
          <span className="text-[clamp(1rem,2.5vw,1.75rem)] font-black leading-none">▶</span>
        </div>
      </div>
    </div>
  );
}

const MAX_TIMEOUTS = 3;

function CompactTeamStats({
  teamFouls,
  timeoutsLeft,
  inBonus,
  teamColor,
}: {
  teamFouls: number;
  timeoutsLeft: number;
  inBonus: boolean;
  teamColor: string;
}) {

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div className="flex items-center justify-center gap-8 sm:gap-12 flex-wrap">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[clamp(0.95rem,1.9vh,1.25rem)] tracking-[0.18em] font-black text-[--text-secondary] uppercase">
            Fautes équipe
          </span>
          <div className="flex gap-2.5 sm:gap-3">
            {Array.from({ length: TEAM_FOUL_BONUS_THRESHOLD }, (_, i) => i).map(i => (
              <div
                key={i}
                className="h-5 sm:h-6 w-11 sm:w-14 rounded-sm transition-all duration-300"
                style={{
                  backgroundColor: i < teamFouls ? teamColor : "var(--border-subtle)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[clamp(0.95rem,1.9vh,1.25rem)] tracking-[0.18em] font-black text-[--text-secondary] uppercase">
            Timeouts
          </span>
          <div className="flex gap-3.5 sm:gap-4">
            {Array.from({ length: MAX_TIMEOUTS }, (_, i) => i).map(i => (
              <div
                key={i}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full transition-all duration-300 border-2"
                style={
                  i < timeoutsLeft
                    ? { backgroundColor: teamColor, borderColor: teamColor }
                    : { backgroundColor: "transparent", borderColor: "var(--border-strong)" }
                }
              />
            ))}
          </div>
        </div>
      </div>
      {inBonus && (
        <div className="bonus-badge bg-[--bonus-bg] text-[--bonus-warn] font-black text-[clamp(0.95rem,1.9vh,1.25rem)] uppercase px-6 py-2.5 rounded-full border border-[--bonus-warn]/25 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[--bonus-warn] animate-ping" />
          BONUS
        </div>
      )}
    </div>
  );
}
