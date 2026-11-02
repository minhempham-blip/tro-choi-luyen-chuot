import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface FireworkRocket {
  id: number;
  x: number; // percentage 15-85
  y: number; // percentage from bottom to top
  speed: number;
  hue: string; // Tailwind color class or hex
  trailColor: string;
  shape: 'star' | 'heart' | 'ring' | 'flower';
  label: string;
  wobbleOffset: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  color: string;
  shape: 'star' | 'heart' | 'ring' | 'flower';
  label: string;
}

export const FireworksGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const [rockets, setRockets] = useState<FireworkRocket[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const [burstCount, setBurstCount] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [skyFlashColor, setSkyFlashColor] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const nextIdRef = useRef(0);
  const finishedRef = useRef(false);

  // Targets per level
  const targetBurst = easyMode ? 4 : level === 1 ? 5 : level === 2 ? 8 : 12;
  const maxConcurrent = level === 1 ? 2 : level === 2 ? 3 : 4;
  const rocketSpeed = easyMode ? 0.35 : level === 1 ? 0.45 : level === 2 ? 0.65 : 0.82;

  const rocketPresets = [
    { hue: '#f59e0b', trailColor: '#fef08a', shape: 'star' as const, label: 'Sao Vàng' },
    { hue: '#ec4899', trailColor: '#fbcfe8', shape: 'heart' as const, label: 'Trái Tim Hồng' },
    { hue: '#3b82f6', trailColor: '#bfdbfe', shape: 'flower' as const, label: 'Hoa Xanh Ngọc' },
    { hue: '#a855f7', trailColor: '#e9d5ff', shape: 'ring' as const, label: 'Vòng Tím Diệu Kỳ' },
    { hue: '#10b981', trailColor: '#a7f3d0', shape: 'star' as const, label: 'Sao Ngọc Lục' },
    { hue: '#ef4444', trailColor: '#fecaca', shape: 'flower' as const, label: 'Hoa Lửa Đỏ' },
  ];

  // Spawn rockets interval
  useEffect(() => {
    finishedRef.current = false;

    const spawnInterval = setInterval(() => {
      if (finishedRef.current) return;

      setRockets((prev) => {
        if (prev.length >= maxConcurrent) return prev;
        const preset = rocketPresets[nextIdRef.current % rocketPresets.length];
        const newRocket: FireworkRocket = {
          id: nextIdRef.current++,
          x: 18 + Math.random() * 64, // 18% to 82% to keep well within frame
          y: 92, // Starts near bottom
          speed: rocketSpeed + Math.random() * 0.15,
          hue: preset.hue,
          trailColor: preset.trailColor,
          shape: preset.shape,
          label: preset.label,
          wobbleOffset: Math.random() * Math.PI * 2,
        };
        return [...prev, newRocket];
      });
    }, level === 1 ? 1600 : level === 2 ? 1200 : 900);

    return () => clearInterval(spawnInterval);
  }, [level, easyMode, maxConcurrent, rocketSpeed]);

  // Physics animation loop: move rockets upwards
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const updatePhysics = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      setRockets((prev) => {
        const next: FireworkRocket[] = [];
        for (const rocket of prev) {
          const newY = rocket.y - rocket.speed * dt * 50;
          // If rocket reaches top without being clicked, it gently fades out
          if (newY > 8) {
            next.push({
              ...rocket,
              y: newY,
            });
          }
        }
        return next;
      });

      animId = requestAnimationFrame(updatePhysics);
    };

    animId = requestAnimationFrame(updatePhysics);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Handle clicking on a rocket
  const handleHitRocket = (rocket: FireworkRocket, e: React.PointerEvent | React.MouseEvent) => {
    e.stopPropagation();
    if (finishedRef.current) return;

    audioEngine.playSuccess();
    onSuccess();

    // Trigger sky flash
    setSkyFlashColor(rocket.hue);
    setTimeout(() => setSkyFlashColor(null), 250);

    // Create explosion at rocket position
    const newExplosion: Explosion = {
      id: Date.now() + Math.random(),
      x: rocket.x,
      y: rocket.y,
      color: rocket.hue,
      shape: rocket.shape,
      label: rocket.label,
    };

    setExplosions((prev) => [...prev, newExplosion]);

    // Remove explosion after animation
    setTimeout(() => {
      setExplosions((prev) => prev.filter((exp) => exp.id !== newExplosion.id));
    }, 1200);

    // Remove clicked rocket
    setRockets((prev) => prev.filter((r) => r.id !== rocket.id));

    const nextCount = burstCount + 1;
    setBurstCount(nextCount);
    onProgress?.(nextCount, targetBurst);

    if (nextCount >= targetBurst && !finishedRef.current) {
      finishedRef.current = true;
      audioEngine.playFanfare();

      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const accuracy = Math.max(50, Math.round((targetBurst / (targetBurst + mistakes)) * 100));
      const stars = Math.min(10, Math.max(5, 11 - Math.floor(mistakes / 2)));
      const score = targetBurst * 120 + Math.max(0, 300 - timeTaken * 5);

      setTimeout(() => {
        onComplete({
          gameId: 8,
          score,
          stars,
          accuracy,
          timeTakenSeconds: timeTaken,
          correctCount: nextCount,
          mistakeCount: mistakes,
        });
      }, 900);
    }
  };

  // Background miss click
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.rocket-target')) return;
    audioEngine.playError();
    onMistake();
    setMistakes((m) => m + 1);
  };

  // Find nearest rocket for Tier 1 Hint
  const targetRocket = rockets.length > 0 ? rockets[0] : null;

  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick}
      className="relative flex h-full w-full select-none flex-col items-center justify-between overflow-hidden rounded-2xl bg-gradient-to-b from-indigo-950 via-purple-950 to-slate-950 p-4 shadow-inner cursor-crosshair"
    >
      {/* Dynamic Sky Flash when firework bursts */}
      {skyFlashColor && (
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
          style={{
            backgroundColor: skyFlashColor,
            opacity: 0.18,
          }}
        />
      )}

      {/* Starry Night Sky Background SVG */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-60">
        <circle cx="12%" cy="15%" r="1.5" fill="#ffffff" opacity="0.8" />
        <circle cx="28%" cy="22%" r="2" fill="#fef08a" opacity="0.9" />
        <circle cx="45%" cy="12%" r="1" fill="#ffffff" opacity="0.7" />
        <circle cx="68%" cy="18%" r="2.5" fill="#ffffff" opacity="0.85" />
        <circle cx="82%" cy="10%" r="1.5" fill="#fef08a" opacity="0.9" />
        <circle cx="90%" cy="25%" r="2" fill="#ffffff" opacity="0.7" />
        <circle cx="20%" cy="35%" r="1.5" fill="#fef08a" opacity="0.7" />
        <circle cx="75%" cy="32%" r="1" fill="#ffffff" opacity="0.8" />
        <circle cx="35%" cy="45%" r="1.5" fill="#ffffff" opacity="0.6" />
        <circle cx="60%" cy="40%" r="2" fill="#fef08a" opacity="0.8" />
      </svg>

      {/* Whimsical Fairground / City Silhouette at Bottom */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-28 opacity-90">
        <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="h-full w-full">
          {/* Silhouettes of carnival tents, ferris wheel and fairy castle towers */}
          <path
            d="M0,200 L0,150 L60,110 L120,150 L180,90 L240,150 L310,130 L350,70 L390,130 L450,150 L520,80 L560,50 L600,80 L670,140 L730,100 L790,140 L860,120 L920,80 L960,130 L1000,150 L1000,200 Z"
            fill="#090514"
          />
          {/* Glowing windows and lanterns */}
          <circle cx="60" cy="125" r="4" fill="#fde047" opacity="0.8" />
          <circle cx="180" cy="110" r="4" fill="#fde047" opacity="0.8" />
          <circle cx="350" cy="95" r="5" fill="#fde047" opacity="0.9" />
          <circle cx="560" cy="75" r="6" fill="#fde047" opacity="0.95" />
          <circle cx="730" cy="115" r="4" fill="#fde047" opacity="0.8" />
          <circle cx="920" cy="98" r="5" fill="#fde047" opacity="0.85" />
          {/* Carnival bunting string lights */}
          <path
            d="M0,160 Q250,185 500,165 Q750,185 1000,160"
            fill="none"
            stroke="#fbbf24"
            strokeWidth="1.5"
            strokeDasharray="4 8"
          />
        </svg>
      </div>

      {/* Top Game Instruction Bar */}
      <div className="relative z-20 flex w-full max-w-xl items-center justify-between rounded-2xl bg-slate-900/85 px-4 py-2.5 backdrop-blur-md border-2 border-amber-400/50 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-400 text-base font-black text-amber-950 shadow-sm">
            🎆
          </span>
          <div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">
              Bài tập 8: Nháy chuột trái
            </span>
            <div className="text-sm font-extrabold text-white">
              Nháy chuột vào quả pháo đang bay lên!
            </div>
          </div>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 px-3 py-1.5 border border-amber-400/40">
          <span className="text-xs font-bold text-amber-200">Đã bắn:</span>
          <span className="text-base font-black text-amber-300">
            {burstCount} / {targetBurst}
          </span>
          <span className="text-xs">✨</span>
        </div>
      </div>

      {/* Active Flying Rockets */}
      <div className="relative z-20 h-full w-full">
        {rockets.map((rocket) => (
          <div
            key={rocket.id}
            onPointerDown={(e) => handleHitRocket(rocket, e)}
            className="rocket-target absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform duration-75 active:scale-90"
            style={{
              left: `${rocket.x}%`,
              top: `${rocket.y}%`,
            }}
          >
            {/* Click target hit area wrapper (minimum 64px) */}
            <div className="relative flex flex-col items-center justify-center p-3">
              {/* Rocket SVG */}
              <div className="relative h-14 w-10 drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)]">
                <svg viewBox="0 0 40 60" className="h-full w-full">
                  {/* Rocket Nose Cone */}
                  <polygon points="20,2 10,22 30,22" fill={rocket.hue} />
                  {/* Rocket Body */}
                  <rect x="11" y="22" width="18" height="26" rx="3" fill="#ffffff" stroke={rocket.hue} strokeWidth="2" />
                  {/* Body decorative stripes */}
                  <line x1="11" y1="30" x2="29" y2="30" stroke={rocket.hue} strokeWidth="2.5" />
                  <line x1="11" y1="38" x2="29" y2="38" stroke={rocket.hue} strokeWidth="2.5" />
                  {/* Rocket Fins */}
                  <polygon points="11,36 3,48 11,48" fill={rocket.hue} />
                  <polygon points="29,36 37,48 29,48" fill={rocket.hue} />
                  {/* Star icon badge in center */}
                  <circle cx="20" cy="34" r="3.5" fill="#fde047" />
                </svg>
              </div>

              {/* Animated Fiery Sparkle Exhaust Trail */}
              <motion.div
                animate={{
                  scaleY: [0.8, 1.4, 0.9],
                  opacity: [0.7, 1, 0.8],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 0.35,
                  ease: 'easeInOut',
                }}
                className="mt-[-4px] flex flex-col items-center"
              >
                <div
                  className="h-5 w-2 rounded-full blur-[1px]"
                  style={{
                    backgroundColor: rocket.trailColor,
                    boxShadow: `0 0 8px ${rocket.trailColor}`,
                  }}
                />
                <div className="h-2 w-1 rounded-full bg-amber-400 opacity-80" />
              </motion.div>
            </div>
          </div>
        ))}

        {/* Explosions layer */}
        <AnimatePresence>
          {explosions.map((exp) => (
            <div
              key={exp.id}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 z-30"
              style={{
                left: `${exp.x}%`,
                top: `${exp.y}%`,
              }}
            >
              {/* Central Glowing Expanding Blast Ring */}
              <motion.div
                initial={{ scale: 0.2, opacity: 1 }}
                animate={{ scale: 2.2, opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="absolute -inset-10 rounded-full border-4"
                style={{ borderColor: exp.color }}
              />

              {/* Radiating Sparkles and Star Petals */}
              <div className="relative h-32 w-32 -translate-x-1/2 -translate-y-1/2">
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, idx) => {
                  const rad = (angle * Math.PI) / 180;
                  const distance = 48 + (idx % 2 === 0 ? 16 : 0);
                  const targetX = Math.cos(rad) * distance;
                  const targetY = Math.sin(rad) * distance;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ x: 0, y: 0, scale: 1.2, opacity: 1 }}
                      animate={{
                        x: targetX,
                        y: targetY,
                        scale: [1.2, 1.5, 0],
                        opacity: [1, 0.9, 0],
                      }}
                      transition={{ duration: 0.85, ease: 'easeOut' }}
                      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    >
                      <svg viewBox="0 0 20 20" className="h-6 w-6">
                        <polygon
                          points="10,1 12,7 18,8 13,12 15,18 10,14 5,18 7,12 2,8 8,7"
                          fill={idx % 2 === 0 ? exp.color : '#fde047'}
                        />
                      </svg>
                    </motion.div>
                  );
                })}
              </div>

              {/* Floating Sparkle Text */}
              <motion.div
                initial={{ y: 0, opacity: 1, scale: 0.8 }}
                animate={{ y: -35, opacity: 0, scale: 1.2 }}
                transition={{ duration: 0.9, ease: 'easeOut' }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-md border border-white"
              >
                ✨ {exp.label} rực rỡ!
              </motion.div>
            </div>
          ))}
        </AnimatePresence>

        {/* Hint Tier 1: Arrow pointing to the nearest rocket */}
        {currentHintTier >= 1 && targetRocket && (
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: [-8, 0, -8] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            className="pointer-events-none absolute z-40 flex flex-col items-center -translate-x-1/2"
            style={{
              left: `${targetRocket.x}%`,
              top: `${Math.max(6, targetRocket.y - 12)}%`,
            }}
          >
            <div className="rounded-full bg-amber-400 px-3 py-1 text-xs font-black text-amber-950 shadow-lg border-2 border-white whitespace-nowrap">
              Bấm vào đây nè! 👇
            </div>
            <div className="h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-amber-400 drop-shadow-md" />
          </motion.div>
        )}

        {/* Hint Tier 3: Demo Hand Cursor showing how to click */}
        {currentHintTier >= 3 && targetRocket && (
          <motion.div
            initial={{
              left: '50%',
              top: '80%',
              scale: 1,
            }}
            animate={{
              left: `${targetRocket.x}%`,
              top: `${targetRocket.y}%`,
              scale: [1, 1, 0.85, 1],
            }}
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="pointer-events-none absolute z-50 flex items-center gap-1.5 -translate-x-2 -translate-y-2 drop-shadow-2xl"
          >
            <svg viewBox="0 0 24 24" className="h-10 w-10 fill-amber-300 stroke-slate-900 stroke-2">
              <path d="M10 2a2 2 0 0 1 2 2v6h1a2 2 0 0 1 2 2v1h1a2 2 0 0 1 2 2v4a7 7 0 0 1-7 7H9a7 7 0 0 1-7-7v-6a2 2 0 0 1 2-2h1V4a2 2 0 0 1 2-2z" />
            </svg>
            <span className="rounded-lg bg-white/95 px-2 py-0.5 text-[11px] font-black text-slate-900 shadow-md border border-amber-300">
              Nháy chuột trái!
            </span>
          </motion.div>
        )}
      </div>

      {/* Bottom Launchpad indicator lights */}
      <div className="relative z-10 flex items-center justify-around w-full max-w-md pt-1 pb-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300/80">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
          Bệ phóng pháo hoa sẵn sàng
        </div>
        <div className="text-xs font-semibold text-slate-300">
          Chỉ cần nháy chuột trái 1 lần
        </div>
      </div>
    </div>
  );
};
