import type { GameState } from "@/types";

export type GameEvent =
  | { type: "STATE_UPDATE"; payload: GameState }
  | { type: "REQUEST_STATE" }
  | { type: "PLAY_BUZZER" };

const channel = new BroadcastChannel("scoring-fiba");

export function send(event: GameEvent) {
  channel.postMessage(event);
}

export function subscribe(handler: (event: GameEvent) => void) {
  const listener = (e: MessageEvent<GameEvent>) => handler(e.data);
  channel.addEventListener("message", listener);
  return () => channel.removeEventListener("message", listener);
}
