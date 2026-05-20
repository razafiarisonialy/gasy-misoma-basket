import { useState, useEffect } from "react";
import type { GameState, Player } from "@/types";
import { formatGameClock, formatShotClock } from "@/lib/clock";
import { getPeriodLabel, isOvertime } from "@/lib/fiba";

interface DisplayFullProps {
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

export default function DisplayFull({ state }: DisplayFullProps) {
  const isLastFive = state.gameClock.remainingMs <= 5000 && state.gameClock.remainingMs > 0;
  const shotClockMs = state.shotClock.remainingMs;
  const isShotUrgent = shotClockMs <= 5000 && shotClockMs > 0;
  const shotClockDisplay = formatShotClock(shotClockMs);

  const isQT4OrOT = (typeof state.period === "number" && state.period >= 4) || isOvertime(state.period);
  const isUnder2Minutes = state.gameClock.remainingMs <= 120000;
  const shouldFormatSSd = isQT4OrOT && isUnder2Minutes;

  const clockColorClass = isLastFive 
    ? "clock--urgent font-bold" 
    : "text-[--clock-amber]";

  const teamInPossession = state.possessionArrow === "home" ? state.home : state.away;
  const homeOnCourt = state.home.players.filter(p => p.onCourt);
  const awayOnCourt = state.away.players.filter(p => p.onCourt);

  return (
    <div className="min-h-screen bg-[--bg-canvas] text-[--text-primary] p-6 flex flex-col justify-between font-sans transition-colors duration-300 relative select-none">
      
      {/* Root unified scoreboard container */}
      <div className="flex-1 flex flex-col justify-between bg-[--bg-surface] border border-[--border-strong] rounded-2xl overflow-hidden shadow-2xl">
        
        {/* Top Status Bar (30px) */}
        <div className="flex items-center justify-between px-6 py-2.5 text-xs uppercase tracking-widest text-[--text-secondary] font-semibold border-b border-[--border-subtle]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[--live-red] live-dot" />
            <span className="font-semibold text-[--live-red]">LIVE</span>
            <span className="ml-3 font-mono font-bold text-[--text-primary] tabular-nums">
              {getPeriodLabel(state.period)} · {formatGameClock(state.gameClock.remainingMs)}
            </span>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <span>POSSESSION</span>
            <span className="poss-indicator text-[--text-primary]" key={state.possessionArrow}>
              ▶ <span style={{ color: teamInPossession.color }}>{teamInPossession.name}</span>
            </span>
          </div>
        </div>

        {/* Team Stripes (2px) */}
        <div className="flex h-0.5 w-full overflow-hidden shrink-0">
          <div className="h-full" style={{ width: "35%", backgroundColor: state.home.color }} />
          <div className="h-full bg-[--border-subtle]" style={{ width: "30%" }} />
          <div className="h-full" style={{ width: "35%", backgroundColor: state.away.color }} />
        </div>

        {/* Team Headers Section */}
        <div className="grid grid-cols-3 items-center text-center px-8 pt-6">
          {/* Home Team */}
          <div className="flex flex-col items-start text-left gap-1">
            <div className="flex items-center gap-3">
              {state.home.logoUrl ? (
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-950 border flex items-center justify-center p-1 overflow-hidden shadow-sm" style={{ borderColor: state.home.color }}>
                  <img src={state.home.logoUrl} alt={state.home.shortName} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 font-mono" style={{ color: state.home.color, borderColor: state.home.color }}>
                  {state.home.shortName.slice(0, 2)}
                </div>
              )}
              <span className="text-2xl md:text-3xl font-bold tracking-wide text-[--text-primary] uppercase">
                {state.home.name}
              </span>
            </div>
            <span className="text-[10px] tracking-[0.2em] font-bold text-[--text-secondary] uppercase ml-1">
              ÉQUIPE LOCALE
            </span>
          </div>

          {/* Period (Center) */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-[10px] tracking-[0.2em] font-bold text-[--text-secondary] uppercase">
              QUART-TEMPS
            </span>
            <span className="text-4xl md:text-5xl font-extrabold font-mono text-[--text-primary] tracking-tighter mt-1">
              {typeof state.period === "number" ? state.period : state.period.replace("OT", "OT ")}
            </span>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-end text-right gap-1">
            <div className="flex items-center gap-3 flex-row-reverse">
              {state.away.logoUrl ? (
                <div className="w-12 h-12 rounded-full bg-white dark:bg-zinc-950 border flex items-center justify-center p-1 overflow-hidden shadow-sm" style={{ borderColor: state.away.color }}>
                  <img src={state.away.logoUrl} alt={state.away.shortName} className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-black border-2 font-mono" style={{ color: state.away.color, borderColor: state.away.color }}>
                  {state.away.shortName.slice(0, 2)}
                </div>
              )}
              <span className="text-2xl md:text-3xl font-bold tracking-wide text-[--text-primary] uppercase">
                {state.away.name}
              </span>
            </div>
            <span className="text-[10px] tracking-[0.2em] font-bold text-[--text-secondary] uppercase mr-1">
              ÉQUIPE VISITEUR
            </span>
          </div>
        </div>

        {/* Scores & Clocks Row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-8 py-2">
          {/* Home Score */}
          <div className="flex justify-center">
            <ScoreDisplay score={state.home.score} color={state.home.color} />
          </div>

          {/* Clocks Section */}
          <div className="flex flex-col items-center justify-center min-w-[280px]">
            {/* Game Clock */}
            <span className={`font-mono font-bold text-[72px] sm:text-[96px] md:text-[110px] leading-none tracking-tighter tabular-nums ${clockColorClass}`}>
              {formatCustomClock(state.gameClock.remainingMs, shouldFormatSSd)}
            </span>

            {/* Subtle Divider */}
            <div className="w-24 h-[1px] bg-[--border-default] my-4" />

            {/* Shot Clock */}
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold tracking-[0.25em] text-[--text-secondary] uppercase leading-none">
                SHOT
              </span>
              <span 
                className={`font-mono font-bold text-[56px] sm:text-[64px] md:text-[72px] leading-none tracking-tighter transition-all duration-200 ${
                  isShotUrgent 
                    ? "text-[--out-danger] scale-105" 
                    : "text-[--text-primary]"
                }`}
              >
                {shotClockDisplay}
              </span>
            </div>
          </div>

          {/* Away Score */}
          <div className="flex justify-center">
            <ScoreDisplay score={state.away.score} color={state.away.color} />
          </div>
        </div>

        {/* Team Stats row */}
        <div className="grid grid-cols-2 items-start px-12 py-3 border-t border-[--border-subtle] border-b border-[--border-subtle]">
          {/* Home Team Stats */}
          <div className="flex flex-col items-start gap-3">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] tracking-[0.2em] font-bold text-[--text-secondary] uppercase">
                  FAUTES ÉQUIPE
                </span>
                <TeamFoulsBar count={state.home.teamFouls} teamColor={state.home.color} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] tracking-[0.2em] font-bold text-[--text-secondary] uppercase">
                  TIMEOUTS
                </span>
                <TimeoutsIndicator left={state.home.timeoutsLeft} />
              </div>
            </div>
            {state.home.teamFouls >= 4 && (
              <div className="bonus-badge bg-[--bonus-bg] text-[--bonus-warn] font-bold text-[10px] uppercase px-3 py-1 rounded-full border border-[--bonus-warn]/10 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[--bonus-warn] animate-ping" />
                BONUS
              </div>
            )}
          </div>

          {/* Away Team Stats */}
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-8 flex-row-reverse">
              <div className="flex flex-col items-end">
                <span className="text-[10px] tracking-[0.2em] font-bold text-[--text-secondary] uppercase">
                  FAUTES ÉQUIPE
                </span>
                <TeamFoulsBar count={state.away.teamFouls} teamColor={state.away.color} />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] tracking-[0.2em] font-bold text-[--text-secondary] uppercase">
                  TIMEOUTS
                </span>
                <TimeoutsIndicator left={state.away.timeoutsLeft} />
              </div>
            </div>
            {state.away.teamFouls >= 4 && (
              <div className="bonus-badge bg-[--bonus-bg] text-[--bonus-warn] font-bold text-[10px] uppercase px-3 py-1 rounded-full border border-[--bonus-warn]/10 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[--bonus-warn] animate-ping" />
                BONUS
              </div>
            )}
          </div>
        </div>

