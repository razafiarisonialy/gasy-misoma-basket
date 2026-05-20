import { useState } from "react";
import type { GameAction, Team, TeamSide } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import PlayerRow from "./PlayerRow";

interface TeamControlProps {
  team: Team;
  side: TeamSide;
  dispatch: (action: GameAction) => void;
}

const PRESET_COLORS = [
  "#EF4444", "#22C55E", "#3B82F6", "#F97316",
  "#A855F7", "#EAB308", "#EC4899", "#06B6D4"
];

export default function TeamControl({ team, side, dispatch }: TeamControlProps) {
  return (
    <div className="bg-[--bg-surface] text-[--text-primary] rounded-xl border border-[--border-subtle] p-4 flex flex-col gap-4 shadow-md">
      <TeamHeader team={team} side={side} dispatch={dispatch} />
      <ScorePanel team={team} side={side} dispatch={dispatch} />
      <FoulsAndTimeouts team={team} side={side} dispatch={dispatch} />
      <PlayerList team={team} side={side} dispatch={dispatch} />
    </div>
  );
}

function TeamHeader({
  team,
  side,
  dispatch,
}: {
  team: Team;
  side: TeamSide;
  dispatch: (action: GameAction) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [shortName, setShortName] = useState(team.shortName);
  const [color, setColor] = useState(team.color);
  const [logoUrl, setLogoUrl] = useState(team.logoUrl || "");

  const handleSave = () => {
    dispatch({ type: "UPDATE_TEAM", side, name, shortName, color, logoUrl });
    setEditing(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex items-center justify-between border-b border-[--border-subtle] pb-3">
      <div 
        className="flex items-center gap-3 cursor-pointer group"
        onClick={() => setEditing(true)}
        title="Modifier l'équipe (nom, couleur, logo)"
      >
        <div className="relative w-11 h-11 rounded-full border border-[--border-default] bg-zinc-950/20 flex items-center justify-center overflow-hidden transition-all duration-300 group-hover:border-primary/50 shadow-inner shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt={team.shortName} className="w-full h-full object-contain" />
          ) : (
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: team.color }} />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-200">
            <span className="text-[8px] text-white font-bold uppercase tracking-wider">Éditer</span>
          </div>
        </div>
        <div>
          <h2
            className="text-base font-bold uppercase tracking-wide transition-colors duration-200"
            style={{ color: team.color }}
          >
            {team.name}
          </h2>
          <span className="text-[10px] text-[--text-secondary] uppercase tracking-widest font-semibold">{team.shortName || "ÉQUIPE"}</span>
        </div>
      </div>
      
      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'équipe</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nom
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="shortName" className="text-right">
                Abréviation
              </Label>
              <Input
                id="shortName"
                value={shortName}
                onChange={(e) => setShortName(e.target.value.toUpperCase().slice(0, 3))}
                className="col-span-3"
                maxLength={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Couleur Custom
              </Label>
              <Input
                id="color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="col-span-3 w-full h-10 p-1 cursor-pointer"
              />
            </div>
            
            {/* 8 quick preset buttons */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Presets</Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className="w-6 h-6 rounded-full border border-zinc-300 dark:border-zinc-700 transition-all hover:scale-110 active:scale-95 shadow-sm cursor-pointer"
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logoFile" className="text-right">
                Fichier Logo
              </Label>
              <div className="col-span-3 flex flex-col gap-2">
                <Input
                  id="logoFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <span className="text-[10px] text-muted-foreground">
                  Sélectionnez un fichier image local.
                </span>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="logoUrl" className="text-right">
                URL Logo
              </Label>
              <Input
                id="logoUrl"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="col-span-3"
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditing(false)}>Annuler</Button>
            <Button onClick={handleSave}>Enregistrer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ScorePanel({
  team,
  side,
  dispatch,
}: {
  team: Team;
  side: TeamSide;
  dispatch: (action: GameAction) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-2 border-b border-[--border-subtle] pb-4">
      {/* Giant Score Display V2 */}
      <span className="font-mono text-8xl font-black text-[--text-primary] tracking-tighter select-none tabular-nums">
        {team.score.toString().padStart(2, "0")}
      </span>

      {/* Button Controls */}
      <div className="flex flex-col gap-2.5 w-full">
        {/* Primary increment buttons (+1, +2, +3) */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {[1, 2, 3].map((pts) => (
            <button
              key={pts}
              onClick={() => dispatch({ type: "ADD_SCORE", side, points: pts })}
              className="h-14 rounded-xl text-white text-lg font-bold transition-all duration-150 active:scale-95 shadow-md shadow-black/10 flex items-center justify-center cursor-pointer"
              style={{ backgroundColor: team.color }}
            >
              +{pts}
            </button>
          ))}
        </div>

        {/* Subtractive action buttons (-1, -2, -3) */}
        <div className="grid grid-cols-3 gap-2 w-full">
          {[-1, -2, -3].map((pts) => (
            <button
              key={pts}
              onClick={() => dispatch({ type: "ADD_SCORE", side, points: pts })}
              className="h-10 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-red-500/10 hover:border-red-500/30 text-zinc-400 hover:text-red-400 text-xs font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center cursor-pointer"
            >
              {pts}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FoulsAndTimeouts({
  team,
  side,
  dispatch,
}: {
  team: Team;
  side: TeamSide;
  dispatch: (action: GameAction) => void;
}) {
  const inBonus = team.teamFouls >= 4;

  return (
    <div className="grid grid-cols-2 gap-4 py-2 border-b border-[--border-subtle] pb-4">
      {/* Team Fouls Control */}
      <div className="flex flex-col gap-1 bg-zinc-950/5 dark:bg-zinc-950/20 p-2.5 rounded-xl border border-[--border-subtle]">
        <span className="text-[10px] text-[--text-secondary] font-bold uppercase tracking-wider">Fautes Équipe</span>
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => dispatch({ type: "ADD_TEAM_FOUL", side, delta: -1 })}
              className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-[--border-subtle] text-zinc-300 font-bold text-lg active:scale-90 flex items-center justify-center cursor-pointer"
            >
              −
            </button>
            <span className={`font-mono text-2xl font-black px-2 tabular-nums ${inBonus ? "text-[--out-danger] animate-pulse" : "text-[--text-primary]"}`}>
              {team.teamFouls}
            </span>
            <button
              onClick={() => dispatch({ type: "ADD_TEAM_FOUL", side, delta: 1 })}
              className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-[--border-subtle] text-zinc-300 font-bold text-lg active:scale-90 flex items-center justify-center cursor-pointer"
            >
              +
            </button>
          </div>
          {inBonus && (
            <span className="text-[8px] font-black text-[--out-danger] bg-[--out-bg] border border-[--out-danger]/20 px-2 py-0.5 rounded uppercase font-sans animate-bounce tracking-wide shrink-0">
              BONUS
            </span>
          )}
        </div>
      </div>

      {/* Timeouts Control */}
      <div className="flex flex-col gap-1 bg-zinc-950/5 dark:bg-zinc-950/20 p-2.5 rounded-xl border border-[--border-subtle]">
        <span className="text-[10px] text-[--text-secondary] font-bold uppercase tracking-wider">Timeouts (TM)</span>
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={() => dispatch({ type: "RESTORE_TIMEOUT", side })}
            className="w-9 h-9 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-[--border-subtle] text-zinc-300 font-bold text-lg active:scale-90 flex items-center justify-center cursor-pointer"
          >
            +
          </button>
          <span className="font-mono text-2xl font-black px-2 text-[--text-primary] tabular-nums">
            {team.timeoutsLeft}
          </span>
          <button
            onClick={() => dispatch({ type: "USE_TIMEOUT", side })}
            className="w-9 h-9 rounded-lg bg-amber-600 hover:bg-amber-500 border border-amber-600/10 text-white font-bold text-lg active:scale-90 flex items-center justify-center cursor-pointer"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}

function PlayerList({
  team,
  side,
  dispatch,
}: {
  team: Team;
  side: TeamSide;
  dispatch: (action: GameAction) => void;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [newName, setNewName] = useState("");

  const handleAdd = () => {
    if (!newNumber.trim()) return;
    dispatch({
      type: "ADD_PLAYER",
      side,
      player: {
        id: crypto.randomUUID(),
        number: newNumber.trim(),
        name: newName.trim() || `Joueur ${newNumber.trim()}`,
        points: 0,
        fouls: 0,
        onCourt: team.players.filter((p) => p.onCourt).length < 5,
      },
    });
    setNewNumber("");
    setNewName("");
    setShowAdd(false);
  };

  const onCourt = team.players.filter((p) => p.onCourt);
  const bench = team.players.filter((p) => !p.onCourt);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[--text-secondary] uppercase tracking-wider font-bold">
          Roster ({team.players.length}) — Terrain: {onCourt.length}/5
        </span>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-xs bg-zinc-800 hover:bg-zinc-700/80 border border-[--border-subtle] text-[--text-primary] px-2 py-1 rounded transition-colors cursor-pointer font-semibold"
        >
          + Ajouter
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-3 bg-zinc-950/10 dark:bg-zinc-950/20 p-2 rounded-lg border border-[--border-subtle]">
          <input
            value={newNumber}
            onChange={(e) => setNewNumber(e.target.value)}
            className="w-16 bg-zinc-900 border border-[--border-default] text-[--text-primary] px-2 py-1 rounded text-sm font-mono font-bold text-center"
            placeholder="N°"
            maxLength={2}
          />
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-zinc-900 border border-[--border-default] text-[--text-primary] px-2 py-1 rounded text-sm uppercase font-semibold"
            placeholder="Nom du joueur"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm transition-colors cursor-pointer font-bold"
          >
            OK
          </button>
        </div>
      )}

      <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
        {onCourt.map((p) => (
          <PlayerRow key={p.id} player={p} side={side} dispatch={dispatch} />
        ))}
        {bench.length > 0 && (
          <>
            <div className="text-[9px] text-[--text-secondary] uppercase tracking-widest font-bold mt-3 mb-1 border-t border-[--border-subtle] pt-2">
              Banc
            </div>
            {bench.map((p) => (
              <PlayerRow key={p.id} player={p} side={side} dispatch={dispatch} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
