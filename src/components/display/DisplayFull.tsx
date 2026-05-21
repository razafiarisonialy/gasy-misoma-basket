import { useState, useEffect } from "react";
import type { GameState, Player } from "@/types";
import { formatGameClock, formatShotClock } from "@/lib/clock";
import { getPeriodLabel, isOvertime, isTeamInBonus } from "@/lib/fiba";
import { TEAM_FOUL_BONUS_THRESHOLD } from "@/constants";

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

  const clockColorClass = isLastFive ? "clock--urgent font-bold" : "text-[--clock-amber]";

  const homeOnCourt = state.home.players.filter(p => p.onCourt);
  const awayOnCourt = state.away.players.filter(p => p.onCourt);
  const homeBench = state.home.players.filter(p => !p.onCourt);
  const awayBench = state.away.players.filter(p => !p.onCourt);

  return (
    <div className="h-full w-full bg-[--bg-canvas] text-[--text-primary] p-2 sm:p-3 flex flex-col font-sans transition-colors duration-300 relative select-none overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col bg-[--bg-surface] border border-[--border-strong] rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Status Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 text-xs uppercase tracking-widest text-[--text-secondary] font-semibold border-b border-[--border-subtle] shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[--live-red] live-dot" />
            <span className="font-semibold text-[--live-red]">LIVE</span>
            <span className="ml-3 font-mono font-bold text-[clamp(0.85rem,1.8vh,1.15rem)] text-[--text-primary] tabular-nums">
              {getPeriodLabel(state.period)} · {formatGameClock(state.gameClock.remainingMs)}
            </span>
          </div>
          <span className="text-[10px] tracking-[0.2em] text-[--text-tertiary]">FIBA SCORING</span>
        </div>

        {/* Team color stripes */}
        <div className="flex h-0.5 w-full overflow-hidden shrink-0">
          <div className="h-full" style={{ width: "35%", backgroundColor: state.home.color }} />
          <div className="h-full bg-[--border-subtle]" style={{ width: "30%" }} />
          <div className="h-full" style={{ width: "35%", backgroundColor: state.away.color }} />
        </div>

        {/* 3-column body: banc gauche | centre | banc droit */}
        <div className="flex-1 min-h-0 grid grid-cols-[minmax(90px,14%)_1fr_minmax(90px,14%)] md:grid-cols-[minmax(175px,20%)_1fr_minmax(175px,20%)] overflow-hidden">
          <BenchSidebar
            players={homeBench}
            teamColor={state.home.color}
            side="left"
          />

          {/* Centre — en-têtes, scores, chrono, terrain */}
          <div className="flex flex-col min-h-0 min-w-0 overflow-hidden">
            {/* Team headers + period */}
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4 px-2 sm:px-4 pt-2 sm:pt-3 pb-1 shrink-0 min-h-[clamp(6rem,17vh,12rem)]">
              <TeamHeader team={state.home} align="left" />
              <div className="flex flex-col items-center justify-center px-3 sm:px-4 min-w-[clamp(5rem,12vw,9rem)]">
                <span className="text-[clamp(0.75rem,1.7vh,1rem)] tracking-[0.25em] font-black text-[--text-secondary] uppercase text-center leading-tight">
                  QUART-TEMPS
                </span>
                <span className="text-[clamp(2rem,5.5vh,3.5rem)] font-extrabold font-mono text-[--text-primary] tracking-tighter mt-1 sm:mt-1.5 tabular-nums leading-none">
                  {typeof state.period === "number" ? state.period : state.period.replace("OT", "OT ")}
                </span>
              </div>
              <TeamHeader team={state.away} align="right" />
            </div>

            {/* Scores + clocks */}
            <div className="flex-1 min-h-0 flex items-center justify-center px-2 sm:px-4 py-1">
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-6 w-full max-w-[1400px]">
                <TeamScoreColumn
                  score={state.home.score}
                  color={state.home.color}
                  teamFouls={state.home.teamFouls}
                  timeoutsLeft={state.home.timeoutsLeft}
                  inBonus={isTeamInBonus(state.home.teamFouls)}
                />

                <div className="flex flex-col items-center justify-center min-w-[200px] sm:min-w-[320px] px-2">
                  <span
                    className={`font-mono font-bold text-[clamp(3.5rem,9.5vh,6.5rem)] leading-none tracking-tighter tabular-nums ${clockColorClass}`}
                  >
                    {formatCustomClock(state.gameClock.remainingMs, shouldFormatSSd)}
                  </span>
                  <div className="w-24 sm:w-32 h-px bg-[--border-default] my-[clamp(0.35rem,1.3vh,0.85rem)]" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[clamp(0.75rem,1.7vh,1rem)] font-black tracking-[0.25em] text-[--text-secondary] uppercase leading-none">
                      TEMPS DE POSSESION
                    </span>
                    <span
                      className={`font-mono font-bold text-[clamp(2.5rem,7.5vh,4.5rem)] leading-none tracking-tighter transition-all duration-200 ${
                        isShotUrgent ? "text-[--out-danger] scale-105" : "text-[--text-primary]"
                      }`}
                    >
                      {shotClockDisplay}
                    </span>
                  </div>
                  <PossessionIndicator
                    possession={state.possessionArrow}
                    homeShort={state.home.shortName}
                    awayShort={state.away.shortName}
                    homeColor={state.home.color}
                    awayColor={state.away.color}
                  />
                </div>

                <TeamScoreColumn
                  score={state.away.score}
                  color={state.away.color}
                  teamFouls={state.away.teamFouls}
                  timeoutsLeft={state.away.timeoutsLeft}
                  inBonus={isTeamInBonus(state.away.teamFouls)}
                />
              </div>
            </div>

            {/* On-court roster — 4 colonnes : nom local | stats loc | stats vis | nom visiteur */}
            <div className="shrink-0 border-t border-[--border-subtle] px-4 sm:px-6 pt-2 pb-1">
              <div className="grid grid-cols-[1fr_125px_125px_1fr] gap-x-3 sm:gap-x-5 text-[clamp(0.65rem,1.5vh,0.85rem)] uppercase tracking-[0.15em] text-[--text-secondary] font-black">
                <span>SUR LE TERRAIN (LOC)</span>
                <span className="col-span-2 text-center whitespace-nowrap">POINTS · FAUTES</span>
                <span className="text-right">SUR LE TERRAIN (VIS)</span>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-hidden px-4 sm:px-6 pb-3 sm:pb-4 flex flex-col justify-evenly">
              {homeOnCourt.length === 0 && awayOnCourt.length === 0 ? (
                <div className="text-sm text-[--text-tertiary] italic font-medium text-center py-2">
                  Aucun joueur sur le terrain
                </div>
              ) : (
                Array.from({ length: Math.max(homeOnCourt.length, awayOnCourt.length) }).map((_, idx) => (
                  <PlayerRowMirror
                    key={idx}
                    homePlayer={homeOnCourt[idx]}
                    awayPlayer={awayOnCourt[idx]}
                    homeColor={state.home.color}
                    awayColor={state.away.color}
                    isFirst={idx === 0}
                  />
                ))
              )}
            </div>
          </div>

          <BenchSidebar
            players={awayBench}
            teamColor={state.away.color}
            side="right"
          />
        </div>
      </div>

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

function TeamHeader({
  team,
  align,
}: {
  team: GameState["home"];
  align: "left" | "right";
}) {
  const label = align === "left" ? "ÉQUIPE LOCALE" : "ÉQUIPE VISITEUR";

  const logoSize =
    "w-[clamp(5.5rem,15vh,9.5rem)] h-[clamp(5.5rem,15vh,9.5rem)]";

  const logo = team.logoUrl ? (
    <div
      className={`${logoSize} rounded-xl border-[2.5px] flex items-center justify-center p-1 sm:p-1.5 overflow-hidden shrink-0`}
      style={{
        borderColor: team.color,
        backgroundColor: `${team.color}1A`,
        boxShadow: `0 0 0 1px ${team.color}25`,
      }}
    >
      <img
        src={team.logoUrl}
        alt={team.shortName}
        className="w-full h-full object-contain drop-shadow-[0_2px_6px_rgba(0,0,0,0.3)]"
      />
    </div>
  ) : (
    <div
      className={`${logoSize} rounded-xl border-[2.5px] flex items-center justify-center font-black font-mono shrink-0 text-[clamp(1.8rem,5vh,3rem)]`}
      style={{ color: team.color, borderColor: team.color, backgroundColor: `${team.color}1A` }}
    >
      {team.shortName.slice(0, 2)}
    </div>
  );

  const words = team.name.trim().split(/\s+/);
  const hasMultiLine = words.length > 3;
  const line1 = hasMultiLine ? words.slice(0, 2).join(" ") : team.name;
  const line2 = hasMultiLine ? words.slice(2).join(" ") : null;

  return (
    <div
      className={`flex flex-1 min-w-0 items-center gap-3 sm:gap-4 py-0.5 ${
        align === "right" ? "flex-row-reverse text-right" : "flex-row text-left"
      }`}
    >
      {logo}
      <div
        className={`flex flex-col gap-0.5 min-w-0 flex-1 ${
          hasMultiLine ? "items-center text-center" : align === "right" ? "items-end text-right" : "items-start text-left"
        }`}
      >
        <span
          className="text-[clamp(1.25rem,3.5vh,2.1rem)] font-black uppercase leading-[1.1] tracking-tight max-w-full"
          style={{ color: team.color }}
          title={team.name}
        >
          {line2 ? (
            <>
              <span className="block">{line1}</span>
              <span className="block">{line2}</span>
            </>
          ) : (
            team.name
          )}
        </span>
        <span className="text-[clamp(0.75rem,1.6vh,0.95rem)] tracking-[0.2em] font-bold uppercase text-[--text-secondary]">
          {label}
        </span>
      </div>
    </div>
  );
}

function TeamScoreColumn({
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
    <div className="flex flex-col items-center gap-3 sm:gap-4">
      <ScoreDisplay score={score} color={color} />
      <TeamStatsUnderScore
        teamFouls={teamFouls}
        timeoutsLeft={timeoutsLeft}
        inBonus={inBonus}
        teamColor={color}
      />
    </div>
  );
}

function PossessionIndicator({
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
    "text-[--clock-amber] poss-indicator drop-shadow-[0_0_12px_rgba(251,191,36,0.65)] scale-110";
  const idleClass = "text-[--text-tertiary] opacity-20";

  return (
    <div className="flex flex-col items-center gap-1.5 mt-[clamp(0.4rem,1.2vh,0.85rem)] w-full max-w-[400px]">
      <span className="text-[clamp(0.75rem,1.7vh,1rem)] font-black tracking-[0.2em] text-[--text-secondary] uppercase">
        Possession
      </span>
      <div className="flex items-center justify-center gap-4 sm:gap-6 w-full">
        <div className={`flex items-center gap-1 ${awayActive ? activeClass : idleClass}`}>
          <span className="text-[clamp(1.5rem,3.2vh,2.2rem)] font-black leading-none">◀</span>
          <span className="text-[clamp(1.5rem,3.2vh,2.2rem)] font-black leading-none">◀</span>
        </div>
        <span
          className="text-[clamp(0.9rem,2vh,1.25rem)] font-black uppercase tracking-wide truncate max-w-[140px] sm:max-w-[200px] text-center"
          style={{ color: homeActive ? homeColor : awayColor }}
        >
          {homeActive ? homeShort : awayShort}
        </span>
        <div className={`flex items-center gap-1 ${homeActive ? activeClass : idleClass}`}>
          <span className="text-[clamp(1.5rem,3.2vh,2.2rem)] font-black leading-none">▶</span>
          <span className="text-[clamp(1.5rem,3.2vh,2.2rem)] font-black leading-none">▶</span>
        </div>
      </div>
    </div>
  );
}

function TeamStatsUnderScore({
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
    <div className="flex flex-col items-center gap-2 sm:gap-3 w-full max-w-[340px]">
      <div className="flex items-center justify-center gap-6 sm:gap-9 flex-wrap">
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[clamp(0.75rem,1.7vh,0.95rem)] tracking-[0.15em] font-black text-[--text-secondary] uppercase text-center">
            Fautes équipe
          </span>
          <TeamFoulsBar count={teamFouls} teamColor={teamColor} large />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[clamp(0.75rem,1.7vh,0.95rem)] tracking-[0.15em] font-black text-[--text-secondary] uppercase text-center">
            Timeouts
          </span>
          <TimeoutsIndicator left={timeoutsLeft} large teamColor={teamColor} />
        </div>
      </div>
      {inBonus && (
        <div className="bonus-badge bg-[--bonus-bg] text-[--bonus-warn] font-bold text-[clamp(0.75rem,1.7vh,0.95rem)] uppercase px-4 py-1.5 rounded-full border border-[--bonus-warn]/20 flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-[--bonus-warn] animate-ping" />
          BONUS
        </div>
      )}
    </div>
  );
}

function ScoreDisplay({ score, color }: { score: number; color: string }) {
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
        className={`font-mono font-bold select-none text-[clamp(4rem,11.5vh,8.5rem)] leading-none tracking-tighter text-[--text-primary] ${
          flash ? "score--flash" : ""
        }`}
      >
        {score.toString().padStart(2, "0")}
      </span>
      <div className="h-[4px] w-[55%] rounded-full mt-1.5 sm:mt-2" style={{ backgroundColor: color }} />
    </div>
  );
}

function BenchSidebar({
  players,
  teamColor,
  side,
}: {
  players: Player[];
  teamColor: string;
  side: "left" | "right";
}) {
  const top = [...players].sort((a, b) => b.points - a.points).slice(0, 8);
  const borderSide = side === "left" ? "border-r" : "border-l";
  const accentSide = side === "left" ? "left-0" : "right-0";

  return (
    <div
      className={`relative flex flex-col min-h-0 py-3 px-2 sm:px-3 ${borderSide} border-[--border-subtle] bg-[--bg-surface-2]/30`}
      style={{ boxShadow: side === "left" ? `inset 4px 0 0 ${teamColor}` : `inset -4px 0 0 ${teamColor}` }}
    >
      <div className={`absolute top-0 ${accentSide} w-1 h-full rounded-full opacity-80`} style={{ backgroundColor: teamColor }} />

      <span
        className="text-[clamp(0.85rem,1.8vh,1.1rem)] font-black uppercase tracking-[0.25em] text-center mb-2 shrink-0"
        style={{ color: teamColor }}
      >
        Banc
      </span>
      <div className="h-px w-full bg-[--border-subtle] mb-2 shrink-0 opacity-60" style={{ backgroundColor: `${teamColor}25` }} />

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 sm:gap-4">
        {top.length === 0 ? (
          <p className="text-[11px] text-[--text-tertiary] italic text-center py-4">—</p>
        ) : (
          top.map(p => (
            <div key={p.id} className="flex items-center gap-2.5 min-w-0 py-1">
              <div
                className="w-[40px] h-[30px] sm:w-[48px] sm:h-[36px] rounded-md flex items-center justify-center font-mono font-black text-[clamp(1rem,2vh,1.25rem)] shrink-0"
                style={{ backgroundColor: `${teamColor}1A`, color: teamColor, border: `1px solid ${teamColor}35` }}
              >
                {p.number.padStart(2, "0")}
              </div>
              <span className="text-[clamp(1rem,2vh,1.3rem)] font-black uppercase truncate text-[--text-primary] flex-1 leading-tight">
                {p.name}
              </span>
              <span className="font-mono text-[clamp(1rem,2vh,1.25rem)] font-black tabular-nums text-[--text-primary] shrink-0 min-w-[1.5rem] text-right">
                {p.points}
              </span>
              <div className="flex gap-[4px] shrink-0">
                {[0, 1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="w-[12px] h-[12px] sm:w-[14px] sm:h-[14px] rounded-full transition-all duration-300"
                    style={
                      i < p.fouls
                        ? { backgroundColor: teamColor, borderColor: teamColor, border: "1px solid" }
                        : { border: "1px solid var(--border-strong)", backgroundColor: "transparent" }
                    }
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
}

function TeamFoulsBar({
  count,
  teamColor,
  large,
}: {
  count: number;
  teamColor: string;
  large?: boolean;
}) {
  return (
    <div className={`flex gap-1.5 sm:gap-2 ${large ? "mt-0" : "mt-1.5"}`}>
      {Array.from({ length: TEAM_FOUL_BONUS_THRESHOLD }, (_, i) => i).map(i => (
        <div
          key={i}
          className={
            large
              ? "h-3 sm:h-3.5 w-8 sm:w-9 rounded-xs transition-all duration-300"
              : "h-1.5 w-6 rounded-xs transition-all duration-300"
          }
          style={{
            backgroundColor: i < count ? teamColor : "var(--border-subtle)",
          }}
        />
      ))}
    </div>
  );
}

const MAX_TIMEOUTS = 3;

function TimeoutsIndicator({ left, large, teamColor }: { left: number; large?: boolean; teamColor: string }) {
  const size = large ? "w-4 h-4 sm:w-5 sm:h-5" : "w-2.5 h-2.5";
  return (
    <div className={`flex gap-1.5 sm:gap-2 ${large ? "mt-0" : "mt-1.5"}`}>
      {Array.from({ length: MAX_TIMEOUTS }, (_, i) => i).map(i => (
        <div
          key={i}
          className={`${size} rounded-full transition-all duration-300 border-2`}
          style={
            i < left
              ? { backgroundColor: teamColor, borderColor: teamColor }
              : { backgroundColor: "transparent", borderColor: "var(--border-strong)" }
          }
        />
      ))}
    </div>
  );
}

function PlayerRowMirror({
  homePlayer,
  awayPlayer,
  homeColor,
  awayColor,
  isFirst,
}: {
  homePlayer?: Player;
  awayPlayer?: Player;
  homeColor: string;
  awayColor: string;
  isFirst: boolean;
}) {
  return (
    <div
      className={`grid grid-cols-[1fr_125px_125px_1fr] gap-x-3 sm:gap-x-5 items-center py-[clamp(0.3rem,1vh,0.6rem)] ${
        !isFirst ? "border-t border-[--border-subtle]" : ""
      }`}
    >
      {homePlayer ? (
        <OnCourtPlayerName player={homePlayer} teamColor={homeColor} align="left" />
      ) : (
        <div />
      )}
      {homePlayer ? <OnCourtPlayerStats player={homePlayer} teamColor={homeColor} /> : <div />}
      {awayPlayer ? <OnCourtPlayerStats player={awayPlayer} teamColor={awayColor} /> : <div />}
      {awayPlayer ? (
        <OnCourtPlayerName player={awayPlayer} teamColor={awayColor} align="right" />
      ) : (
        <div />
      )}
    </div>
  );
}

function OnCourtPlayerName({
  player,
  teamColor,
  align,
}: {
  player: Player;
  teamColor: string;
  align: "left" | "right";
}) {
  const isOut = player.fouls >= 5;
  return (
    <div
      className={`flex items-center gap-2 sm:gap-3 min-w-0 ${align === "right" ? "flex-row-reverse" : ""}`}
    >
      <div
        className="w-[38px] h-[28px] sm:w-[46px] sm:h-[34px] rounded-md flex items-center justify-center font-mono font-black text-[clamp(0.9rem,2vh,1.2rem)] shrink-0"
        style={
          isOut
            ? { backgroundColor: "var(--out-danger)", color: "#ffffff" }
            : { backgroundColor: `${teamColor}1A`, color: teamColor }
        }
      >
        {player.number.padStart(2, "0")}
      </div>
      <span
        className={`text-[clamp(0.9rem,2.1vh,1.2rem)] font-black uppercase truncate flex-1 ${
          align === "right" ? "text-right" : ""
        } ${isOut ? "text-[--out-danger]" : "text-[--text-primary]"}`}
      >
        {player.name}
      </span>
      {isOut && (
        <span className="bg-[--out-danger] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0">
          OUT
        </span>
      )}
    </div>
  );
}

function OnCourtPlayerStats({ player, teamColor }: { player: Player; teamColor: string }) {
  const isOut = player.fouls >= 5;
  return (
    <div className="flex flex-row items-center justify-center gap-5">
      <span
        className={`font-mono text-[clamp(1rem,2.3vh,1.5rem)] font-black tabular-nums leading-none shrink-0 ${
          isOut ? "text-[--out-danger]" : "text-[--text-primary]"
        }`}
      >
        {player.points}
      </span>
      <div className="flex gap-[3px]">
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            className="w-[11px] h-[11px] sm:w-[13px] sm:h-[13px] rounded-full transition-all duration-300"
            style={
              i < player.fouls
                ? { backgroundColor: teamColor, borderColor: teamColor, border: "1px solid" }
                : { border: "1px solid var(--border-strong)", backgroundColor: "transparent" }
            }
          />
        ))}
      </div>
    </div>
  );
}
