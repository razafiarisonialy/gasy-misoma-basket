import { useReducer, useCallback, useEffect, useRef } from "react";
import type { GameState, GameAction, Period, Team } from "@/types";
import { tickClock } from "@/lib/clock";
import { QT_DURATION_MS, SHOT_CLOCK_MS } from "@/constants";
import {
  createDefaultTeam,
  getNextPeriod,
  getPeriodDurationMs,
  getTimeoutsForPeriod,
  shouldResetTeamFouls,
  isHalfTransition,
} from "@/lib/fiba";
import { send, subscribe } from "@/lib/channel";
import { saveState, loadState } from "@/lib/storage";
import defaultLogo from "@/assets/logo.jpg";
import { playBuzzer } from "@/lib/sound";

function createInitialState(): GameState {
  return {
    home: createDefaultTeam("home"),
    away: createDefaultTeam("away"),
    period: 1,
    gameClock: { remainingMs: QT_DURATION_MS, running: false, lastTickAt: null },
    shotClock: { remainingMs: SHOT_CLOCK_MS, running: false, lastTickAt: null },
    possessionArrow: "home",
    isHalftime: false,
    isFinished: false,
    organizationLogoUrl: defaultLogo,
  };
}

function updateTeamInState(
  state: GameState,
  side: "home" | "away",
  updater: (team: Team) => Team
): GameState {
  return { ...state, [side]: updater(state[side]) };
}

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "TICK": {
      let next = { ...state };

      if (state.gameClock.running) {
        const gc = tickClock(
          state.gameClock.remainingMs,
          state.gameClock.lastTickAt,
          action.now
        );
        next.gameClock = { ...state.gameClock, ...gc };

        if (gc.remainingMs <= 0) {
          next.gameClock = { remainingMs: 0, running: false, lastTickAt: null };
          next.shotClock = { ...next.shotClock, running: false, lastTickAt: null };
        }
      }

      if (next.shotClock.running && next.gameClock.running) {
        const sc = tickClock(
          state.shotClock.remainingMs,
          state.shotClock.lastTickAt,
          action.now
        );
        next.shotClock = { ...next.shotClock, ...sc };

        if (sc.remainingMs <= 0) {
          next.shotClock = { remainingMs: 0, running: false, lastTickAt: null };
          next.gameClock = { ...next.gameClock, running: false, lastTickAt: null };
        }
      }

      return next;
    }

    case "TOGGLE_GAME_CLOCK": {
      const running = !state.gameClock.running;
      const now = Date.now();
      return {
        ...state,
        gameClock: {
          ...state.gameClock,
          running,
          lastTickAt: running ? now : null,
        },
        shotClock: {
          ...state.shotClock,
          running: running ? state.shotClock.running : false,
          lastTickAt: running && state.shotClock.running ? now : null,
        },
      };
    }

    case "STOP_GAME_CLOCK":
      return {
        ...state,
        gameClock: { ...state.gameClock, running: false, lastTickAt: null },
        shotClock: { ...state.shotClock, running: false, lastTickAt: null },
      };

    case "SET_GAME_CLOCK":
      return {
        ...state,
        gameClock: { ...state.gameClock, remainingMs: action.ms, lastTickAt: null },
      };

    case "RESET_GAME_CLOCK":
      return {
        ...state,
        gameClock: {
          remainingMs: getPeriodDurationMs(state.period),
          running: false,
          lastTickAt: null,
        },
        shotClock: { remainingMs: SHOT_CLOCK_MS, running: false, lastTickAt: null },
      };

    case "TOGGLE_SHOT_CLOCK": {
      if (!state.gameClock.running) return state;
      const running = !state.shotClock.running;
      return {
        ...state,
        shotClock: {
          ...state.shotClock,
          running,
          lastTickAt: running ? Date.now() : null,
        },
      };
    }

    case "STOP_SHOT_CLOCK":
      return {
        ...state,
        shotClock: { ...state.shotClock, running: false, lastTickAt: null },
      };

    case "RESET_SHOT_CLOCK": {
      const ms = action.to === 14 ? 14000 : 24000;
      return {
        ...state,
        shotClock: {
          remainingMs: ms,
          running: state.gameClock.running,
          lastTickAt: state.gameClock.running ? Date.now() : null,
        },
      };
    }

    case "ADD_SCORE":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        score: Math.max(0, team.score + action.points),
      }));

    case "ADD_PLAYER_SCORE":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        score: Math.max(0, team.score + action.points),
        players: team.players.map((p) =>
          p.id === action.playerId
            ? { ...p, points: Math.max(0, p.points + action.points) }
            : p
        ),
      }));

    case "ADD_TEAM_FOUL":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        teamFouls: Math.max(0, team.teamFouls + action.delta),
      }));

    case "ADD_PLAYER_FOUL":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        teamFouls: team.teamFouls + 1,
        players: team.players.map((p) =>
          p.id === action.playerId
            ? { ...p, fouls: Math.min(5, p.fouls + 1) }
            : p
        ),
      }));

    case "USE_TIMEOUT":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        timeoutsLeft: Math.max(0, team.timeoutsLeft - 1),
      }));

    case "RESTORE_TIMEOUT":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        timeoutsLeft: team.timeoutsLeft + 1,
      }));

    case "TOGGLE_POSSESSION":
      return {
        ...state,
        possessionArrow: state.possessionArrow === "home" ? "away" : "home",
      };

    case "SET_PERIOD":
      return {
        ...state,
        period: action.period,
        gameClock: {
          remainingMs: getPeriodDurationMs(action.period),
          running: false,
          lastTickAt: null,
        },
        shotClock: { remainingMs: SHOT_CLOCK_MS, running: false, lastTickAt: null },
      };

    case "NEXT_PERIOD": {
      const oldPeriod = state.period;
      const newPeriod: Period = getNextPeriod(oldPeriod);
      const timeouts = getTimeoutsForPeriod(newPeriod);
      const resetFouls = shouldResetTeamFouls(oldPeriod, newPeriod);
      const isHalf = isHalfTransition(oldPeriod, newPeriod);

      return {
        ...state,
        period: newPeriod,
        gameClock: {
          remainingMs: getPeriodDurationMs(newPeriod),
          running: false,
          lastTickAt: null,
        },
        shotClock: { remainingMs: SHOT_CLOCK_MS, running: false, lastTickAt: null },
        home: {
          ...state.home,
          teamFouls: resetFouls ? 0 : state.home.teamFouls,
          timeoutsLeft: isHalf || typeof newPeriod === "string"
            ? timeouts.home
            : state.home.timeoutsLeft,
        },
        away: {
          ...state.away,
          teamFouls: resetFouls ? 0 : state.away.teamFouls,
          timeoutsLeft: isHalf || typeof newPeriod === "string"
            ? timeouts.away
            : state.away.timeoutsLeft,
        },
        isHalftime: false,
      };
    }

    case "SET_HALFTIME":
      return {
        ...state,
        isHalftime: action.value,
        gameClock: { ...state.gameClock, running: false, lastTickAt: null },
        shotClock: { ...state.shotClock, running: false, lastTickAt: null },
      };

    case "FINISH_GAME":
      return {
        ...state,
        isFinished: true,
        gameClock: { ...state.gameClock, running: false, lastTickAt: null },
        shotClock: { ...state.shotClock, running: false, lastTickAt: null },
      };

    case "TOGGLE_ON_COURT":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        players: team.players.map((p) =>
          p.id === action.playerId ? { ...p, onCourt: !p.onCourt } : p
        ),
      }));

    case "ADD_PLAYER":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        players: [...team.players, action.player],
      }));

    case "REMOVE_PLAYER":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        players: team.players.filter((p) => p.id !== action.playerId),
      }));

    case "UPDATE_TEAM":
      return updateTeamInState(state, action.side, (team) => ({
        ...team,
        name: action.name,
        shortName: action.shortName,
        color: action.color,
        logoUrl: action.logoUrl !== undefined ? action.logoUrl : team.logoUrl,
      }));

    case "UPDATE_ORG_LOGO":
      return { ...state, organizationLogoUrl: action.logoUrl };

    case "RESET_GAME":
      return createInitialState();

    case "HYDRATE":
      return action.state;

    default:
      return state;
  }
}

