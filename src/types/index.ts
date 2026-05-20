export type TeamSide = "home" | "away";

export type Player = {
  id: string;
  number: string;
  name: string;
  points: number;
  fouls: number;
  onCourt: boolean;
};

export type Team = {
  name: string;
  shortName: string;
  color: string;
  score: number;
  teamFouls: number;
  timeoutsLeft: number;
  players: Player[];
  logoUrl?: string; // New field for team photo/logo
};

export type Period = 1 | 2 | 3 | 4 | `OT${number}`;

export type GameClock = {
  remainingMs: number;
  running: boolean;
  lastTickAt: number | null;
};

export type ShotClock = {
  remainingMs: number;
  running: boolean;
  lastTickAt: number | null;
};

export type GameState = {
  home: Team;
  away: Team;
  period: Period;
  gameClock: GameClock;
  shotClock: ShotClock;
  possessionArrow: TeamSide;
  isHalftime: boolean;
  isFinished: boolean;
  organizationLogoUrl?: string; // New field for organization logo
};

export type GameAction =
  | { type: "TICK"; now: number }
  | { type: "TOGGLE_GAME_CLOCK" }
  | { type: "STOP_GAME_CLOCK" }
  | { type: "SET_GAME_CLOCK"; ms: number }
  | { type: "RESET_GAME_CLOCK" }
  | { type: "TOGGLE_SHOT_CLOCK" }
  | { type: "STOP_SHOT_CLOCK" }
  | { type: "RESET_SHOT_CLOCK"; to: 24 | 14 }
  | { type: "ADD_SCORE"; side: TeamSide; points: number }
  | { type: "ADD_PLAYER_SCORE"; side: TeamSide; playerId: string; points: number }
  | { type: "ADD_TEAM_FOUL"; side: TeamSide; delta: number }
  | { type: "ADD_PLAYER_FOUL"; side: TeamSide; playerId: string }
  | { type: "USE_TIMEOUT"; side: TeamSide }
  | { type: "RESTORE_TIMEOUT"; side: TeamSide }
  | { type: "TOGGLE_POSSESSION" }
  | { type: "SET_PERIOD"; period: Period }
  | { type: "NEXT_PERIOD" }
  | { type: "SET_HALFTIME"; value: boolean }
  | { type: "FINISH_GAME" }
  | { type: "TOGGLE_ON_COURT"; side: TeamSide; playerId: string }
  | { type: "ADD_PLAYER"; side: TeamSide; player: Player }
  | { type: "REMOVE_PLAYER"; side: TeamSide; playerId: string }
  | { type: "UPDATE_TEAM"; side: TeamSide; name: string; shortName: string; color: string; logoUrl?: string }
  | { type: "UPDATE_ORG_LOGO"; logoUrl: string }
  | { type: "RESET_GAME" }
  | { type: "HYDRATE"; state: GameState };
