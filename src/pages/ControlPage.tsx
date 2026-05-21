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
import { clearState } from "@/lib/storage";

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
    <div className="min-h-dvh xl:h-dvh w-full flex flex-col bg-background text-foreground transition-colors duration-300 overflow-y-auto xl:overflow-hidden">
      {/* Bandeaux couleur équipes */}
      <div className="flex h-1 w-full shrink-0">
        <div className="h-full" style={{ width: "50%", backgroundColor: state.home.color }} />
        <div className="h-full" style={{ width: "50%", backgroundColor: state.away.color }} />
      </div>

      {/* En-tête pleine largeur */}
      <header className="shrink-0 border-b border-border bg-card/80 backdrop-blur-md z-30">
        <div className="w-full px-4 sm:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              className="w-11 h-11 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0 hover:ring-2 hover:ring-primary/30 transition-all"
              onClick={() => setShowOrgLogoModal(true)}
              title="Modifier le logo de l'organisation"
            >
              {state.organizationLogoUrl ? (
                <img src={state.organizationLogoUrl} alt="Logo" className="w-full h-full object-contain p-0.5" />
              ) : (
                <span className="text-[9px] font-bold text-muted-foreground">ORG</span>
              )}
            </button>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                Table de marque FIBA
              </p>
              <h1 className="text-lg sm:text-xl font-bold truncate">
                {state.home.name} <span className="text-muted-foreground font-normal">vs</span> {state.away.name}
              </h1>
            </div>
          </div>

          {/* Score récap central */}
          <div className="flex items-center gap-3 sm:gap-5 font-mono font-black tabular-nums text-3xl sm:text-4xl shrink-0">
            <span style={{ color: state.home.color }}>{state.home.score.toString().padStart(2, "0")}</span>
            <span className="text-muted-foreground text-2xl font-normal">—</span>
            <span style={{ color: state.away.color }}>{state.away.score.toString().padStart(2, "0")}</span>
            {state.isHalftime && (
              <span className="text-xs font-bold uppercase tracking-wider text-[--clock-amber] bg-[--clock-amber]/15 px-2 py-1 rounded-md ml-1">
                Mi-temps
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              className="font-semibold"
              onClick={() => window.open("/display", "_blank")}
            >
              📺 Complet
            </Button>
            <Button
              size="sm"
              className="font-semibold bg-indigo-600 hover:bg-indigo-500 text-white"
              onClick={() => window.open("/display?mode=compact", "_blank")}
            >
              📺 Compact
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="font-semibold"
              onClick={() => setShowResetModal(true)}
            >
              ↺ Reset
            </Button>
          </div>
        </div>
      </header>

      {/* Corps — grille plein écran */}
      <main className="flex-1 xl:min-h-0 w-full grid xl:grid-rows-[auto_1fr_auto] gap-3 p-3 sm:p-4">
        <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-3 min-h-0">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-h-0">
          <TeamControl team={state.home} side="home" dispatch={dispatch} />
          <TeamControl team={state.away} side="away" dispatch={dispatch} />
        </div>

        <footer className="shrink-0 bg-card border border-border rounded-xl px-4 sm:px-6 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Possession</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_POSSESSION" })}
                className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-muted hover:bg-muted/70 transition-colors border border-border"
              >
                <span
                  className={
                    state.possessionArrow === "home"
                      ? "text-[--clock-amber] text-lg font-bold"
                      : "text-muted-foreground text-lg"
                  }
                >
                  ◀ {state.home.shortName}
                </span>
                <span className="text-muted-foreground">|</span>
                <span
                  className={
                    state.possessionArrow === "away"
                      ? "text-[--clock-amber] text-lg font-bold"
                      : "text-muted-foreground text-lg"
                  }
                >
                  {state.away.shortName} ▶
                </span>
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => dispatch({ type: "SET_HALFTIME", value: !state.isHalftime })}
                className={`px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                  state.isHalftime
                    ? "bg-[--clock-amber] text-black"
                    : "bg-muted hover:bg-muted/70 text-foreground border border-border"
                }`}
              >
                {state.isHalftime ? "▶ Reprise" : "⏸ Mi-Temps"}
              </button>
              <button
                type="button"
                onClick={() => setShowFinishModal(true)}
                className="px-5 py-2.5 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold text-sm transition-colors"
              >
                🏁 Fin du Match
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground border-t border-border pt-2">
            <span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">Space</kbd> Start/Stop
            </span>
            <span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">H</kbd>+
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">1-3</kbd> Home
            </span>
            <span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">A</kbd>+
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">1-3</kbd> Away
            </span>
            <span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">R</kbd> 24s
            </span>
            <span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">T</kbd> 14s
            </span>
            <span>
              <kbd className="bg-muted px-1.5 py-0.5 rounded font-mono text-[10px]">B</kbd> Buzzer
            </span>
          </div>
        </footer>
      </main>

      {/* Finished banner */}
      {state.isFinished && !dismissFinishedModal && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 backdrop-blur-md p-4">
          <div className="bg-card border border-border rounded-2xl p-8 md:p-10 text-center max-w-md w-full shadow-2xl">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-foreground mb-6">Match Terminé</h2>
            <div className="flex items-center justify-center gap-6 text-5xl font-mono font-black mb-6">
              <span className="font-extrabold" style={{ color: state.home.color }}>{state.home.score}</span>
              <span className="text-muted-foreground text-3xl">—</span>
              <span className="font-extrabold" style={{ color: state.away.color }}>{state.away.score}</span>
            </div>
            <p className="text-lg text-muted-foreground mb-8">
              {state.home.name} vs {state.away.name}
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  clearState();
                  dispatch({ type: "RESET_GAME" });
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 hover:from-green-500 hover:to-emerald-400 text-white font-bold text-base transition-all duration-200 shadow-lg shadow-green-500/20 active:scale-95"
              >
                🏆 Commencer un Nouveau Match
              </button>
              <button
                onClick={() => setDismissFinishedModal(true)}
                className="w-full py-2.5 rounded-xl bg-muted hover:bg-muted/70 text-foreground font-semibold text-sm transition-all duration-200"
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
            clearState();
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
      <div className="bg-popover text-popover-foreground border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-muted hover:bg-muted/70 text-foreground font-semibold text-sm transition-all duration-200"
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