        {/* Roster Section Headers */}
        <div className="grid grid-cols-2 gap-16 px-8 pt-4 pb-2 text-[10px] uppercase tracking-widest text-[--text-secondary] font-bold">
          <div className="flex items-center justify-between">
            <span>JOUEURS SUR LE TERRAIN (LOC)</span>
            <span>PTS · FAUTES</span>
          </div>
          <div className="flex items-center justify-between">
            <span>JOUEURS SUR LE TERRAIN (VIS)</span>
            <span>PTS · FAUTES</span>
          </div>
        </div>

        {/* Roster Rows List */}
        <div className="grid grid-cols-2 gap-16 px-8 pb-6 flex-1 overflow-y-auto max-h-[320px]">
          {/* Team A Roster */}
          <div className="flex flex-col">
            {homeOnCourt.length === 0 ? (
              <div className="py-8 text-center text-xs text-[--text-tertiary] italic font-medium">Aucun joueur sur le terrain</div>
            ) : (
              homeOnCourt.map((p, idx) => (
                <PlayerRowDisplay key={p.id} player={p} teamColor={state.home.color} isFirst={idx === 0} />
              ))
            )}
          </div>

          {/* Team B Roster */}
          <div className="flex flex-col">
            {awayOnCourt.length === 0 ? (
              <div className="py-8 text-center text-xs text-[--text-tertiary] italic font-medium">Aucun joueur sur le terrain</div>
            ) : (
              awayOnCourt.map((p, idx) => (
                <PlayerRowDisplay key={p.id} player={p} teamColor={state.away.color} isFirst={idx === 0} />
              ))
            )}
          </div>
        </div>

