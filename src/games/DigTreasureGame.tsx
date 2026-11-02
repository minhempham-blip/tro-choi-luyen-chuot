import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface Tile {
  id: number;
  dug: boolean;
  shaking: boolean;
  type: 'chest' | 'rock' | 'empty';
  collected: boolean;
}

export const DigTreasureGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [chestsCollected, setChestsCollected] = useState(0);
  const [startTime] = useState(Date.now());
  const lastClickRef = useRef<Record<number, number>>({});
  const finishedRef = useRef(false);

  const targetChests = level === 1 ? 3 : level === 2 ? 5 : 6;
  const totalTiles = 9;
  const dblClickThreshold = 650;

  useEffect(() => {
    finishedRef.current = false;
    const list: Tile[] = [];
    let placedChests = 0;
    let placedRocks = 0;

    for (let i = 0; i < totalTiles; i++) {
      let t: 'chest' | 'rock' | 'empty' = 'empty';
      if (placedChests < targetChests && (Math.random() < 0.6 || i >= totalTiles - (targetChests - placedChests))) {
        t = 'chest';
        placedChests++;
      } else if (placedRocks < 2) {
        t = 'rock';
        placedRocks++;
      }
      list.push({ id: i, dug: false, shaking: false, type: t, collected: false });
    }
    setTiles(list);
    setChestsCollected(0);
  }, [level, targetChests]);

  const triggerDig = (id: number) => {
    if (finishedRef.current) return;
    const target = tiles.find((t) => t.id === id);
    if (!target || target.dug) return;

    audioEngine.playWhack();
    setTiles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, dug: true, shaking: false } : t))
    );

    if (target.type === 'chest') {
      audioEngine.playSuccess();
      onSuccess();
      const newCount = chestsCollected + 1;
      setChestsCollected(newCount);
      onProgress?.(newCount, targetChests);

      if (newCount >= targetChests && !finishedRef.current) {
        finishedRef.current = true;
        const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const stars = Math.min(10, Math.max(6, 11 - Math.floor(timeTaken / 5)));
        const score = newCount * 180 + Math.max(0, 300 - timeTaken * 8);

        setTimeout(() => {
          onComplete({
            gameId: 12,
            score,
            stars,
            accuracy: 100,
            timeTakenSeconds: timeTaken,
            correctCount: newCount,
            mistakeCount: 0,
          });
        }, 500);
      }
    } else if (target.type === 'rock') {
      audioEngine.playError();
      onMistake();
    }
  };

  const handleClickTile = (id: number) => {
    const target = tiles.find((t) => t.id === id);
    if (!target || target.dug) return;

    const now = Date.now();
    const lastTime = lastClickRef.current[id] || 0;
    const diff = now - lastTime;
    lastClickRef.current[id] = now;

    if (diff > 40 && diff < dblClickThreshold) {
      triggerDig(id);
    } else {
      audioEngine.playPop();
      setTiles((prev) =>
        prev.map((t) => (t.id === id ? { ...t, shaking: true } : t))
      );
      setTimeout(() => {
        setTiles((prev) =>
          prev.map((t) => (t.id === id ? { ...t, shaking: false } : t))
        );
      }, 350);
    }
  };

  const nextChestTile = tiles.find((t) => !t.dug && t.type === 'chest');

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-amber-200 via-amber-100 to-amber-300 p-4 select-none flex flex-col items-center justify-between">
      {/* Top Banner Guide */}
      <div className="z-20 rounded-full bg-white/95 px-5 py-1 text-xs sm:text-sm font-bold text-amber-950 border border-amber-300 shadow-md">
        Nháy đúp chuột vào ụ đất để đào rương kho báu: {chestsCollected}/{targetChests}
      </div>

      {/* Island Beach Grid */}
      <div className="flex-1 flex items-center justify-center w-full max-w-lg">
        <div className="grid grid-cols-3 gap-4 sm:gap-6 items-center justify-items-center">
          {tiles.map((tile) => (
            <div
              key={tile.id}
              onClick={() => handleClickTile(tile.id)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                triggerDig(tile.id);
              }}
              className="relative flex flex-col items-center cursor-pointer p-1"
            >
              <motion.div
                animate={tile.shaking ? { rotate: [-8, 8, -8, 8, 0] } : {}}
                className={`relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-2xl border-4 shadow-md transition-all ${
                  tile.dug
                    ? 'border-amber-900/60 bg-stone-700'
                    : 'border-amber-700 bg-amber-600 hover:bg-amber-500'
                }`}
              >
                {!tile.dug ? (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">🏜️</span>
                    <span className="text-[10px] font-black text-amber-100">Ụ ĐẤT</span>
                  </div>
                ) : tile.type === 'chest' ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.4 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-3xl sm:text-4xl drop-shadow-md">👑</span>
                    <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[9px] font-bold text-amber-950">
                      Rương Vàng!
                    </span>
                  </motion.div>
                ) : tile.type === 'rock' ? (
                  <div className="flex flex-col items-center">
                    <span className="text-3xl">🪨</span>
                    <span className="text-[9px] font-bold text-slate-300">Đá tảng</span>
                  </div>
                ) : (
                  <span className="text-xs text-amber-200">Đất trống</span>
                )}
              </motion.div>

              {tile.shaking && (
                <span className="absolute -bottom-4 rounded-full bg-amber-300 px-2 text-[9px] font-black text-amber-950 shadow-xs animate-bounce whitespace-nowrap">
                  Bấm nhanh 2 lần!
                </span>
              )}

              {currentHintTier === 1 && nextChestTile?.id === tile.id && (
                <div className="pointer-events-none absolute -inset-2 rounded-2xl border-4 border-dashed border-rose-500 animate-spin" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
