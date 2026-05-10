export interface Hero {
    key: string;
    name: string;
    portrait: string;
    role: "tank" | "damage" | "support";
}

export interface MapData {
    name: string;
    screenshot: string;
    gamemodes: string[];
    location: string;
    country_code: string;
}

const OVERFAST_API_URL = "https://overfast-api.tekrop.fr";
const REQUEST_TIMEOUT_MS = 9000;

let heroesCache: Hero[] | null = null;
let mapsCache: MapData[] | null = null;
let winRatesCache: Record<string, number> | null = null;

async function fetchWithTimeout(url: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        return await fetch(url, { signal: controller.signal, cache: "force-cache" });
    } finally {
        clearTimeout(timeout);
    }
}

export async function getHeroes(): Promise<Hero[]> {
    if (heroesCache) return heroesCache;
    try {
        const res = await fetchWithTimeout(`${OVERFAST_API_URL}/heroes`);
        if (!res.ok) throw new Error("Failed to fetch heroes");
        const data = await res.json() as Hero[];
        heroesCache = data;
        return data;
    } catch (error) {
        console.error("Error fetching heroes:", error);
        return [];
    }
}

export async function getMaps(): Promise<MapData[]> {
    if (mapsCache) return mapsCache;
    try {
        const res = await fetchWithTimeout(`${OVERFAST_API_URL}/maps`);
        if (!res.ok) throw new Error("Failed to fetch maps");
        const data = await res.json() as MapData[];
        mapsCache = data;
        return data;
    } catch (error) {
        console.error("Error fetching maps:", error);
        return [];
    }
}

export async function getWinRates(): Promise<Record<string, number>> {
    if (winRatesCache) return winRatesCache;
    try {
        const res = await fetchWithTimeout("/data/live_winrates.json");
        if (!res.ok) throw new Error("Failed to fetch local win rates");
        const data = await res.json() as Record<string, number>;
        winRatesCache = data;
        return data;
    } catch (error) {
        console.error("Error fetching win rates:", error);
        return {};
    }
}
