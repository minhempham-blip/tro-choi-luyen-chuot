import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface Firefly {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  caught: boolean;
  captureProgress: number; // 0 to 100
}

export const FirefliesGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lanternPosRef = useRef({ x: 50, y: 50 });
  const [lanternDisplay, setLanternDisplay] = useState({ x: 50, y: 50 });
  const [fireflies, setFireflies] = useState<Firefly[]>([]);
  const [caughtCount, setCaughtCount] = useState(0);
  const [startTime] = useState(Date.now());
  const finishedRef = useRef(false);

  const totalCount = level === 1 ? 4 : level === 2 ? 6 : 8;
  const lanternRadius = easyMode ? 65 : level === 1 ? 55 : level === 2 ? 46 : 38;

  // Initialize fireflies
  useEffect(() => {
    const list: Firefly[] = [];
    for (let i = 0; i < totalCount; i++) {
      list.push({
        id: i,
        x: 18 + Math.random() * 64,
        y: 20 + Math.random() * 60,
        vx: (Math.random() - 0.5) * (level === 1 ? 0.35 : 0.6),
        vy: (Math.random() - 0.5) * (level === 1 ? 0.35 : 0.6),
        caught: false,
        captureProgress: 0,
      });
    }
    setFireflies(list);
    setCaughtCount(0);
    finishedRef.current = false;
  }, [level, totalCount]);

  // Animation loop for gentle floating of fireflies and capture checking
  useEffect(() => {
    let animId: number;
    let lastTick = Date.now();

    const update = () => {
      const now = Date.now();
      const delta = (now - lastTick) / 1000;
      lastTick = now;

      setFireflies((prev) => {
        if (finishedRef.current) return prev;
        let anyJustCaught = false;

        const next = prev.map((ff) => {
          if (ff.caught) return ff;

          // Move
          let nx = ff.x + ff.vx * delta * 50;
          let ny = ff.y + ff.vy * delta * 50;
          let nvx = ff.vx;
          let nvy = ff.vy;

          if (nx < 10 || nx > 82) nvx = -nvx;
          if (ny < 15 || ny > 85) nvy = -nvy;

          // Check distance to lantern
          const dist = Math.hypot(nx - lanternPosRef.current.x, ny - lanternPosRef.current.y);
          let newProgress = ff.captureProgress;

          // Catch if within lantern light
          if (dist < 12) {
            newProgress += 8;
            if (newProgress >= 100) {
              anyJustCaught = true;
              return { ...ff, x: nx, y: ny, caught: true, captureProgress: 100 };
            }
          } else {
            newProgress = Math.max(0, newProgress - 4);
          }

          return { ...ff, x: nx, y: ny, vx: nvx, vy: nvy, captureProgress: newProgress };
        });

        if (anyJustCaught) {
          audioEngine.playPop();
          onSuccess();
          const count = next.filter((f) => f.caught).length;
          setCaughtCount(count);
          onProgress?.(count, totalCount);

          if (count >= totalCount && !finishedRef.current) {
            finishedRef.current = true;
            const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
            const stars = Math.min(10, Math.max(6, 11 - Math.floor(timeTaken / 5)));
            const score = count * 100 + Math.max(0, 300 - timeTaken * 8);

            setTimeout(() => {
              onComplete({
                gameId: 3,
                score,
                stars,
                accuracy: 100,
                timeTakenSeconds: timeTaken,
                correctCount: count,
                mistakeCount: 0,
              });
            }, 350);
          }
        }

        return next;
      });
      animId = requestAnimationFrame(update);
    };

    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [totalCount, onProgress, onSuccess, onComplete, startTime]);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    lanternPosRef.current = { x, y };
    setLanternDisplay({ x, y });
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-900 select-none cursor-none p-4"
    >
      {/* Top Banner Guide */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 rounded-full bg-slate-900/90 px-5 py-1 text-xs sm:text-sm font-bold text-amber-200 border border-amber-400/40 shadow-lg">
        Rê quầng sáng đèn lồng trùm lên đom đóm: {caughtCount}/{totalCount}
      </div>

      {/* Glass Jar for captured fireflies on the right */}
      <div className="absolute top-12 right-6 z-20 flex flex-col items-center rounded-2xl border-2 border-amber-300/60 bg-amber-900/30 p-3 backdrop-blur-xs">
        <span className="text-[11px] font-bold text-amber-200 mb-1">Lọ Đom Đóm</span>
        <div className="relative h-28 w-16 rounded-xl border-2 border-white/60 bg-white/10 p-1 flex flex-wrap content-end gap-1 overflow-hidden shadow-inner">
          {Array.from({ length: caughtCount }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
              className="h-3.5 w-3.5 rounded-full bg-amber-300 shadow-[0_0_8px_#fde047]"
            />
          ))}
        </div>
      </div>

      {/* Fireflies */}
      {fireflies.map((ff) => (
        <div
          key={ff.id}
          style={{
            position: 'absolute',
            left: `${ff.x}%`,
            top: `${ff.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none z-10 flex flex-col items-center"
        >
          <AnimatePresence>
            {!ff.caught && (
              <motion.div
                animate={{
                  scale: [1, 1.25, 1],
                  opacity: [0.75, 1, 0.75],
                }}
                transition={{ repeat: Infinity, duration: 1.2 + (ff.id % 3) * 0.4 }}
                className="relative flex items-center justify-center"
              >
                {/* Glowing Aura */}
                <div className="h-10 w-10 rounded-full bg-amber-400/30 blur-xs" />
                <div className="absolute h-4 w-4 rounded-full bg-amber-300 shadow-[0_0_12px_#fde047]" />
                <span className="absolute text-xs">✨</span>

                {/* Capture progress ring */}
                {ff.captureProgress > 0 && (
                  <div className="absolute -inset-2 rounded-full border-2 border-green-400 animate-spin" />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}

      {/* Floating Spotlight (Lantern Light) following mouse */}
      <div
        style={{
          position: 'absolute',
          left: `${lanternDisplay.x}%`,
          top: `${lanternDisplay.y}%`,
          width: `${lanternRadius * 2}px`,
          height: `${lanternRadius * 2}px`,
          transform: 'translate(-50%, -50%)',
        }}
        className="pointer-events-none z-20 flex items-center justify-center"
      >
        {/* Lantern Light Circle */}
        <div className="h-full w-full rounded-full border-2 border-amber-300/80 bg-radial from-amber-200/40 via-amber-400/20 to-transparent shadow-[0_0_30px_rgba(251,191,36,0.6)]" />
        {/* Lantern Icon in center */}
        <span className="absolute text-2xl drop-shadow-md">🏮</span>
      </div>
    </div>
  );
};
