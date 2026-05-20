import type { Period, Team } from "@/types";
import { QT_DURATION_MS, OT_DURATION_MS, FOUL_LIMIT, TEAM_FOUL_BONUS_THRESHOLD } from "@/constants";

export function isPlayerDisqualified(fouls: number): boolean {
  return fouls >= FOUL_LIMIT;
}

export function isTeamInBonus(teamFouls: number): boolean {
  return teamFouls >= TEAM_FOUL_BONUS_THRESHOLD;
}

export function isOvertime(period: Period): boolean {
  return typeof period === "string" && period.startsWith("OT");
}

export function getPeriodLabel(period: Period): string {
  if (typeof period === "number") return `Q${period}`;
  return period;
}

export function getPeriodDurationMs(period: Period): number {
  return isOvertime(period) ? OT_DURATION_MS : QT_DURATION_MS;
}

export function getNextPeriod(current: Period): Period {
  if (typeof current === "number" && current < 4) {
    return (current + 1) as 1 | 2 | 3 | 4;
  }
  if (current === 4) return "OT1";
  if (typeof current === "string") {
    const num = parseInt(current.replace("OT", ""), 10);
    return `OT${num + 1}` as Period;
  }
  return "OT1";
}

export function getTimeoutsForPeriod(period: Period): { home: number; away: number } {
  if (typeof period === "number") {
    if (period <= 2) return { home: 2, away: 2 };
    return { home: 3, away: 3 };
  }
  return { home: 1, away: 1 };
}

export function getMaxTimeoutsInQ4(): number {
  return 2;
}

export function shouldResetTeamFouls(oldPeriod: Period, newPeriod: Period): boolean {
  if (isOvertime(newPeriod) && (oldPeriod === 4 || isOvertime(oldPeriod))) {
    return false;
  }
  return true;
}

export function isHalfTransition(oldPeriod: Period, newPeriod: Period): boolean {
  return oldPeriod === 2 && newPeriod === 3;
}

export function createDefaultTeam(side: "home" | "away"): Team {
  const isHome = side === "home";
  return {
    name: isHome ? "Équipe A" : "Équipe B",
    shortName: isHome ? "EQA" : "EQB",
    color: isHome ? "#3b82f6" : "#ef4444",
    score: 0,
    teamFouls: 0,
    timeoutsLeft: 2,
    players: [],
  };
}
