"use client";

import { motion } from "framer-motion";
import { Hero } from "@/lib/api";

interface HeroCardProps {
    hero: Hero;
    score?: number;
    reasons?: string[];
    isThrow?: boolean;
    confidence?: number;
    winRate?: number;
    compact?: boolean;
}

export default function HeroCard({
    hero,
    score,
    reasons,
    isThrow = false,
    confidence,
    winRate,
    compact = false,
}: HeroCardProps) {
    const glowClass = isThrow ? "box-glow-cyan" : "box-glow-purple";
    const textGlow = isThrow ? "text-glow-cyan text-[#06b6d4]" : "text-glow-purple text-[#A855F7]";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className={`bg-glass rounded-xl ${compact ? "p-3" : "p-4"} flex flex-col items-center gap-3 transition-all duration-300 ${glowClass}`}
        >
            <div className="relative w-full aspect-square rounded-lg overflow-hidden border-2 border-white/10">
                <img
                    src={hero.portrait}
                    alt={hero.name}
                    className="w-full h-full object-cover"
                />
            </div>

            <h3 className={`font-bold text-xl uppercase tracking-wider ${textGlow}`}>
                {hero.name}
            </h3>

            {score !== undefined && (
                <div className="text-sm font-mono text-white/70">Score: <span className="text-white font-bold">{score.toFixed(1)}</span></div>
            )}

            {winRate !== undefined && <div className="text-xs text-white/70">WR: <span className="font-bold text-white">{winRate.toFixed(1)}%</span></div>}

            {confidence !== undefined && <div className="text-xs text-white/70">Confiance: <span className="font-bold text-white">{confidence}%</span></div>}

            {reasons && reasons.length > 0 && (
                <ul className="text-xs text-white/50 text-center space-y-1 mt-2">
                    {reasons.slice(0, compact ? 2 : 3).map((r, i) => <li key={`${hero.key}-${i}`}>{r}</li>)}
                </ul>
            )}
        </motion.div>
    );
}
