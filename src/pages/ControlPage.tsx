import { useEffect, useCallback, useState } from "react";
import { useGameState } from "@/hooks/useGameState";
import ClockPanel from "@/components/control/ClockPanel";
import TeamControl from "@/components/control/TeamControl";
import PeriodSelector from "@/components/control/PeriodSelector";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { playBuzzer } from "@/lib/sound";
import { send } from "@/lib/channel";

export default function ControlPage() {
  const { state, dispatch } = useGameState(true);
  const [showResetModal, setShowResetModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showOrgLogoModal, setShowOrgLogoModal] = useState(false);
  const [orgLogoUrl, setOrgLogoUrl] = useState(state.organizationLogoUrl || "");
  const [dismissFinishedModal, setDismissFinishedModal] = useState(false);

  useEffect(() => {
    if (state.organizationLogoUrl) {
      setOrgLogoUrl(state.organizationLogoUrl);
    }
  }, [state.organizationLogoUrl]);

  useEffect(() => {
    if (!state.isFinished) {
      setDismissFinishedModal(false);
    }
  }, [state.isFinished]);

  const handleOrgLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrgLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const key = e.key.toUpperCase();

      if (e.code === "Space") {
        e.preventDefault();
        dispatch({ type: "TOGGLE_GAME_CLOCK" });
        return;
      }

      switch (key) {
        case "R":
          dispatch({ type: "RESET_SHOT_CLOCK", to: 24 });
          break;
        case "T":
          dispatch({ type: "RESET_SHOT_CLOCK", to: 14 });
          break;
        case "B":
          playBuzzer();
          send({ type: "PLAY_BUZZER" });
          break;
      }

      // H1/H2/H3 and A1/A2/A3: two-key combo via sequential keys
      if (key === "H" || key === "A") {
        const handler = (e2: KeyboardEvent) => {
          const pts = parseInt(e2.key, 10);
          if (pts >= 1 && pts <= 3) {
            dispatch({
              type: "ADD_SCORE",
              side: key === "H" ? "home" : "away",
              points: pts,
            });
          }
          window.removeEventListener("keydown", handler);
        };
        window.addEventListener("keydown", handler, { once: true });
        setTimeout(() => window.removeEventListener("keydown", handler), 1000);
      }
    },
    [dispatch]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      {/* Header */}
      <header className="bg-muted/30 border-b border-border px-4 py-3 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div 
              className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow-inner overflow-hidden cursor-pointer hover:opacity-80"
              onClick={() => setShowOrgLogoModal(true)}
              title="Modifier le logo de l'organisation"
            >
              {state.organizationLogoUrl ? (
                <img src={state.organizationLogoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-muted-foreground text-[6px] font-bold">LOGO</span>
              )}
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground leading-tight">
                {state.home.shortName} vs {state.away.shortName}
              </h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Table de marque</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap items-center">
            <ThemeToggle />
            <button
              onClick={() => window.open("/display", "_blank")}
              className="px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/20"
            >
              📺 Affichage Complet
            </button>
            <button
              onClick={() => window.open("/display?mode=compact", "_blank")}
              className="px-3 py-1.5 rounded-lg bg-purple-600/90 hover:bg-purple-500 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/20"
            >
              📺 Affichage Compact
            </button>
            <button
              onClick={() => setShowResetModal(true)}
              className="px-3 py-1.5 rounded-lg bg-red-800/80 hover:bg-red-700 text-white text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-red-500/20"
            >
              ↺ Réinitialiser
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto p-4 grid gap-4">
        {/* Clock + Period row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ClockPanel
            gameClockMs={state.gameClock.remainingMs}
            gameClockRunning={state.gameClock.running}
            shotClockMs={state.shotClock.remainingMs}
            shotClockRunning={state.shotClock.running}
            period={state.period}
            dispatch={dispatch}
          />
          <PeriodSelector
            period={state.period}
            dispatch={dispatch}
            homeScore={state.home.score}
            awayScore={state.away.score}
          />
        </div>

        {/* Teams row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <TeamControl team={state.home} side="home" dispatch={dispatch} />
          <TeamControl team={state.away} side="away" dispatch={dispatch} />
        </div>

        {/* Footer controls */}
        <div className="bg-gradient-to-r from-gray-900/80 to-gray-900/60 rounded-xl border border-gray-700/50 p-4 flex items-center justify-between flex-wrap gap-3 backdrop-blur-sm">
          {/* Possession arrow */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 uppercase">Possession</span>
            <button
              onClick={() => dispatch({ type: "TOGGLE_POSSESSION" })}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
            >
              <span className={state.possessionArrow === "home" ? "text-yellow-400 text-xl" : "text-gray-600 text-xl"}>
                ◀ {state.home.shortName}
              </span>
              <span className="text-gray-600">|</span>
              <span className={state.possessionArrow === "away" ? "text-yellow-400 text-xl" : "text-gray-600 text-xl"}>
                {state.away.shortName} ▶
              </span>
            </button>
          </div>

          {/* Halftime / End */}
          <div className="flex gap-2">
            <button
              onClick={() => dispatch({ type: "SET_HALFTIME", value: !state.isHalftime })}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                state.isHalftime
                  ? "bg-yellow-600 text-black"
                  : "bg-gray-800 hover:bg-gray-700 text-white"
              }`}
            >
              {state.isHalftime ? "▶ Reprise" : "⏸ Mi-Temps"}
            </button>
            <button
              onClick={() => setShowFinishModal(true)}
              className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white font-semibold text-sm transition-colors"
            >
              🏁 Fin du Match
            </button>
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="text-xs text-gray-600 text-center space-x-3">
          <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">Space</kbd> Start/Stop</span>
          <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">H</kbd>+<kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">1-3</kbd> Home +pts</span>
          <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">A</kbd>+<kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">1-3</kbd> Away +pts</span>
          <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">R</kbd> Shot 24s</span>
          <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">T</kbd> Shot 14s</span>
          <span><kbd className="bg-gray-800 px-1.5 py-0.5 rounded text-gray-400">B</kbd> Buzzer</span>
        </div>
      </main>

      {/* Finished banner */}
      {state.isFinished && !dismissFinishedModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-2xl border border-gray-700/50 p-8 md:p-10 text-center max-w-md w-full shadow-2xl shadow-black/50">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-6">Match Terminé</h2>
            <div className="flex items-center justify-center gap-6 text-5xl font-mono font-black mb-6">
              <span className="font-extrabold" style={{ color: state.home.color }}>{state.home.score}</span>
              <span className="text-gray-700 text-3xl">—</span>
              <span className="font-extrabold" style={{ color: state.away.color }}>{state.away.score}</span>
            </div>
            <p className="text-lg text-gray-400 mb-8">
              {state.home.name} vs {state.away.name}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  dispatch({ type: "RESET_GAME" });
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold text-base transition-all duration-200 shadow-lg shadow-green-500/20 active:scale-95"
              >
                🏆 Commencer un Nouveau Match
              </button>
              <button
                onClick={() => setDismissFinishedModal(true)}
                className="w-full py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold text-sm transition-all duration-200"
              >
                ✕ Consulter la table de marque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset confirmation modal */}
      {showResetModal && (
        <ConfirmModal
          title="Réinitialiser le match ?"
          message="Toutes les données du match seront perdues."
          onConfirm={() => {
            dispatch({ type: "RESET_GAME" });
            setShowResetModal(false);
          }}
          onCancel={() => setShowResetModal(false)}
        />
      )}

      {/* Finish confirmation modal */}
      {showFinishModal && (
        <ConfirmModal
          title="Terminer le match ?"
          message={`Score final : ${state.home.shortName} ${state.home.score} - ${state.away.score} ${state.away.shortName}`}
          onConfirm={() => {
            dispatch({ type: "FINISH_GAME" });
            setShowFinishModal(false);
          }}
          onCancel={() => setShowFinishModal(false)}
        />
      )}

      {/* Org Logo Modal */}
      <Dialog open={showOrgLogoModal} onOpenChange={setShowOrgLogoModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Logo de l'organisation</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="orgLogoFile" className="text-right">
                Fichier Logo
              </Label>
              <div className="col-span-3 flex flex-col gap-2">
                <Input
                  id="orgLogoFile"
                  type="file"
                  accept="image/*"
                  onChange={handleOrgLogoFileChange}
                  className="cursor-pointer"
                />
                <span className="text-[10px] text-muted-foreground">
                  Sélectionnez un fichier image local.
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="orgLogo" className="text-right">
                URL de l'image
              </Label>
              <Input
                id="orgLogo"
                value={orgLogoUrl}
                onChange={(e) => setOrgLogoUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowOrgLogoModal(false)}>Annuler</Button>
            <Button onClick={() => {
              dispatch({ type: "UPDATE_ORG_LOGO", logoUrl: orgLogoUrl });
              setShowOrgLogoModal(false);
            }}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-gradient-to-b from-gray-900 to-gray-950 rounded-xl border border-gray-700/50 p-6 max-w-sm w-full mx-4 shadow-2xl shadow-black/50">
        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
        <p className="text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm transition-all duration-200"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-red-500/20"
          >
            Confirmer
          </button>
        </div>
      </div>
    </div>
  );
}
