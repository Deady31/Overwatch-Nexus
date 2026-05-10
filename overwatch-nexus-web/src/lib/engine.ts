import { Hero } from "./api";

const OW_COUNTERS: Record<string, string[]> = {
    // Tanks
    "D.Va": ["Zarya", "Symmetra", "Mei", "Echo", "Winston"],
    "Doomfist": ["Sombra", "Ana", "Orisa", "Pharah", "Cassidy"],
    "Orisa": ["Zarya", "Echo", "Pharah", "Hanzo", "Zenyatta"],
    "Ramattra": ["Ana", "Orisa", "Zenyatta", "Bastion", "Pharah"],
    "Reinhardt": ["Ramattra", "Pharah", "Bastion", "Mei", "Orisa"],
    "Roadhog": ["Ana", "Mauga", "Reaper", "Zenyatta", "Sombra"],
    "Sigma": ["Doomfist", "Winston", "Symmetra", "Sombra", "Lucio"],
    "Winston": ["Reaper", "Roadhog", "Bastion", "Torbjorn", "D.Va"],
    "Wrecking Ball": ["Sombra", "Mei", "Roadhog", "Ana", "Cassidy"],
    "Zarya": ["Reinhardt", "Pharah", "Widowmaker", "Winston", "Bastion"],
    "Mauga": ["Ana", "Sigma", "D.Va", "Zenyatta", "Reaper"],

    // DPS & Supports base counters
    "Pharah": ["Ashe", "Cassidy", "Widowmaker", "D.Va", "Ana"],
    "Widowmaker": ["Sombra", "Genji", "Winston", "Tracer", "Wrecking Ball"],
    "Genji": ["Winston", "Zarya", "Moira", "Symmetra", "Mei"],
    "Tracer": ["Cassidy", "Torbjorn", "Brigitte", "Winston", "Moira"],
    "Ana": ["Winston", "D.Va", "Tracer", "Doomfist", "Kiriko"],
};

export interface MatchupResult {
    hero: Hero;
    score: number;
    reasons: string[];
    confidence: number;
    winRate: number;
}

interface EngineOptions {
    roleFilter?: Hero["role"] | "all";
    mapName?: string;
    mapGamemodes?: string[];
    winRates?: Record<string, number>;
}

const MODE_PREFERENCES: Record<string, Hero["role"][]> = {
    escort: ["damage", "support", "tank"],
    hybrid: ["tank", "damage", "support"],
    push: ["tank", "support", "damage"],
    control: ["support", "damage", "tank"],
    flashpoint: ["tank", "support", "damage"],
    clash: ["tank", "damage", "support"],
};

const DEFAULT_WR = 50;

export function calculateCounters(
    allHeroes: Hero[],
    enemyCompKeys: string[],
    options: EngineOptions = {},
): { top: MatchupResult[]; bot: MatchupResult[]; mapPicks: MatchupResult[] } {
    const scores: Record<string, number> = {};
    const reasons: Record<string, string[]> = {};
    const roleFilter = options.roleFilter ?? "all";
    const winRates = options.winRates ?? {};
    const gamemodes = options.mapGamemodes ?? [];

    // Initialize
    allHeroes.forEach(h => {
        scores[h.name] = 0;
        reasons[h.name] = [];
    });

    // Score matchup
    enemyCompKeys.forEach(enemyName => {
        if (OW_COUNTERS[enemyName]) {
            OW_COUNTERS[enemyName].forEach(counterName => {
                if (scores[counterName] !== undefined) {
                    scores[counterName] += 5;
                    reasons[counterName].push(`Excellent contre ${enemyName}`);
                }
            });
        }

        Object.entries(OW_COUNTERS).forEach(([heroName, counters]) => {
            if (counters.includes(enemyName) && scores[heroName] !== undefined) {
                scores[heroName] -= 4;
                reasons[heroName].push(`Faible face à ${enemyName}`);
            }
        });
    });

    if (roleFilter !== "all") {
        allHeroes.forEach((hero) => {
            if (hero.role !== roleFilter) {
                scores[hero.name] -= 6;
                reasons[hero.name].push(`Hors filtre de rôle (${roleFilter})`);
            }
        });
    }

    if (gamemodes.length > 0) {
        gamemodes.forEach((modeRaw) => {
            const mode = modeRaw.toLowerCase();
            const preferred = MODE_PREFERENCES[mode];
            if (!preferred) return;
            allHeroes.forEach((hero) => {
                const bonusIndex = preferred.indexOf(hero.role);
                if (bonusIndex >= 0) {
                    const bonus = 3 - bonusIndex;
                    scores[hero.name] += bonus;
                    reasons[hero.name].push(`Bon profil ${modeRaw}`);
                }
            });
        });
    }

    allHeroes.forEach((hero) => {
        const wr = winRates[hero.name] ?? DEFAULT_WR;
        const wrDelta = Math.max(-6, Math.min(6, (wr - DEFAULT_WR) * 0.9));
        scores[hero.name] += wrDelta;
        reasons[hero.name].push(`Winrate ${wr.toFixed(1)}%`);
    });

    const ranked = allHeroes
        .map(hero => ({
            hero,
            score: scores[hero.name] || 0,
            reasons: Array.from(new Set(reasons[hero.name] || [])).slice(0, 4),
            confidence: Math.max(40, Math.min(99, 65 + Math.round(Math.abs(scores[hero.name] || 0) * 2))),
            winRate: winRates[hero.name] ?? DEFAULT_WR,
        }))
        .sort((a, b) => b.score - a.score);

    const mapPicks = [...ranked]
        .filter((result) => {
            if (roleFilter === "all") return true;
            return result.hero.role === roleFilter;
        })
        .slice(0, 3)
        .map((pick) => ({
            ...pick,
            reasons: options.mapName
                ? [`Potentiel élevé sur ${options.mapName}`, ...pick.reasons].slice(0, 4)
                : pick.reasons,
        }));

    return {
        top: ranked.slice(0, 5),
        bot: ranked.slice(-5).reverse(),
        mapPicks,
    };
}
