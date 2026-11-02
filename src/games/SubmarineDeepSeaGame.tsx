import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowDown, ArrowUp, Camera, CheckCircle2, Compass, Sparkles } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface SeaTarget {
  id: string;
  depth: number;
  name: string;
  emoji: string;
  description: string;
  zone: string;
  discovered: boolean;
}

export const SubmarineDeepSeaGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [depth, setDepth] = useState<number>(10); // current depth in meters
  const [startTime] = useState(Date.now());
  const finishedRef = useRef(false);
  const [flashActive, setFlashActive] = useState(false);

  // Targets configuration based on level
  const initialTargets: SeaTarget[] = useMemo(() => {
    if (easyMode || level === 1) {
      return [
        {
          id: 'clownfish',
          depth: 70,
          name: 'Đàn cá hề Nemo',
          emoji: '🐠',
          description: 'Cá hề vui nhộn nô đùa bên rạn san hô',
          zone: 'Vùng ánh nắng',
          discovered: false,
        },
        {
          id: 'turtle',
          depth: 170,
          name: 'Rùa biển nghìn năm',
          emoji: '🐢',
          description: 'Cụ rùa bơi thong thả qua làn nước biếc',
          zone: 'Vùng nước sâu',
          discovered: false,
        },
        {
          id: 'pearl_chest',
          depth: 270,
          name: 'Rương ngọc trai phát sáng',
          emoji: '💎',
          description: 'Kho báu ngọc trai lấp lánh nơi đáy biển',
          zone: 'Đáy biển cát trắng',
          discovered: false,
        },
      ];
    } else if (level === 2) {
      return [
        {
          id: 'dolphin',
          depth: 80,
          name: 'Cá heo nhào lộn',
          emoji: '🐬',
          description: 'Chú cá heo thông minh lượn sóng chào đón',
          zone: 'Vùng ánh nắng',
          discovered: false,
        },
        {
          id: 'jellyfish',
          depth: 200,
          name: 'Sứa biển phát quang',
          emoji: '🪼',
          description: 'Đàn sứa tỏa ánh sáng huyền diệu tựa cầu vồng',
          zone: 'Vùng hoàng hôn',
          discovered: false,
        },
        {
          id: 'octopus',
          depth: 340,
          name: 'Bạch tuộc khổng lồ',
          emoji: '🐙',
          description: 'Bạch tuộc thân thiện vẫy những xúc tu mềm mại',
          zone: 'Vùng thềm lục địa',
          discovered: false,
        },
        {
          id: 'shipwreck',
          depth: 460,
          name: 'Con tàu đắm cổ tích',
          emoji: '🚢',
          description: 'Tàu thám hiểm xưa nằm yên bình dưới đáy biển',
          zone: 'Vực thẳm bí ẩn',
          discovered: false,
        },
      ];
    } else {
      return [
        {
          id: 'seahorse',
          depth: 90,
          name: 'Đàn cá ngựa cầu vồng',
          emoji: '🫧',
          description: 'Cá ngựa tí hon nhảy múa bên rừng tảo biển',
          zone: 'Vùng ánh nắng',
          discovered: false,
        },
        {
          id: 'whale',
          depth: 240,
          name: 'Cá voi lưng gù',
          emoji: '🐋',
          description: 'Vua biển khổng lồ đang hát khúc ca đại dương',
          zone: 'Vùng hoàng hôn',
          discovered: false,
        },
        {
          id: 'anglerfish',
          depth: 420,
          name: 'Cá lồng đèn biển sâu',
          emoji: '🐡',
          description: 'Chú cá ngộ nghĩnh mang chiếc đèn pha trên đầu',
          zone: 'Vực thẳm bóng tối',
          discovered: false,
        },
        {
          id: 'atlantis',
          depth: 600,
          name: 'Cung điện Atlantis',
          emoji: '🏛️',
          description: 'Thành phố cổ tích dưới lòng đại dương bao la',
          zone: 'Vực thẳm bóng tối',
          discovered: false,
        },
        {
          id: 'treasure',
          depth: 760,
          name: 'Rương vàng kho báu hoàng gia',
          emoji: '👑',
          description: 'Kho báu huyền thoại ngập tràn kim cương và vàng',
          zone: 'Đáy đại dương sâu nhất',
          discovered: false,
        },
      ];
    }
  }, [level, easyMode]);

  const [targets, setTargets] = useState<SeaTarget[]>(initialTargets);

  const maxDepth = useMemo(() => {
    if (easyMode || level === 1) return 300;
    if (level === 2) return 500;
    return 800;
  }, [level, easyMode]);

  const scrollStep = easyMode ? 18 : level === 1 ? 14 : level === 2 ? 11 : 9;

  // Active target currently near the submarine (tolerance ± 24m)
  const nearbyTarget = targets.find((t) => !t.discovered && Math.abs(t.depth - depth) <= 24);

  // Next target to discover for guidance
  const nextTarget = targets.find((t) => !t.discovered);

  // Sound throttler for scroll wheel
  const lastSoundTimeRef = useRef(0);
  const playScrollSound = () => {
    const now = Date.now();
    if (now - lastSoundTimeRef.current > 75) {
      audioEngine.playScrollTick();
      lastSoundTimeRef.current = now;
    }
  };

  // Adjust depth with bounds
  const changeDepth = (delta: number) => {
    if (finishedRef.current) return;
    playScrollSound();

    setDepth((prev) => {
      const next = Math.max(0, Math.min(maxDepth, prev + delta));
      return next;
    });
  };

  // Non-passive wheel event listener on container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // DeltaY > 0 means wheel pulled DOWN (dive deeper)
      // DeltaY < 0 means wheel pushed UP (surface)
      const multiplier = Math.abs(e.deltaY) > 60 ? 1.4 : 1.0;
      if (e.deltaY > 0) {
        changeDepth(Math.round(scrollStep * multiplier));
      } else {
        changeDepth(-Math.round(scrollStep * multiplier));
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [scrollStep, maxDepth]);

  // Keyboard navigation fallback (ArrowDown / ArrowUp / PageDown / PageUp)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (finishedRef.current) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        changeDepth(scrollStep * 1.5);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        changeDepth(-scrollStep * 1.5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scrollStep]);

  // Capture / Discover a target
  const captureTarget = (targetId: string) => {
    if (finishedRef.current) return;

    // Trigger flash animation & sounds
    setFlashActive(true);
    setTimeout(() => setFlashActive(false), 260);

    audioEngine.playBubblePop();
    setTimeout(() => audioEngine.playStarChime(2), 120);

    setTargets((prev) => {
      const updated = prev.map((t) => (t.id === targetId ? { ...t, discovered: true } : t));
      const discoveredCount = updated.filter((t) => t.discovered).length;
      onProgress?.(discoveredCount, updated.length);

      // Check if all targets are discovered
      if (discoveredCount === updated.length && !finishedRef.current) {
        finishedRef.current = true;
        audioEngine.playSuccess();
        onSuccess();

        const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
        const stars = 10;
        const score = 1200 + Math.max(0, 400 - timeTaken * 8);

        setTimeout(() => {
          onComplete({
            gameId: 19,
            score,
            stars,
            accuracy: 100,
            timeTakenSeconds: timeTaken,
            correctCount: updated.length,
            mistakeCount: 0,
          });
        }, 700);
      }

      return updated;
    });
  };

  // Auto-capture when submarine stops right at target depth for 600ms
  useEffect(() => {
    if (!nearbyTarget) return;

    const timer = setTimeout(() => {
      captureTarget(nearbyTarget.id);
    }, 650);

    return () => clearTimeout(timer);
  }, [nearbyTarget, depth]);

  // Auto guide for Tier 3 hint: smoothly steer depth towards next target
  useEffect(() => {
    if (currentHintTier < 3 || !nextTarget || finishedRef.current) return;

    const interval = setInterval(() => {
      setDepth((prev) => {
        const diff = nextTarget.depth - prev;
        if (Math.abs(diff) <= 8) return nextTarget.depth;
        return prev + (diff > 0 ? 8 : -8);
      });
    }, 180);

    return () => clearInterval(interval);
  }, [currentHintTier, nextTarget]);

  // Calculate visual ocean gradient based on depth ratio
  const depthRatio = depth / maxDepth;
  // Submarine Y position on screen (from 15% near surface to 80% at max depth)
  const submarineScreenY = 16 + depthRatio * 68;

  // Determine current marine zone
  const currentZone = useMemo(() => {
    if (depth < maxDepth * 0.25) return { name: 'Vùng Ánh Nắng (Sunlight)', color: 'text-amber-300' };
    if (depth < maxDepth * 0.65) return { name: 'Vùng Hoàng Hôn (Twilight)', color: 'text-cyan-300' };
    return { name: 'Vực Thẳm Bí Ẩn (Abyss)', color: 'text-indigo-300' };
  }, [depth, maxDepth]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      className="relative h-full w-full overflow-hidden rounded-2xl select-none flex flex-col justify-between focus:outline-hidden"
      style={{
        background: `linear-gradient(180deg, 
          #38bdf8 0%, 
          #0284c7 ${Math.max(10, 25 - depthRatio * 15)}%, 
          #0369a1 ${Math.max(25, 45 - depthRatio * 20)}%, 
          #075985 60%, 
          #0f172a 100%)`,
      }}
    >
      {/* Camera Flash Overlay */}
      <AnimatePresence>
        {flashActive && (
          <motion.div
            initial={{ opacity: 0.85 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="pointer-events-none absolute inset-0 z-50 bg-white"
          />
        )}
      </AnimatePresence>

      {/* Surface Waves & Sun (Visible near surface) */}
      <div
        className="pointer-events-none absolute top-0 left-0 right-0 h-28 overflow-hidden transition-opacity duration-300"
        style={{ opacity: Math.max(0, 1 - depthRatio * 2.5) }}
      >
        <div className="absolute top-2 right-12 text-4xl animate-pulse">☀️</div>
        <div className="absolute top-6 left-16 text-2xl opacity-80">🕊️</div>
        {/* Ocean Surface Waves SVG */}
        <svg className="absolute bottom-0 w-[200%] h-12 text-white/40 animate-pulse" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z" fill="currentColor" />
        </svg>
      </div>

      {/* Floating Bubbles */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[15, 30, 48, 65, 82, 94].map((left, idx) => (
          <motion.div
            key={idx}
            animate={{
              y: ['100%', '-20%'],
              x: [0, (idx % 2 === 0 ? 15 : -15), 0],
              opacity: [0.1, 0.6, 0],
            }}
            transition={{
              duration: 5 + (idx % 4),
              repeat: Infinity,
              delay: idx * 0.9,
              ease: 'linear',
            }}
            className="absolute text-xl sm:text-2xl"
            style={{ left: `${left}%` }}
          >
            🫧
          </motion.div>
        ))}
      </div>

      {/* Sea Floor Rocks & Coral at the bottom */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 flex items-end justify-between px-6 transition-opacity duration-500"
        style={{ opacity: Math.max(0.2, (depthRatio - 0.4) * 2) }}
      >
        <div className="text-4xl sm:text-6xl filter drop-shadow">🪸</div>
        <div className="text-3xl sm:text-5xl filter drop-shadow">🐚</div>
        <div className="text-4xl sm:text-6xl filter drop-shadow">🪸</div>
        <div className="text-5xl sm:text-7xl filter drop-shadow">🏰</div>
        <div className="text-3xl sm:text-5xl filter drop-shadow">🪸</div>
      </div>

      {/* --- TOP INSTRUMENT PANEL & MISSION STRIP --- */}
      <div className="z-30 flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-slate-900/80 backdrop-blur-md rounded-b-2xl border-b-2 border-cyan-400/50 shadow-xl">
        {/* Left: Depth Gauge & Sonar Status */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg border border-yellow-200">
            <Compass className="h-6 w-6 animate-spin" style={{ animationDuration: '8s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">Độ sâu tàu lặn:</span>
              <span className="rounded-md bg-cyan-950 px-2 py-0.5 text-base font-black text-yellow-300 font-mono tracking-wider border border-cyan-600">
                {depth}m / {maxDepth}m
              </span>
            </div>
            <div className={`text-xs font-semibold ${currentZone.color}`}>
              {currentZone.name}
            </div>
          </div>
        </div>

        {/* Center: Mission Target Badges */}
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          {targets.map((tgt) => (
            <div
              key={tgt.id}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
                tgt.discovered
                  ? 'bg-emerald-500/30 text-emerald-300 border-emerald-400'
                  : Math.abs(tgt.depth - depth) <= 24
                  ? 'bg-amber-400/40 text-yellow-200 border-yellow-300 scale-105 shadow-md animate-bounce'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700'
              }`}
              title={`${tgt.name} (${tgt.depth}m)`}
            >
              <span className="text-sm">{tgt.emoji}</span>
              <span className="hidden md:inline">{tgt.name}</span>
              <span className="text-[10px] font-mono opacity-80">{tgt.depth}m</span>
              {tgt.discovered && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
            </div>
          ))}
        </div>

        {/* Right: Quick action hint */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-medium text-slate-300 bg-cyan-950/60 px-3 py-1.5 rounded-xl border border-cyan-700/50">
          <span className="text-base">🖱️</span>
          <span>Lăn con lăn xuống để lặn, lăn lên để nổi</span>
        </div>
      </div>

      {/* --- MAIN OCEAN WATER COLUMN (Submarine + Targets) --- */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Depth Ruler Line along the left side */}
        <div className="absolute left-3 top-4 bottom-4 w-1 bg-cyan-400/30 rounded-full flex flex-col justify-between items-center py-2">
          {[0, 25, 50, 75, 100].map((pct) => (
            <div key={pct} className="relative flex items-center">
              <div className="w-2.5 h-0.5 bg-cyan-300" />
              <span className="absolute left-3 text-[10px] font-mono text-cyan-200 font-bold">
                {Math.round((pct / 100) * maxDepth)}m
              </span>
            </div>
          ))}
          {/* Active Depth Indicator on Ruler */}
          <div
            className="absolute -left-1 w-3 h-3 rounded-full bg-amber-400 shadow-lg border border-white transition-all duration-150"
            style={{ top: `${depthRatio * 100}%` }}
          />
        </div>

        {/* Discovery Targets floating at their depths */}
        {targets.map((tgt) => {
          // Calculate screen position for target relative to current submarine depth window
          const targetDepthRatio = tgt.depth / maxDepth;
          const targetScreenY = 16 + targetDepthRatio * 68;
          const isNearby = !tgt.discovered && Math.abs(tgt.depth - depth) <= 24;

          return (
            <div
              key={tgt.id}
              style={{
                position: 'absolute',
                left: '70%',
                top: `${targetScreenY}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="z-20 transition-all duration-300"
            >
              <div className="relative flex items-center gap-3">
                {/* Sonar Pulsing Ring if undiscovered and nearby */}
                {isNearby && (
                  <div className="absolute -inset-4 rounded-full border-2 border-yellow-300 animate-ping opacity-75 pointer-events-none" />
                )}

                {/* Target Graphic / Card */}
                <div
                  className={`flex items-center gap-2 p-2 rounded-2xl border-2 transition-all shadow-xl ${
                    tgt.discovered
                      ? 'bg-emerald-950/80 border-emerald-400 opacity-90'
                      : isNearby
                      ? 'bg-amber-950/90 border-yellow-300 scale-110 shadow-yellow-400/40'
                      : 'bg-slate-900/70 border-cyan-500/40 opacity-70'
                  }`}
                >
                  <span className="text-3xl sm:text-4xl animate-pulse">{tgt.emoji}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs sm:text-sm font-black text-white">{tgt.name}</span>
                      {tgt.discovered ? (
                        <span className="rounded-full bg-emerald-500 px-1.5 py-0.2 text-[9px] font-bold text-white">
                          ĐÃ KHÁM PHÁ
                        </span>
                      ) : (
                        <span className="rounded-full bg-cyan-700 px-1.5 py-0.2 text-[9px] font-bold text-cyan-100 font-mono">
                          {tgt.depth}m
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-cyan-200/90 max-w-[150px] sm:max-w-[200px] truncate">
                      {tgt.description}
                    </p>
                  </div>
                </div>

                {/* Snap Photo Button when nearby */}
                {isNearby && (
                  <motion.button
                    initial={{ scale: 0.8 }}
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    type="button"
                    onClick={() => captureTarget(tgt.id)}
                    className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-2 text-xs font-black text-slate-950 shadow-lg border-2 border-white hover:brightness-110 active:scale-95 cursor-pointer z-30"
                  >
                    <Camera className="h-4 w-4" />
                    <span>CHỤP ẢNH!</span>
                  </motion.button>
                )}
              </div>
            </div>
          );
        })}

        {/* --- YELLOW EXPLORATION SUBMARINE --- */}
        <div
          style={{
            position: 'absolute',
            left: '35%',
            top: `${submarineScreenY}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="z-20 transition-all duration-150 ease-out"
        >
          <div className="relative">
            {/* Searchlight Beam pointing downward/forward */}
            <div
              className="pointer-events-none absolute left-28 -top-8 w-64 h-36 opacity-35"
              style={{
                background: 'radial-gradient(ellipse at 0% 50%, rgba(254, 240, 138, 0.85) 0%, rgba(254, 240, 138, 0.2) 60%, transparent 80%)',
                clipPath: 'polygon(0% 45%, 100% 0%, 100% 100%, 0% 55%)',
                transformOrigin: '0% 50%',
              }}
            />

            {/* Submarine SVG Body */}
            <svg
              className="w-40 sm:w-52 h-24 sm:h-32 filter drop-shadow-2xl"
              viewBox="0 0 240 140"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Propeller at back */}
              <g className="animate-spin" style={{ transformOrigin: '15px 70px', animationDuration: '0.8s' }}>
                <ellipse cx="15" cy="55" rx="5" ry="14" fill="#64748b" />
                <ellipse cx="15" cy="85" rx="5" ry="14" fill="#64748b" />
                <circle cx="15" cy="70" r="5" fill="#334155" />
              </g>

              {/* Propeller shaft */}
              <rect x="18" y="66" width="12" height="8" rx="2" fill="#475569" />

              {/* Main Submarine Hull */}
              <ellipse cx="120" cy="70" rx="95" ry="42" fill="#facc15" stroke="#ca8a04" strokeWidth="4" />
              {/* Bottom belly shade */}
              <path d="M 35 78 Q 120 120 205 78 Q 120 102 35 78 Z" fill="#eab308" />

              {/* Conning Tower (cabin) */}
              <rect x="95" y="16" width="45" height="24" rx="8" fill="#facc15" stroke="#ca8a04" strokeWidth="4" />
              {/* Periscope */}
              <path d="M 112 16 L 112 4 L 126 4" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
              <circle cx="126" cy="4" r="4" fill="#0284c7" />

              {/* Porthole Windows with child captain looking out */}
              <circle cx="85" cy="65" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="3" />
              <circle cx="85" cy="65" r="11" fill="#38bdf8" />
              <text x="85" y="70" textAnchor="middle" fontSize="14" fill="#ffffff">👦</text>

              <circle cx="125" cy="65" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="3" />
              <circle cx="125" cy="65" r="11" fill="#38bdf8" />
              <text x="125" y="70" textAnchor="middle" fontSize="14" fill="#ffffff">🐱</text>

              <circle cx="165" cy="65" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="3" />
              <circle cx="165" cy="65" r="11" fill="#38bdf8" />
              <text x="165" y="70" textAnchor="middle" fontSize="14" fill="#ffffff">⭐</text>

              {/* Submarine Headlight on front nose */}
              <path d="M 210 60 Q 218 70 210 80 Z" fill="#ffffff" />
              <circle cx="212" cy="70" r="5" fill="#fef08a" stroke="#ca8a04" strokeWidth="2" />
            </svg>

            {/* Depth Tag above submarine */}
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 flex items-center gap-1 rounded-full bg-slate-900/90 px-2.5 py-0.5 text-[11px] font-black text-yellow-300 border border-yellow-400 shadow-md whitespace-nowrap">
              <span>🤿</span>
              <span>{depth} mét</span>
            </div>
          </div>
        </div>

        {/* --- HINT TIERS VISUAL INDICATORS --- */}
        {currentHintTier >= 1 && nextTarget && (
          <div
            style={{
              position: 'absolute',
              left: '48%',
              top: `${submarineScreenY}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="z-40 pointer-events-none"
          >
            <motion.div
              animate={{
                y: nextTarget.depth > depth ? [0, 16, 0] : [0, -16, 0],
                scale: [1, 1.15, 1],
              }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="flex items-center gap-1.5 rounded-full bg-pink-500 px-3 py-1 text-xs font-black text-white shadow-xl border-2 border-white"
            >
              {nextTarget.depth > depth ? (
                <>
                  <ArrowDown className="h-4 w-4" />
                  <span>Cuộn chuột xuống lặn tới {nextTarget.depth}m ({nextTarget.name})!</span>
                </>
              ) : (
                <>
                  <ArrowUp className="h-4 w-4" />
                  <span>Cuộn chuột lên nổi tới {nextTarget.depth}m ({nextTarget.name})!</span>
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>

      {/* --- BOTTOM CONTROLS & MANUAL WHEEL FALLBACK BUTTONS --- */}
      <div className="z-30 flex items-center justify-between gap-3 p-3 bg-slate-950/85 backdrop-blur-md rounded-t-2xl border-t-2 border-cyan-400/40">
        {/* Left: Scroll wheel animation guide */}
        <div className="flex items-center gap-3">
          <div className="relative flex h-11 w-8 items-center justify-center rounded-xl border-2 border-cyan-400 bg-cyan-950 p-1 shadow-inner">
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              className="h-3 w-1.5 rounded-full bg-yellow-400 shadow"
            />
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-white flex items-center gap-1">
              <span>Lăn con lăn chuột</span>
              <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
            </div>
            <div className="text-[11px] text-cyan-300">
              Lăn xuống: Lặn sâu | Lăn lên: Nổi lên
            </div>
          </div>
        </div>

        {/* Center: Mission progress summary */}
        <div className="text-center">
          <div className="text-xs font-extrabold text-cyan-200 uppercase tracking-wider">
            Mục tiêu: {targets.filter((t) => t.discovered).length} / {targets.length} sinh vật
          </div>
          <div className="text-[11px] text-slate-300">
            {nextTarget
              ? `Tiếp theo: ${nextTarget.emoji} ${nextTarget.name} ở độ sâu ${nextTarget.depth}m`
              : '🎉 Đã khám phá toàn bộ đại dương!'}
          </div>
        </div>

        {/* Right: Large tactile buttons for touchpad/single button users */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => changeDepth(-scrollStep * 2)}
            disabled={depth <= 0}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-t from-sky-600 to-cyan-500 px-3.5 py-2 text-xs sm:text-sm font-black text-white shadow-lg border border-cyan-200 hover:brightness-110 active:scale-95 disabled:opacity-40 cursor-pointer"
            title="Nổi lên (Cuộn chuột lên)"
          >
            <ArrowUp className="h-4 w-4" />
            <span>NỔI LÊN</span>
          </button>

          <button
            type="button"
            onClick={() => changeDepth(scrollStep * 2)}
            disabled={depth >= maxDepth}
            className="flex items-center gap-1 rounded-xl bg-gradient-to-b from-blue-600 to-indigo-700 px-3.5 py-2 text-xs sm:text-sm font-black text-white shadow-lg border border-indigo-300 hover:brightness-110 active:scale-95 disabled:opacity-40 cursor-pointer"
            title="Lặn sâu (Cuộn chuột xuống)"
          >
            <ArrowDown className="h-4 w-4" />
            <span>LẶN SÂU</span>
          </button>
        </div>
      </div>
    </div>
  );
};
