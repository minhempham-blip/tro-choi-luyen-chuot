import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface HoleState {
  id: number;
  type: 'mole' | 'bunny' | null;
  hit: boolean;
}

export const WhackMoleGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const [holes, setHoles] = useState<HoleState[]>([
    { id: 0, type: null, hit: false },
    { id: 1, type: null, hit: false },
    { id: 2, type: null, hit: false },
    { id: 3, type: null, hit: false },
    { id: 4, type: null, hit: false },
    { id: 5, type: null, hit: false },
  ]);

  const [whackedCount, setWhackedCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const timerRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  const targetMoles = level === 1 ? 6 : level === 2 ? 8 : 12;
  const popDuration = easyMode ? 2500 : level === 1 ? 2200 : level === 2 ? 1700 : 1300;

  const spawnNext = () => {
    if (finishedRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);

    // Pick random hole
    const randomHole = Math.floor(Math.random() * 6);
    const isBunny = Math.random() < 0.22;
    const creatureType = isBunny ? 'bunny' : 'mole';

    setHoles((prev) =>
      prev.map((h) => (h.id === randomHole ? { ...h, type: creatureType, hit: false } : { ...h, type: null }))
    );

    // Schedule hole retreat
    timerRef.current = window.setTimeout(() => {
      setHoles((prev) => prev.map((h) => (h.id === randomHole ? { ...h, type: null } : h)));
      timerRef.current = window.setTimeout(spawnNext, 350);
    }, popDuration);
  };

  useEffect(() => {
    finishedRef.current = false;
    timerRef.current = window.setTimeout(spawnNext, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [level, popDuration]);

  const handleWhack = (holeId: number) => {
    const currentHole = holes.find((h) => h.id === holeId);
    if (!currentHole || !currentHole.type || currentHole.hit || finishedRef.current) return;

    if (currentHole.type === 'bunny') {
      // Mistake!
      audioEngine.playError();
      onMistake();
      setMistakes((m) => m + 1);
      return;
    }

    // Whacked a mole!
    audioEngine.playWhack();
    onSuccess();

    if (timerRef.current) clearTimeout(timerRef.current);

    setHoles((prev) =>
      prev.map((h) => (h.id === holeId ? { ...h, hit: true, type: null } : h))
    );

    const newCount = whackedCount + 1;
    setWhackedCount(newCount);
    onProgress?.(newCount, targetMoles);

    if (newCount >= targetMoles) {
      finishedRef.current = true;
      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const accuracy = Math.max(50, Math.round((newCount / (newCount + mistakes)) * 100));
      const stars = Math.min(10, Math.max(5, 11 - Math.floor(mistakes / 2)));
      const score = newCount * 120 + Math.max(0, 300 - timeTaken * 8);

      setTimeout(() => {
        onComplete({
          gameId: 6,
          score,
          stars,
          accuracy,
          timeTakenSeconds: timeTaken,
          correctCount: newCount,
          mistakeCount: mistakes,
        });
      }, 400);
    } else {
      // Spawn next mole after small celebration pause
      timerRef.current = window.setTimeout(spawnNext, 350);
    }
  };

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-amber-200 via-amber-100 to-emerald-200 p-4 select-none">
      {/* Top Banner Guide */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 rounded-full bg-white/95 px-5 py-1 text-xs sm:text-sm font-bold text-amber-950 border border-amber-300 shadow-md">
        Nháy chuột trái vào Chuột Chũi: {whackedCount}/{targetMoles} (Đừng bấm thỏ trắng nhé!)
      </div>

      {/* Holes Grid: 3 cols x 2 rows */}
      <div className="grid h-full w-full grid-cols-3 grid-rows-2 items-center justify-items-center gap-4 pt-10 pb-4">
        {holes.map((h) => (
          <div key={h.id} className="relative flex flex-col items-center justify-end">
            {/* Mound Hole SVG */}
            <div className="relative flex h-28 w-28 sm:h-32 sm:w-32 items-end justify-center">
              {/* Hole ground cavity */}
              <div className="absolute bottom-2 h-14 w-24 sm:w-28 rounded-[50%] bg-stone-800 shadow-inner border-4 border-amber-900/60" />

              {/* Emerging Creature */}
              {h.type && (
                <motion.div
                  initial={{ y: 35, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 35, opacity: 0 }}
                  onPointerDown={() => handleWhack(h.id)}
                  className="z-10 cursor-pointer drop-shadow-lg p-2 min-w-[70px] min-h-[70px] flex flex-col items-center justify-center"
                >
                  {h.type === 'mole' ? (
                    <div className="flex flex-col items-center">
                      <span className="text-5xl sm:text-6xl animate-bounce-gentle">🦔</span>
                      <span className="rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-black text-white shadow">
                        Bấm tớ nè!
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <span className="text-5xl sm:text-6xl">🐰</span>
                      <span className="rounded-full bg-pink-500 px-2 py-0.5 text-[10px] font-black text-white shadow">
                        Thỏ con hiền lành
                      </span>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Front earth rim */}
              <div className="pointer-events-none absolute bottom-0 h-6 w-26 sm:w-30 rounded-[50%] bg-amber-800/80" />
            </div>

            {/* Hint circle if active */}
            {currentHintTier === 1 && h.type === 'mole' && (
              <div className="pointer-events-none absolute top-4 h-16 w-16 rounded-full border-4 border-dashed border-rose-500 animate-spin" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
