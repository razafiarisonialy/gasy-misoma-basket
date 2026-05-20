export function formatGameClock(ms: number): string {
  if (ms <= 0) return "0.0";

  const totalSeconds = ms / 1000;

  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  }

  const seconds = Math.floor(totalSeconds);
  const tenths = Math.floor((ms % 1000) / 100);
  return `${seconds}.${tenths}`;
}

export function formatShotClock(ms: number): string {
  if (ms <= 0) return "0";
  const seconds = Math.ceil(ms / 1000);
  return seconds.toString();
}

export function tickClock(
  remainingMs: number,
  lastTickAt: number | null,
  now: number
): { remainingMs: number; lastTickAt: number } {
  if (lastTickAt === null) {
    return { remainingMs, lastTickAt: now };
  }
  const delta = now - lastTickAt;
  const newRemaining = Math.max(0, remainingMs - delta);
  return { remainingMs: newRemaining, lastTickAt: now };
}


