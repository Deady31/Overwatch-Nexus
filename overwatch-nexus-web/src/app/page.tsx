"use client";

import { useEffect, useMemo, useState } from "react";
import { getHeroes, getMaps, getWinRates, Hero, MapData } from "@/lib/api";
import { calculateCounters, MatchupResult } from "@/lib/engine";
import { AlertCircle, Crosshair, Map as MapIcon, ShieldAlert } from "lucide-react";
import HeroCard from "@/components/HeroCard";
import clsx from "clsx";

export default function Home() {
  const [heroes, setHeroes] = useState<Hero[]>([]);
  const [maps, setMaps] = useState<MapData[]>([]);
  const [winRates, setWinRates] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Settings
  const [format, setFormat] = useState<"5v5" | "6v6">("5v5");
  const [selectedMap, setSelectedMap] = useState<string>("");
  const [roleFilter, setRoleFilter] = useState<"all" | Hero["role"]>("all");
  const [enemyComp, setEnemyComp] = useState<string[]>(Array(5).fill(""));
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Results
  const [results, setResults] = useState<{ top: MatchupResult[]; bot: MatchupResult[]; mapPicks: MatchupResult[] } | null>(null);
  const [selectedResult, setSelectedResult] = useState<MatchupResult | null>(null);

  useEffect(() => {
    Promise.all([getHeroes(), getMaps(), getWinRates()])
      .then(([hData, mData, wrData]) => {
        setHeroes(hData);
        setMaps(mData);
        setWinRates(wrData);

        if (mData.length > 0) setSelectedMap(mData[0].name);
        if (hData.length >= 5) {
          setEnemyComp([hData[0].name, hData[1].name, hData[2].name, hData[3].name, hData[4].name]);
        }
        if (hData.length === 0 || mData.length === 0) {
          setLoadError("Impossible de charger les données officielles. Vérifie ta connexion et relance.");
        }
      })
      .catch(() => {
        setLoadError("Erreur réseau pendant le chargement des données.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const mapInfo = useMemo(() => maps.find((m) => m.name === selectedMap), [maps, selectedMap]);
  const roleLabel = useMemo(
    () => ({
      all: "Tous les rôles",
      tank: "Tank",
      damage: "Damage",
      support: "Support",
    }),
    [],
  );

  const availableHeroes = useMemo(() => {
    if (roleFilter === "all") return heroes;
    return heroes.filter((hero) => hero.role === roleFilter);
  }, [heroes, roleFilter]);

  const handleAnalyze = () => {
    const validEnemies = enemyComp.filter(Boolean);
    setHasAnalyzed(true);
    if (validEnemies.length === 0) return;

    const engineRes = calculateCounters(heroes, validEnemies, {
      roleFilter,
      mapName: selectedMap,
      mapGamemodes: mapInfo?.gamemodes ?? [],
      winRates,
    });
    setResults(engineRes);
    setSelectedResult(engineRes.top[0] ?? null);
  };

  const updateEnemySlot = (idx: number, value: string) => {
    const next = [...enemyComp];
    next[idx] = value;
    setEnemyComp(next);
  };

  const selectedWinRate = selectedResult ? (winRates[selectedResult.hero.name] ?? selectedResult.winRate) : null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#A855F7]" />
        <p className="text-white/70 tracking-wide">Synchronisation des données Overwatch...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="bg-glass rounded-2xl p-8 border border-red-400/30 max-w-2xl mx-auto mt-12 text-center space-y-3">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
        <h2 className="text-2xl font-bold">Données indisponibles</h2>
        <p className="text-white/70">{loadError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-24">
      <header className="text-center space-y-4 pt-10">
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight">
          <span className="text-[#f99e1a]">O</span>VERWATCH{" "}
          <span className="text-[#06b6d4]">NEXUS</span>
        </h1>
        <p className="text-white/60 text-sm sm:text-lg italic tracking-[0.25em] uppercase">
          Agent Stratégique S16 • [KingOfGuezzz#2459]
        </p>
      </header>

      <section>
        <h2 className="text-center text-3xl font-bold mb-8 bg-gradient-to-r from-[#06b6d4] to-[#A855F7] text-transparent bg-clip-text">
          1. CONFIGURATION DU MATCH
        </h2>

        <div className="bg-glass rounded-2xl p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row gap-8">
          <div className="w-full lg:w-1/3 space-y-6">
            <h3 className="flex items-center gap-2 text-xl font-bold border-b border-white/10 pb-4">
              <ShieldAlert className="w-5 h-5 text-[#f99e1a]" /> Paramètres
            </h3>

            <div className="space-y-3">
              <label className="text-sm text-white/70 uppercase tracking-widest font-bold">Format</label>
              <div className="flex gap-4">
                {["5v5", "6v6"].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => {
                      const count = fmt === "5v5" ? 5 : 6;
                      setFormat(fmt as "5v5" | "6v6");
                      setEnemyComp(Array(count).fill(""));
                    }}
                    className={clsx(
                      "flex-1 py-3 rounded-lg border font-bold transition-all",
                      format === fmt
                        ? "bg-[#A855F7]/20 border-[#A855F7] text-white box-glow-purple"
                        : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10",
                    )}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-white/70 uppercase tracking-widest font-bold">Rôle préféré</label>
              <select
                className="w-full bg-[#151525] border border-white/20 rounded-lg p-3 text-white outline-none focus:border-[#A855F7]"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as "all" | Hero["role"])}
              >
                <option value="all">{roleLabel.all}</option>
                <option value="tank">{roleLabel.tank}</option>
                <option value="damage">{roleLabel.damage}</option>
                <option value="support">{roleLabel.support}</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm text-white/70 uppercase tracking-widest font-bold flex items-center gap-2">
                <MapIcon className="w-4 h-4" /> Sélection de Map
              </label>
              <select
                className="w-full bg-[#151525] border border-white/20 rounded-lg p-3 text-white outline-none focus:border-[#06b6d4] focus:ring-1 focus:ring-[#06b6d4] transition-all"
                value={selectedMap}
                onChange={(e) => setSelectedMap(e.target.value)}
              >
                {maps.map((m) => (
                  <option key={m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>

              {mapInfo && (
                <div className="mt-4 rounded-xl overflow-hidden border border-[#A855F7]/30 h-32 relative">
                  <img src={mapInfo.screenshot} alt={mapInfo.name} className="w-full h-full object-cover filter brightness-75" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="font-bold text-xl tracking-widest uppercase">{mapInfo.name}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-2/3 space-y-6">
            <h3 className="flex items-center gap-2 text-xl font-bold border-b border-white/10 pb-4">
              <Crosshair className="w-5 h-5 text-[#EF4444]" /> Composition Ennemie
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {enemyComp.map((heroName, idx) => {
                const hData = heroes.find((h) => h.name === heroName);
                return (
                  <div key={idx} className="space-y-2">
                    <label className="text-xs text-white/50 uppercase font-bold">Slot {idx + 1}</label>
                    <div className="flex flex-col gap-2">
                      <select
                        className="w-full bg-[#151525] border border-white/10 rounded-lg p-3 text-white outline-none focus:border-[#A855F7] transition-all"
                        value={heroName}
                        onChange={(e) => updateEnemySlot(idx, e.target.value)}
                      >
                        <option value="">-- Héros --</option>
                        {availableHeroes.map((h) => (
                          <option key={h.key} value={h.name}>
                            {h.name}
                          </option>
                        ))}
                      </select>
                      {hData && (
                        <img src={hData.portrait} alt={hData.name} className="w-full h-24 object-cover rounded-lg border border-white/10" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-10 max-w-2xl mx-auto">
          <button
            onClick={handleAnalyze}
            className="w-full py-4 px-8 rounded-xl bg-gradient-to-r from-[#A855F7] to-[#06b6d4] text-white font-black text-lg sm:text-xl uppercase tracking-widest hover:scale-[1.02] transition-all duration-300 box-glow-cyan"
          >
            ⚡ Obtenir le Counter Parfait ⚡
          </button>
        </div>
      </section>

      <section className={clsx("transition-all duration-700 ease-out", results ? "opacity-100 translate-y-0 block" : "opacity-0 translate-y-10 hidden")}>
        <hr className="border-white/10 my-16" />
        <h2 className="text-center text-3xl font-bold mb-8 bg-gradient-to-r from-[#06b6d4] to-[#A855F7] text-transparent bg-clip-text">
          2. RÉSULTATS TACTIQUES
        </h2>

        {results && (
          <div className="space-y-12">
            <div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <span className="text-3xl">✨</span> PICKS FORTS (S TIER)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {results.top.map((res) => (
                  <button key={res.hero.key} onClick={() => setSelectedResult(res)} className="text-left">
                    <HeroCard hero={res.hero} score={res.score} reasons={res.reasons} confidence={res.confidence} winRate={res.winRate} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-black mb-6 flex items-center gap-3">
                <span className="text-3xl">☠️</span> À ÉVITER (THROW)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {results.bot.map((res) => (
                  <HeroCard key={res.hero.key} hero={res.hero} score={res.score} reasons={res.reasons} confidence={res.confidence} winRate={res.winRate} isThrow />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>

      {results && (
        <section className="space-y-8">
          <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-[#06b6d4] to-[#A855F7] text-transparent bg-clip-text">
            3. RECOMMANDATIONS PAR MAP
          </h2>
          <div className="bg-glass rounded-2xl p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
            {results.mapPicks.map((pick) => (
              <HeroCard key={`map-${pick.hero.key}`} hero={pick.hero} score={pick.score} reasons={pick.reasons} confidence={pick.confidence} winRate={pick.winRate} compact />
            ))}
          </div>
        </section>
      )}

      {selectedResult && (
        <section className="space-y-6">
          <h2 className="text-center text-3xl font-bold bg-gradient-to-r from-[#06b6d4] to-[#A855F7] text-transparent bg-clip-text">
            4. FICHE DÉTAILLÉE
          </h2>
          <div className="bg-glass rounded-2xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <img src={selectedResult.hero.portrait} alt={selectedResult.hero.name} className="w-full rounded-xl border border-white/10 object-cover aspect-square" />
            </div>
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-3xl font-black">{selectedResult.hero.name}</h3>
              <p className="text-white/70">Rôle: <span className="uppercase font-bold">{selectedResult.hero.role}</span></p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-white/50 text-xs uppercase tracking-widest">Score tactique</p>
                  <p className="text-2xl font-black">{selectedResult.score.toFixed(1)}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-white/50 text-xs uppercase tracking-widest">Confiance</p>
                  <p className="text-2xl font-black">{selectedResult.confidence}%</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-white/50 text-xs uppercase tracking-widest">Winrate global</p>
                  <p className="text-2xl font-black">{(selectedWinRate ?? 50).toFixed(1)}%</p>
                </div>
              </div>
              <ul className="text-white/80 space-y-2">
                {selectedResult.reasons.map((reason) => (
                  <li key={reason} className="border border-white/10 rounded-lg px-3 py-2 bg-black/20">
                    {reason}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      )}

      {hasAnalyzed && !results && (
        <div className="text-center text-white/60">
          Aucune composition valide sélectionnée. Choisis au moins un héros ennemi.
        </div>
      )}
    </div>
  );
}
