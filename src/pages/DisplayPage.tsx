import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useGameState } from "@/hooks/useGameState";
import DisplayFull from "@/components/display/DisplayFull";
import DisplayCompact from "@/components/display/DisplayCompact";
import { playChime } from "@/lib/sound";

export default function DisplayPage() {
  const { state } = useGameState(false);
  const [searchParams] = useSearchParams();
  const mode = searchParams.get("mode") || "full";
  const [audioUnlocked, setAudioUnlocked] = useState(false);

  useEffect(() => {
    const handleUnlock = () => {
      setAudioUnlocked(true);
      playChime();
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
    };

    window.addEventListener("click", handleUnlock);
    window.addEventListener("touchstart", handleUnlock);

    return () => {
      window.removeEventListener("click", handleUnlock);
      window.removeEventListener("touchstart", handleUnlock);
    };
  }, []);

  return (
    <div className="relative">
      {!audioUnlocked && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] bg-amber-500/10 border border-amber-500/20 backdrop-blur-md px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-amber-500/10 animate-bounce pointer-events-none">
          <span className="text-amber-400 text-sm">🔊</span>
          <span className="text-xs text-amber-300 font-bold uppercase tracking-wider">
            Cliquez n'importe où pour activer le son du buzzer
          </span>
        </div>
      )}
      {mode === "compact" ? (
        <DisplayCompact state={state} />
      ) : (
        <DisplayFull state={state} />
      )}
    </div>
  );
}