      </div>

      {/* Fullscreen button */}
      <button
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

/* Score change animation sub-component */
function ScoreDisplay({ score, color }: { score: number; color: string }) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 250);
    return () => clearTimeout(t);
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <span
        className={`font-mono font-bold select-none text-[120px] sm:text-[160px] md:text-[180px] leading-none tracking-tighter text-[--text-primary] ${
          flash ? "score--flash" : ""
        }`}
      >
        {score.toString().padStart(2, "0")}
      </span>
      <div className="h-[3px] w-[60%] rounded-full mt-2" style={{ backgroundColor: color }} />
    </div>
  );
}

/* 4-segment fouls bar */
function TeamFoulsBar({ count, teamColor }: { count: number; teamColor: string }) {
  return (
    <div className="flex gap-1.5 mt-1.5">
      {[0, 1, 2, 3].map(i => (
        <div 
          key={i} 
          className="h-2 w-7 rounded-sm transition-all duration-300" 
          style={{
            backgroundColor: i < count ? teamColor : 'var(--border-subtle)'
          }}
        />
      ))}
    </div>
  );
}

/* Timeouts Indicator */
function TimeoutsIndicator({ left }: { left: number }) {
  return (
    <div className="flex gap-1.5 mt-1.5">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            i < left
              ? "bg-[--clock-amber] border border-[--clock-amber]"
              : "bg-transparent border border-[--border-strong]"
          }`}
        />
      ))}
    </div>
  );
}

/* Player Row Sub-component */
function PlayerRowDisplay({ player, teamColor, isFirst }: { player: Player; teamColor: string; isFirst: boolean }) {
  const isOut = player.fouls >= 5;

  return (
    <div
      className={`flex items-center justify-between py-2 transition-all ${
        !isFirst ? "border-t border-[--border-subtle]" : ""
      } ${isOut ? "bg-[--out-bg] -mx-2 px-2 text-[--out-danger]" : ""}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        {/* Badge N° */}
        <div
          className="w-[28px] h-[20px] rounded flex items-center justify-center font-mono font-bold text-xs shrink-0 select-none"
          style={isOut ? { backgroundColor: 'var(--out-danger)', color: '#ffffff' } : { backgroundColor: `${teamColor}15`, color: teamColor }}
        >
          {player.number.padStart(2, "0")}
        </div>

        {/* Nom */}
        <span
          className={`text-sm font-semibold uppercase truncate ${
            isOut ? "text-[--out-danger]" : "text-[--text-primary]"
          }`}
        >
          {player.name}
        </span>

        {/* Badge OUT si exclu */}
        {isOut && (
          <span className="bg-[--out-danger] text-white text-[9px] font-bold px-1.5 py-0.5 rounded leading-none shrink-0 font-sans tracking-wide">
            OUT
          </span>
        )}
      </div>

      {/* Stats (Pts + Fouls) */}
      <div className="flex items-center gap-6 shrink-0">
        {/* Points */}
        <span
          className={`font-mono text-sm font-bold tabular-nums min-w-[20px] text-right ${
            isOut ? "text-[--out-danger]" : "text-[--text-primary]"
          }`}
        >
          {player.points}
        </span>

        {/* Pastilles de Fautes */}
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map(i => {
            const filled = i < player.fouls;
            return (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  filled
                    ? "bg-[--out-danger] border border-[--out-danger]"
                    : "border border-[--border-strong] bg-transparent"
                }`}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