export function useGameState(isControl: boolean) {
  const saved = isControl ? loadState() : null;
  const [state, dispatch] = useReducer(gameReducer, saved ?? createInitialState());
  const stateRef = useRef(state);
  stateRef.current = state;
  const lastActionRef = useRef<GameAction | null>(null);

  // Keep track of the previous clock states to detect transition to 0
  const prevGameClockMsRef = useRef(state.gameClock.remainingMs);
  const prevShotClockMsRef = useRef(state.shotClock.remainingMs);

  useEffect(() => {
    // If the game clock transitioned to 0
    if (
      state.gameClock.remainingMs <= 0 &&
      prevGameClockMsRef.current > 0 &&
      prevGameClockMsRef.current !== state.gameClock.remainingMs
    ) {
      playBuzzer();
    }
    prevGameClockMsRef.current = state.gameClock.remainingMs;
  }, [state.gameClock.remainingMs]);

  useEffect(() => {
    // If the shot clock transitioned to 0
    if (
      state.shotClock.remainingMs <= 0 &&
      prevShotClockMsRef.current > 0 &&
      prevShotClockMsRef.current !== state.shotClock.remainingMs
    ) {
      playBuzzer();
    }
    prevShotClockMsRef.current = state.shotClock.remainingMs;
  }, [state.shotClock.remainingMs]);

  const dispatchAndSync = useCallback(
    (action: GameAction) => {
      lastActionRef.current = action;
      dispatch(action);
    },
    []
  );

  useEffect(() => {
    if (!isControl) return;
    if (lastActionRef.current?.type !== "TICK") {
      saveState(state);
      send({ type: "STATE_UPDATE", payload: state });
    }
  }, [state, isControl]);

  useEffect(() => {
    const unsub = subscribe((event) => {
      if (event.type === "STATE_UPDATE" && !isControl) {
        lastActionRef.current = { type: "HYDRATE", state: event.payload };
        dispatch({ type: "HYDRATE", state: event.payload });
      }
      if (event.type === "REQUEST_STATE" && isControl) {
        send({ type: "STATE_UPDATE", payload: stateRef.current });
      }
      if (event.type === "PLAY_BUZZER" && !isControl) {
        playBuzzer();
      }
    });
    return unsub;
  }, [isControl]);

  useEffect(() => {
    if (!isControl) {
      send({ type: "REQUEST_STATE" });
    }
  }, [isControl]);

  useEffect(() => {
    let rafId: number;
    const tick = () => {
      if (stateRef.current.gameClock.running || stateRef.current.shotClock.running) {
        const now = Date.now();
        lastActionRef.current = { type: "TICK", now };
        dispatch({ type: "TICK", now });
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  return { state, dispatch: dispatchAndSync };
}
