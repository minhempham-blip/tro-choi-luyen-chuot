import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Rocket, Sparkles, Award, Zap, Compass, Navigation } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface StarGate {
  id: number;
  order: number;
  x: number; // percentage 12% - 88%
  y: number; // percentage 18% - 82%
  baseX: number;
  baseY: number;
  size: number;
  color: string;
  glowColor: string;
  passed: boolean;
  speed: number;
  amplitude: number;
  phase: number;
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface StardustTrail {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface CosmicGem {
  id: number;
  x: number;
  y: number;
  emoji: string;
  collected: boolean;
  points: number;
}

export const CosmicVoyageGame: React.FC<GameComponentProps> = ({
  level = 1,
  round = 1,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);

  // Required gates count per round
  const targetRequired = useMemo(() => {
    if (easyMode) return 5;
    if (level === 1) return round === 1 ? 5 : 7;
    if (level === 2) return round === 1 ? 8 : 10;
    return round === 1 ? 11 : 13;
  }, [level, round, easyMode]);

  const [currentOrder, setCurrentOrder] = useState(1);
  const [gates, setGates] = useState<StarGate[]>([]);
  const [gems, setGems] = useState<CosmicGem[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [startTime] = useState(Date.now());
  const [shipPos, setShipPos] = useState({ x: 20, y: 75 });
  const [shipTilt, setShipTilt] = useState(0);
  const [trails, setTrails] = useState<StardustTrail[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);

  // Ghost demonstration cursor for Tier 3 hint
  const [ghostShip, setGhostShip] = useState<{
    x: number;
    y: number;
    active: boolean;
  }>({
    x: 20,
    y: 75,
    active: false,
  });

  // Base gate radius
  const gateBaseSize = useMemo(() => {
    if (easyMode) return 96;
    if (level === 1) return 88;
    if (level === 2) return 74;
    return 62;
  }, [level, easyMode]);

  // Color palette for cosmic gates
  const gateColors = [
    { main: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' }, // Cyan
    { main: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' }, // Gold
    { main: '#f43f5e', glow: 'rgba(244, 63, 94, 0.6)' },  // Rose
    { main: '#a855f7', glow: 'rgba(168, 85, 247, 0.6)' }, // Purple
    { main: '#34d399', glow: 'rgba(52, 211, 153, 0.6)' }, // Emerald
    { main: '#fb923c', glow: 'rgba(251, 146, 60, 0.6)' }, // Orange
  ];

  // Initialize gates in a pleasant constellation curve
  useEffect(() => {
    finishedRef.current = false;
    setCurrentOrder(1);

    const newGates: StarGate[] = [];
    const count = targetRequired;

    // Coordinate templates ensuring spaced layout across 100% canvas
    for (let i = 0; i < count; i++) {
      const order = i + 1;
      const palette = gateColors[i % gateColors.length];

      // Procedural curving flight path across space
      const progress = i / (count - 1 || 1);
      const angle = progress * Math.PI * 2.2;
      const radiusX = 34;
      const radiusY = 26;

      const baseX = 50 + Math.sin(angle) * radiusX;
      const baseY = 50 - Math.cos(angle * 0.9) * radiusY;

      const movementMult = level === 1 ? (round === 1 ? 0 : 0.35) : level === 2 ? 0.8 : 1.3;

      newGates.push({
        id: i,
        order,
        x: Math.max(12, Math.min(88, baseX)),
        y: Math.max(18, Math.min(82, baseY)),
        baseX: Math.max(12, Math.min(88, baseX)),
        baseY: Math.max(18, Math.min(82, baseY)),
        size: gateBaseSize,
        color: palette.main,
        glowColor: palette.glow,
        passed: false,
        speed: (0.6 + Math.random() * 0.4) * movementMult,
        amplitude: (5 + Math.random() * 8) * (level === 1 && round === 1 ? 0 : 1),
        phase: (i * Math.PI) / 3,
      });
    }

    setGates(newGates);

    // Initial gems scattered around
    const gemEmojis = ['💎', '⭐', '🍬', '🪐', '🌟'];
    const newGems: CosmicGem[] = [];
    for (let i = 0; i < count - 1; i++) {
      const g1 = newGates[i];
      const g2 = newGates[i + 1];
      newGems.push({
        id: i,
        x: (g1.baseX + g2.baseX) / 2 + (Math.random() * 8 - 4),
        y: (g1.baseY + g2.baseY) / 2 + (Math.random() * 8 - 4),
        emoji: gemEmojis[i % gemEmojis.length],
        collected: false,
        points: 30,
      });
    }
    setGems(newGems);

    // Start ship near gate 1
    if (newGates[0]) {
      setShipPos({ x: newGates[0].x - 8, y: newGates[0].y + 6 });
    }
  }, [level, round, targetRequired, gateBaseSize]);

  // Animation frame loop for floating gates & trails
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setGates((prev) =>
        prev.map((gate) => {
          if (gate.amplitude === 0) return gate;

          const newPhase = gate.phase + gate.speed * dt * 2;
          let newX = gate.baseX + Math.sin(newPhase) * gate.amplitude;
          let newY = gate.baseY + Math.cos(newPhase * 0.8) * (gate.amplitude * 0.5);

          return {
            ...gate,
            x: Math.max(10, Math.min(90, newX)),
            y: Math.max(16, Math.min(84, newY)),
            phase: newPhase,
          };
        })
      );

      // Fade stardust engine trail
      setTrails((prev) =>
        prev
          .map((t) => ({ ...t, size: t.size * 0.94 }))
          .filter((t) => t.size > 1.5)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Add floating message
  const addFloatingScore = (x: number, y: number, text: string, color: string) => {
    const id = Date.now() + Math.random();
    setFloatingScores((prev) => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((s) => s.id !== id));
    }, 1100);
  };

  // Check collision between spaceship and cosmic objects
  const checkCollisions = (sx: number, sy: number) => {
    if (finishedRef.current) return;

    // Check active gate
    const activeGate = gates.find((g) => g.order === currentOrder && !g.passed);
    if (activeGate) {
      const dist = Math.hypot(sx - activeGate.x, sy - activeGate.y);
      // Gate hitbox radius
      const hitRadius = (activeGate.size / 2) * 0.45;

      if (dist < hitRadius) {
        // PASSED THE GATE!
        audioEngine.playSwoosh();
        audioEngine.playPop();
        audioEngine.playStarChime(activeGate.order % 10);
        audioEngine.playSuccess();

        setGates((prev) =>
          prev.map((g) => (g.id === activeGate.id ? { ...g, passed: true } : g))
        );

        const newCombo = combo + 1;
        setCombo(newCombo);
        const comboBonus = newCombo > 1 ? (newCombo - 1) * 20 : 0;
        const earnedPoints = 100 + comboBonus;
        setScore((prev) => prev + earnedPoints);

        const comboText = newCombo > 1 ? ` (+${comboBonus} Combo x${newCombo}!)` : '';
        addFloatingScore(
          activeGate.x,
          activeGate.y,
          `+${earnedPoints} Cổng ${activeGate.order} Kích Hoạt! 🚀${comboText}`,
          activeGate.color
        );

        const nextOrder = currentOrder + 1;
        setCurrentOrder(nextOrder);
        onProgress?.(activeGate.order, targetRequired);
        onSuccess?.();

        // Check if round complete
        if (activeGate.order >= targetRequired) {
          finishedRef.current = true;
          audioEngine.playFanfare();

          setTimeout(() => {
            const durationSec = (Date.now() - startTime) / 1000;
            let earnedStars = 10;
            if (misses >= 3) earnedStars = 9;
            if (misses >= 6) earnedStars = 8;
            if (durationSec > targetRequired * 8) earnedStars = Math.max(7, earnedStars - 1);

            const totalCount = targetRequired + misses;
            const accuracy = totalCount > 0 ? Math.round((targetRequired / totalCount) * 100) : 100;

            onComplete({
              gameId: 4,
              stars: earnedStars,
              score: score + earnedPoints + (earnedStars === 10 ? 200 : 100),
              accuracy,
              timeTakenSeconds: Math.round(durationSec),
              correctCount: targetRequired,
              mistakeCount: misses,
              level,
              round,
            });
          }, 800);
        }
      }
    }

    // Check optional floating gems
    gems.forEach((gem) => {
      if (!gem.collected) {
        const dist = Math.hypot(sx - gem.x, sy - gem.y);
        if (dist < 4.5) {
          audioEngine.playPop();
          setGems((prev) =>
            prev.map((g) => (g.id === gem.id ? { ...g, collected: true } : g))
          );
          setScore((s) => s + gem.points);
          addFloatingScore(gem.x, gem.y, `+${gem.points} ${gem.emoji}`, '#facc15');
        }
      }
    });
  };

  // Mouse move handler (Hover navigation)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || finishedRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Calculate spaceship tilt based on horizontal velocity
    const dx = x - shipPos.x;
    const tilt = Math.max(-25, Math.min(25, dx * 3));
    setShipTilt(tilt);

    setShipPos({ x, y });

    // Spawn rainbow stardust engine trail
    const trailColors = ['#f43f5e', '#fb923c', '#facc15', '#38bdf8', '#a855f7'];
    const newTrail: StardustTrail = {
      id: Math.random(),
      x: x - (tilt > 0 ? 1 : -1) * 1.5,
      y: y + 4,
      color: trailColors[Math.floor(Math.random() * trailColors.length)],
      size: 7 + Math.random() * 5,
    };
    setTrails((prev) => [...prev.slice(-25), newTrail]);

    checkCollisions(x, y);
  };

  // Tier 3 Hint: Demonstration ghost spaceship flight
  useEffect(() => {
    if (currentHintTier === 3 && gates.length > 0) {
      const activeGate = gates.find((g) => g.order === currentOrder && !g.passed);
      if (activeGate) {
        setGhostShip({ x: shipPos.x, y: shipPos.y, active: true });

        // Glide towards active gate
        const t1 = setTimeout(() => {
          setGhostShip({ x: activeGate.x, y: activeGate.y, active: true });
        }, 300);

        // Pass through
        const t2 = setTimeout(() => {
          checkCollisions(activeGate.x, activeGate.y);
        }, 1500);

        // Dismiss
        const t3 = setTimeout(() => {
          setGhostShip((prev) => ({ ...prev, active: false }));
        }, 2200);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    }
  }, [currentHintTier, currentOrder]);

  const activeGate = useMemo(() => {
    return gates.find((g) => g.order === currentOrder && !g.passed);
  }, [gates, currentOrder]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full overflow-hidden select-none cursor-none rounded-2xl bg-gradient-to-b from-slate-950 via-indigo-950 to-purple-950"
    >
      {/* Deep Space Cosmic Canvas with Nebulas and Stars */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        <defs>
          <radialGradient id="nebula1" cx="30%" cy="40%" r="50%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#3b82f6" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="nebula2" cx="80%" cy="70%" r="45%">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0.25" />
            <stop offset="70%" stopColor="#6366f1" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Ambient Nebulas */}
        <rect width="100%" height="100%" fill="url(#nebula1)" />
        <rect width="100%" height="100%" fill="url(#nebula2)" />

        {/* Distant Stars Grid */}
        <g fill="#ffffff" opacity="0.75">
          <circle cx="8%" cy="12%" r="1.5" />
          <circle cx="24%" cy="8%" r="2" />
          <circle cx="38%" cy="22%" r="1" />
          <circle cx="56%" cy="14%" r="2.5" />
          <circle cx="72%" cy="18%" r="1.5" />
          <circle cx="88%" cy="10%" r="2" />
          <circle cx="94%" cy="28%" r="1" />
          <circle cx="14%" cy="45%" r="2" />
          <circle cx="28%" cy="65%" r="1" />
          <circle cx="48%" cy="78%" r="2" />
          <circle cx="68%" cy="62%" r="1.5" />
          <circle cx="84%" cy="82%" r="2" />
          <circle cx="92%" cy="60%" r="1" />
        </g>

        {/* Distant Planet Saturn with Rings */}
        <g opacity="0.6">
          <ellipse cx="88%" cy="22%" rx="36" ry="12" fill="none" stroke="#fde047" strokeWidth="3" transform="rotate(-20 880 180)" />
          <circle cx="88%" cy="22%" r="22" fill="#f59e0b" />
          <ellipse cx="88%" cy="22%" rx="36" ry="12" fill="none" stroke="#fde047" strokeWidth="2" strokeDasharray="5 3" transform="rotate(-20 880 180)" />
        </g>

        {/* Distant Blue Crescent Planet */}
        <g opacity="0.5">
          <circle cx="12%" cy="80%" r="28" fill="#1e3a8a" />
          <circle cx="16%" cy="76%" r="24" fill="#0284c7" />
        </g>

        {/* Glowing constellation path connecting all gates */}
        {gates.map((gate, i) => {
          if (i === gates.length - 1) return null;
          const nextGate = gates[i + 1];
          const isLineActive = gate.passed;
          return (
            <line
              key={gate.id}
              x1={`${gate.x}%`}
              y1={`${gate.y}%`}
              x2={`${nextGate.x}%`}
              y2={`${nextGate.y}%`}
              stroke={isLineActive ? '#38bdf8' : '#6366f1'}
              strokeWidth={isLineActive ? 3.5 : 2}
              strokeDasharray={isLineActive ? 'none' : '6 6'}
              opacity={isLineActive ? 0.8 : 0.35}
            />
          );
        })}
      </svg>

      {/* Top HUD: Info, Level & Round, Progress Bar, Score & Combo */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-3">
          {/* Level and Round pill */}
          <div className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md shadow-lg border border-cyan-400/30 flex items-center gap-2">
            <Compass className="w-4 h-4 text-cyan-300 animate-spin" />
            <span className="font-extrabold text-white text-sm">
              Màn {level === 1 ? 'Dễ' : level === 2 ? 'Vừa' : 'Khó'} • Vòng {round}/2
            </span>
          </div>

          {/* Progress counter */}
          <div className="px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md shadow-lg border border-emerald-400/30 flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-300" />
            <span className="text-xs font-bold text-gray-300">Cổng tiếp theo:</span>
            <span className="font-extrabold text-emerald-300 text-sm">
              Cổng {Math.min(currentOrder, targetRequired)} / {targetRequired}
            </span>
          </div>
        </div>

        {/* Right side: Score & Combo Badge */}
        <div className="flex items-center gap-3">
          {combo > 1 && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 text-white font-black text-xs shadow-lg flex items-center gap-1 border border-white/40"
            >
              <Zap className="w-4 h-4 fill-current text-yellow-200" />
              Combo x{combo}!
            </motion.div>
          )}

          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-black text-sm shadow-md border-2 border-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-slate-900" />
            {score} điểm
          </div>
        </div>
      </div>

      {/* Overall Progress Bar at Top Border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-black/40 z-30">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 via-purple-500 to-emerald-400"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentOrder - 1) / targetRequired) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </div>

      {/* Floating Space Gems */}
      {gems.map((gem) => {
        if (gem.collected) return null;
        return (
          <motion.div
            key={gem.id}
            style={{
              position: 'absolute',
              left: `${gem.x}%`,
              top: `${gem.y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            animate={{ y: [0, -4, 0], scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="z-10 text-xl pointer-events-none filter drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]"
          >
            {gem.emoji}
          </motion.div>
        );
      })}

      {/* Star Gates Canvas */}
      {gates.map((gate) => {
        const isActive = gate.order === currentOrder && !gate.passed;
        const isHinted = currentHintTier === 1 && isActive;

        return (
          <div
            key={gate.id}
            style={{
              position: 'absolute',
              left: `${gate.x}%`,
              top: `${gate.y}%`,
              width: `${gate.size}px`,
              height: `${gate.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="z-10 flex items-center justify-center pointer-events-none"
          >
            {/* Hint Tier 1 Aura */}
            {isHinted && (
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="absolute inset-[-16px] rounded-full border-4 border-cyan-400 bg-cyan-400/20 shadow-[0_0_35px_rgba(56,189,248,0.9)]"
              >
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-xl animate-bounce">👇</span>
                  <span className="text-[10px] font-black bg-cyan-500 text-slate-950 px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                    Lái phi thuyền qua đây!
                  </span>
                </div>
              </motion.div>
            )}

            {/* Star Gate SVG Ring */}
            <motion.div
              animate={isActive ? { rotate: 360 } : {}}
              transition={{ repeat: Infinity, duration: 8, ease: 'linear' }}
              className="w-full h-full relative flex items-center justify-center"
            >
              <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
                {/* Outer Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  stroke={gate.passed ? '#22c55e' : isActive ? gate.color : '#475569'}
                  strokeWidth="3.5"
                  strokeDasharray={isActive ? '8 4' : 'none'}
                />

                {/* Inner Portal Shimmer */}
                <circle
                  cx="50"
                  cy="50"
                  r="36"
                  fill={gate.passed ? '#15803d' : isActive ? gate.color : '#1e293b'}
                  fillOpacity={gate.passed ? 0.35 : isActive ? 0.25 : 0.15}
                  stroke={gate.passed ? '#86efac' : isActive ? '#ffffff' : '#334155'}
                  strokeWidth="2"
                />

                {/* Celestial Nodes on Ring */}
                <circle cx="50" cy="6" r="3.5" fill={isActive ? '#ffffff' : gate.color} />
                <circle cx="94" cy="50" r="3.5" fill={isActive ? '#ffffff' : gate.color} />
                <circle cx="50" cy="94" r="3.5" fill={isActive ? '#ffffff' : gate.color} />
                <circle cx="6" cy="50" r="3.5" fill={isActive ? '#ffffff' : gate.color} />
              </svg>

              {/* Order Number Badge at Center */}
              <div
                className={`absolute inset-0 flex items-center justify-center font-black ${
                  gate.passed
                    ? 'text-emerald-300 text-lg'
                    : isActive
                    ? 'text-white text-xl animate-pulse'
                    : 'text-slate-400 text-base'
                }`}
              >
                {gate.passed ? '✓' : gate.order}
              </div>
            </motion.div>
          </div>
        );
      })}

      {/* Engine Exhaust Stardust Trail */}
      {trails.map((t) => (
        <div
          key={t.id}
          style={{
            position: 'absolute',
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: `${t.size}px`,
            height: `${t.size}px`,
            backgroundColor: t.color,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
          className="z-25 filter drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
        />
      ))}

      {/* Spaceship (UFO / Star Cruiser) controlled by Mouse Pointer */}
      <div
        style={{
          position: 'absolute',
          left: `${shipPos.x}%`,
          top: `${shipPos.y}%`,
          transform: `translate(-50%, -50%) rotate(${shipTilt}deg)`,
          pointerEvents: 'none',
          transition: 'transform 0.08s ease-out',
        }}
        className="z-30 w-16 h-16 flex items-center justify-center filter drop-shadow-[0_4px_16px_rgba(56,189,248,0.7)]"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Engine Thruster Flame */}
          <polygon points="44,82 56,82 50,96" fill="#f43f5e" />
          <polygon points="46,82 54,82 50,92" fill="#facc15" />

          {/* UFO Disc Base */}
          <ellipse cx="50" cy="70" rx="42" ry="14" fill="#38bdf8" stroke="#0284c7" strokeWidth="2.5" />
          <ellipse cx="50" cy="72" rx="34" ry="9" fill="#0284c7" />

          {/* Disc Flashing LED Lights */}
          <circle cx="20" cy="72" r="3" fill="#facc15" />
          <circle cx="34" cy="74" r="3" fill="#4ade80" />
          <circle cx="50" cy="75" r="3" fill="#f43f5e" />
          <circle cx="66" cy="74" r="3" fill="#4ade80" />
          <circle cx="80" cy="72" r="3" fill="#facc15" />

          {/* Glass Dome */}
          <ellipse cx="50" cy="52" rx="26" ry="24" fill="#e0f2fe" fillOpacity="0.85" stroke="#bae6fd" strokeWidth="2" />
          <path d="M 34 40 Q 44 32 58 36" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />

          {/* Cute Astronaut Cat Pilot inside */}
          <circle cx="50" cy="54" r="13" fill="#fed7aa" />
          {/* Cat ears */}
          <polygon points="40,43 45,49 39,51" fill="#fb923c" />
          <polygon points="60,43 55,49 61,51" fill="#fb923c" />
          {/* Eyes & Smile */}
          <circle cx="46" cy="54" r="1.5" fill="#1e293b" />
          <circle cx="54" cy="54" r="1.5" fill="#1e293b" />
          <circle cx="50" cy="57" r="1" fill="#f43f5e" />
        </svg>
      </div>

      {/* Floating Score Popups */}
      <AnimatePresence>
        {floatingScores.map((fs) => (
          <motion.div
            key={fs.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -45, scale: 1.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${fs.x}%`,
              top: `${fs.y}%`,
              color: fs.color,
              pointerEvents: 'none',
            }}
            className="z-40 font-black text-sm md:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] whitespace-nowrap"
          >
            {fs.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Bottom Educational Hover Guide Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-3 z-20 pointer-events-none">
        <div className="w-8 h-10 rounded-lg border-2 border-cyan-400 bg-white/10 flex flex-col items-center justify-center p-1 relative overflow-hidden">
          <Rocket className="w-5 h-5 text-cyan-300 animate-pulse" />
        </div>
        <div>
          <p className="text-white font-extrabold text-xs">
            Rê chuột nhẹ nhàng lái phi thuyền lướt qua các cổng: <span className="text-cyan-300">1 → 2 → 3...</span>
          </p>
          <p className="text-cyan-200 text-[11px]">
            Không cần bấm nút chuột nào, hãy bay thật khéo léo nhé!
          </p>
        </div>
      </div>

      {/* Hint Tier 2 Speech Bubble */}
      {currentHintTier === 2 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border-4 border-cyan-400 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-3xl">🚀</span>
          <div>
            <p className="font-extrabold text-cyan-300 text-sm">
              Mẹo từ Chỉ huy Vũ trụ:
            </p>
            <p className="text-xs font-bold text-white">
              Em chỉ cần <span className="text-amber-300 underline font-black">rê chuột dẫn phi thuyền bay xuyên qua cổng số {currentOrder}</span> đang phát sáng nhé!
            </p>
          </div>
        </div>
      )}

      {/* Hint Tier 3: Ghost Spaceship Demonstration Flight */}
      {ghostShip.active && (
        <div
          style={{
            position: 'absolute',
            left: `${ghostShip.x}%`,
            top: `${ghostShip.y}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'all 1.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
            pointerEvents: 'none',
          }}
          className="z-50 flex flex-col items-center"
        >
          <div className="w-14 h-14 rounded-full border-2 border-cyan-300/80 bg-cyan-400/20 flex items-center justify-center animate-ping">
            <Rocket className="w-7 h-7 text-cyan-300" />
          </div>
          <span className="mt-1 px-2.5 py-0.5 rounded-full bg-indigo-900 text-white font-extrabold text-[10px] shadow border border-cyan-300">
            Xem đường bay mẫu!
          </span>
        </div>
      )}
    </div>
  );
};
