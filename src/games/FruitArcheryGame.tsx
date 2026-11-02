import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Sparkles, Award, Zap, Crosshair } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface TargetItem {
  id: number;
  type: 'bullseye' | 'watermelon' | 'pineapple' | 'strawberry' | 'apple' | 'star';
  x: number; // percentage 10% - 90%
  y: number; // percentage 15% - 80%
  baseX: number;
  baseY: number;
  size: number;
  points: number;
  label: string;
  speed: number;
  amplitude: number;
  phase: number;
  direction: number;
  isHit: boolean;
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface SplatParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  emoji?: string;
}

interface ArrowShot {
  id: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  progress: number;
}

export const FruitArcheryGame: React.FC<GameComponentProps> = ({
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
  const nextTargetIdRef = useRef(1);

  // Targets needed per round
  const targetRequired = useMemo(() => {
    if (easyMode) return 5;
    if (level === 1) return round === 1 ? 6 : 8;
    if (level === 2) return round === 1 ? 9 : 11;
    return round === 1 ? 12 : 14;
  }, [level, round, easyMode]);

  const [hitCount, setHitCount] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [startTime] = useState(Date.now());
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [targets, setTargets] = useState<TargetItem[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [particles, setParticles] = useState<SplatParticle[]>([]);
  const [shots, setShots] = useState<ArrowShot[]>([]);

  // Ghost demonstration cursor for Tier 3 hint
  const [ghostCursor, setGhostCursor] = useState<{ x: number; y: number; active: boolean; clicking: boolean }>({
    x: 50,
    y: 50,
    active: false,
    clicking: false,
  });

  // Target sizing and movement configuration based on difficulty
  const targetBaseSize = useMemo(() => {
    if (easyMode) return 92;
    if (level === 1) return 86;
    if (level === 2) return 72;
    return 60;
  }, [level, easyMode]);

  // Create initial targets pool
  const createTarget = (id: number, overrideType?: TargetItem['type']): TargetItem => {
    const types: TargetItem['type'][] =
      level === 1
        ? ['bullseye', 'watermelon', 'apple']
        : level === 2
        ? ['bullseye', 'watermelon', 'pineapple', 'apple', 'strawberry']
        : ['bullseye', 'watermelon', 'pineapple', 'apple', 'strawberry', 'star'];

    const type = overrideType || types[Math.floor(Math.random() * types.length)];
    const x = 12 + Math.random() * 76;
    const y = 18 + Math.random() * 62;

    let points = 50;
    let label = 'Ngọt Lịm!';
    if (type === 'bullseye') {
      points = 100;
      label = 'Hồng Tâm!';
    } else if (type === 'star') {
      points = 150;
      label = 'Ngôi Sao May Mắn!';
    } else if (type === 'watermelon') {
      points = 60;
      label = 'Dưa Hấu!';
    } else if (type === 'pineapple') {
      points = 70;
      label = 'Dứa Thơm!';
    } else if (type === 'apple') {
      points = 50;
      label = 'Táo Đỏ!';
    } else if (type === 'strawberry') {
      points = 60;
      label = 'Dâu Tây!';
    }

    const movementMultiplier = level === 1 ? (round === 1 ? 0 : 0.4) : level === 2 ? 0.9 : 1.5;

    return {
      id,
      type,
      x,
      y,
      baseX: x,
      baseY: y,
      size: targetBaseSize * (type === 'star' ? 0.85 : 1),
      points,
      label,
      speed: (0.4 + Math.random() * 0.6) * movementMultiplier,
      amplitude: (6 + Math.random() * 12) * (level === 1 && round === 1 ? 0 : 1),
      phase: Math.random() * Math.PI * 2,
      direction: Math.random() > 0.5 ? 1 : -1,
      isHit: false,
    };
  };

  // Populate active screen targets (maintain 4-6 on screen)
  useEffect(() => {
    finishedRef.current = false;
    const initialList: TargetItem[] = [];
    const count = level === 1 ? 4 : 5;
    for (let i = 0; i < count; i++) {
      initialList.push(createTarget(nextTargetIdRef.current++));
    }
    setTargets(initialList);
  }, [level, round, easyMode]);

  // Animation frame loop for smooth target drifting
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setTargets((prev) =>
        prev.map((t) => {
          if (t.isHit || t.amplitude === 0) return t;

          const newPhase = t.phase + t.speed * dt * 2;
          let newX = t.baseX + Math.sin(newPhase) * t.amplitude;
          let newY = t.baseY + Math.cos(newPhase * 0.8) * (t.amplitude * 0.4);

          // Keep in bounds
          newX = Math.max(10, Math.min(90, newX));
          newY = Math.max(15, Math.min(82, newY));

          return {
            ...t,
            x: newX,
            y: newY,
            phase: newPhase,
          };
        })
      );

      // Animate particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt * 60,
            y: p.y + p.vy * dt * 60 + 0.35, // gentle gravity
            size: p.size * 0.95,
          }))
          .filter((p) => p.size > 2)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Update container mouse position for custom reticle
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  // Tier 3 Hint: Demonstration ghost cursor
  useEffect(() => {
    if (currentHintTier === 3 && targets.length > 0) {
      const activeTarget = targets.find((t) => !t.isHit);
      if (activeTarget) {
        setGhostCursor({ x: 50, y: 85, active: true, clicking: false });

        // Glide towards target
        const timer1 = setTimeout(() => {
          setGhostCursor({ x: activeTarget.x, y: activeTarget.y, active: true, clicking: false });
        }, 300);

        // Click on target
        const timer2 = setTimeout(() => {
          setGhostCursor({ x: activeTarget.x, y: activeTarget.y, active: true, clicking: true });
          handleTargetHit(activeTarget, true);
        }, 1400);

        // Dismiss ghost
        const timer3 = setTimeout(() => {
          setGhostCursor((prev) => ({ ...prev, active: false }));
        }, 2200);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
          clearTimeout(timer3);
        };
      }
    }
  }, [currentHintTier]);

  // Spawn visual particles on hit
  const spawnHitParticles = (x: number, y: number, type: TargetItem['type']) => {
    const colorMap: Record<TargetItem['type'], string[]> = {
      bullseye: ['#ef4444', '#f59e0b', '#3b82f6', '#ffffff'],
      watermelon: ['#ef4444', '#22c55e', '#15803d', '#111827'],
      pineapple: ['#facc15', '#eab308', '#22c55e', '#ca8a04'],
      strawberry: ['#f43f5e', '#e11d48', '#22c55e', '#fecdd3'],
      apple: ['#dc2626', '#b91c1c', '#22c55e', '#fef08a'],
      star: ['#facc15', '#f59e0b', '#a855f7', '#38bdf8'],
    };

    const emojis: Record<TargetItem['type'], string> = {
      bullseye: '🎯',
      watermelon: '🍉',
      pineapple: '🍍',
      strawberry: '🍓',
      apple: '🍎',
      star: '⭐',
    };

    const colors = colorMap[type] || ['#fbbf24', '#f59e0b'];
    const newParticles: SplatParticle[] = [];

    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5);
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[i % colors.length],
        size: 8 + Math.random() * 8,
        emoji: i % 4 === 0 ? emojis[type] : undefined,
      });
    }

    setParticles((prev) => [...prev.slice(-30), ...newParticles]);
  };

  // Add floating score badge
  const addFloatingScore = (x: number, y: number, text: string, color: string) => {
    const id = Date.now() + Math.random();
    setFloatingScores((prev) => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((s) => s.id !== id));
    }, 1100);
  };

  // Handle target hit (Left Click)
  const handleTargetHit = (target: TargetItem, isDemo = false) => {
    if (finishedRef.current || target.isHit) return;

    // SFX
    audioEngine.playPop();
    if (target.type === 'bullseye' || target.type === 'star') {
      audioEngine.playStarChime(hitCount % 10);
    } else {
      audioEngine.playSuccess();
    }

    // Mark as hit
    setTargets((prev) =>
      prev.map((t) => (t.id === target.id ? { ...t, isHit: true } : t))
    );

    // Visual splat
    spawnHitParticles(target.x, target.y, target.type);

    // Scoring & Combo
    const newCombo = isDemo ? combo : combo + 1;
    setCombo(newCombo);
    const comboBonus = newCombo > 1 ? (newCombo - 1) * 20 : 0;
    const earnedPoints = target.points + comboBonus;
    setScore((prev) => prev + earnedPoints);

    const comboText = newCombo > 1 ? ` (+${comboBonus} Combo x${newCombo}!)` : '';
    addFloatingScore(target.x, target.y, `+${earnedPoints} ${target.label}${comboText}`, '#fbbf24');

    const newHitCount = hitCount + 1;
    setHitCount(newHitCount);
    onProgress?.(newHitCount, targetRequired);
    onSuccess?.();

    // Check completion
    if (newHitCount >= targetRequired) {
      finishedRef.current = true;
      audioEngine.playFanfare();

      setTimeout(() => {
        // Star calculation (7 to 10 stars)
        const durationSec = (Date.now() - startTime) / 1000;
        let earnedStars = 10;
        if (misses >= 3) earnedStars = 9;
        if (misses >= 6) earnedStars = 8;
        if (durationSec > targetRequired * 8) earnedStars = Math.max(7, earnedStars - 1);

        const totalAttempts = newHitCount + misses;
        const accuracy = totalAttempts > 0 ? Math.round((newHitCount / totalAttempts) * 100) : 100;

        onComplete({
          gameId: 5,
          stars: earnedStars,
          score: score + earnedPoints + (earnedStars === 10 ? 200 : 100),
          accuracy,
          timeTakenSeconds: Math.round(durationSec),
          correctCount: newHitCount,
          mistakeCount: misses,
          level,
          round,
        });
      }, 700);
      return;
    }

    // Spawn a replacement target after a short delay
    setTimeout(() => {
      if (finishedRef.current) return;
      setTargets((prev) => {
        const remaining = prev.filter((t) => t.id !== target.id);
        return [...remaining, createTarget(nextTargetIdRef.current++)];
      });
    }, 450);
  };

  // Handle missed click on background
  const handleBackgroundClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only trigger if click was directly on background, not on a target
    if ((e.target as HTMLElement).closest('.target-hitbox')) {
      return;
    }
    if (finishedRef.current) return;

    setMisses((prev) => prev + 1);
    setCombo(0);
    audioEngine.playError();
    onMistake?.();

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      addFloatingScore(x, y, 'Bắn hụt rồi! Thử lại nhé!', '#ef4444');
    }
  };

  // Find nearest target for Hint Tier 1
  const nearestTarget = useMemo(() => {
    return targets.find((t) => !t.isHit);
  }, [targets]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onClick={handleBackgroundClick}
      className="relative w-full h-full overflow-hidden select-none cursor-crosshair rounded-2xl bg-gradient-to-b from-sky-300 via-sky-200 to-emerald-200"
    >
      {/* Cartoon Forest & Archery Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        {/* Fluffy clouds */}
        <g fill="#ffffff" opacity="0.85">
          <ellipse cx="18%" cy="12%" rx="70" ry="24" />
          <ellipse cx="22%" cy="10%" rx="45" ry="28" />
          <ellipse cx="15%" cy="14%" rx="40" ry="20" />

          <ellipse cx="78%" cy="16%" rx="80" ry="26" />
          <ellipse cx="83%" cy="13%" rx="50" ry="30" />
          <ellipse cx="73%" cy="18%" rx="45" ry="22" />
        </g>

        {/* Distant Hills */}
        <path d="M 0 350 Q 250 280 500 350 T 1000 350 L 1000 800 L 0 800 Z" fill="#86efac" opacity="0.6" />
        <path d="M 0 420 Q 300 360 650 430 T 1300 420 L 1300 800 L 0 800 Z" fill="#4ade80" opacity="0.75" />

        {/* Lush Green Lawn Ground */}
        <rect x="0" y="70%" width="100%" height="30%" fill="#22c55e" />
        <path d="M 0 70% Q 250 67% 500 70% T 1000 70% L 1000 74% L 0 74% Z" fill="#16a34a" />

        {/* Decorative Flower Tufts & Mushroom Accents */}
        <g opacity="0.8">
          <circle cx="12%" cy="78%" r="7" fill="#fbbf24" />
          <circle cx="11%" cy="77%" r="4" fill="#f43f5e" />
          <circle cx="35%" cy="84%" r="8" fill="#ec4899" />
          <circle cx="36%" cy="83%" r="4" fill="#fef08a" />
          <circle cx="68%" cy="79%" r="7" fill="#38bdf8" />
          <circle cx="88%" cy="82%" r="9" fill="#f59e0b" />
        </g>

        {/* Rainbow Bunting Festive Flags at the top */}
        <path d="M 0 10 Q 500 70 1000 10" fill="none" stroke="#fbbf24" strokeWidth="3" opacity="0.7" />
        {[5, 15, 25, 35, 45, 55, 65, 75, 85, 95].map((pos, idx) => {
          const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7'];
          return (
            <polygon
              key={idx}
              points={`${pos - 2.5},${20 + Math.sin((pos / 100) * Math.PI) * 18} ${pos + 2.5},${20 + Math.sin((pos / 100) * Math.PI) * 18} ${pos},${42 + Math.sin((pos / 100) * Math.PI) * 18}`}
              fill={colors[idx % colors.length]}
              opacity="0.9"
            />
          );
        })}
      </svg>

      {/* Top HUD: Info, Level & Round, Progress Bar, Score & Combo */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-3">
          {/* Level and Round pill */}
          <div className="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-md border-2 border-amber-300 flex items-center gap-2">
            <Target className="w-5 h-5 text-rose-500" />
            <span className="font-extrabold text-blue-900 text-sm">
              Màn {level === 1 ? 'Dễ' : level === 2 ? 'Vừa' : 'Khó'} • Vòng {round}/2
            </span>
          </div>

          {/* Progress counter */}
          <div className="px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur shadow-md border-2 border-emerald-300 flex items-center gap-2">
            <span className="text-xs font-bold text-gray-600">Mục tiêu:</span>
            <span className="font-extrabold text-emerald-600 text-sm">
              {hitCount} / {targetRequired}
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
              className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-white font-black text-xs shadow-lg flex items-center gap-1 border border-white"
            >
              <Zap className="w-4 h-4 fill-current" />
              Combo x{combo}!
            </motion.div>
          )}

          <div className="px-4 py-1.5 rounded-full bg-amber-400 text-amber-950 font-black text-sm shadow-md border-2 border-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-amber-900" />
            {score} điểm
          </div>
        </div>
      </div>

      {/* Overall Progress Bar at Top Border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-black/10 z-30">
        <motion.div
          className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-emerald-400"
          initial={{ width: '0%' }}
          animate={{ width: `${(hitCount / targetRequired) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </div>

      {/* Targets Canvas */}
      {targets.map((target) => {
        if (target.isHit) return null;
        const isHinted = currentHintTier === 1 && nearestTarget?.id === target.id;

        return (
          <div
            key={target.id}
            style={{
              position: 'absolute',
              left: `${target.x}%`,
              top: `${target.y}%`,
              width: `${target.size}px`,
              height: `${target.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="target-hitbox z-10 group"
            onClick={(e) => {
              e.stopPropagation();
              handleTargetHit(target);
            }}
          >
            {/* Pulsating golden aura if Hint Tier 1 is active */}
            {isHinted && (
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 0.9 }}
                className="absolute inset-[-14px] rounded-full border-4 border-amber-400 bg-amber-300/30 shadow-[0_0_25px_rgba(251,191,36,0.8)] pointer-events-none"
              >
                {/* Pointing Hand/Arrow */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-xl animate-bounce">👇</span>
                  <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full shadow">
                    Nháy ở đây!
                  </span>
                </div>
              </motion.div>
            )}

            {/* Target SVG Rendering */}
            <motion.div
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="w-full h-full cursor-pointer relative filter drop-shadow-lg"
            >
              {target.type === 'bullseye' && (
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Stand shadow & wooden post */}
                  <rect x="46" y="70" width="8" height="30" rx="3" fill="#854d0e" />
                  {/* Outer Straw ring */}
                  <circle cx="50" cy="46" r="44" fill="#fef08a" stroke="#ca8a04" strokeWidth="3" />
                  {/* Blue Ring */}
                  <circle cx="50" cy="46" r="34" fill="#38bdf8" stroke="#0284c7" strokeWidth="2.5" />
                  {/* Red Ring */}
                  <circle cx="50" cy="46" r="23" fill="#ef4444" stroke="#b91c1c" strokeWidth="2.5" />
                  {/* Center Bullseye Golden Star */}
                  <circle cx="50" cy="46" r="12" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
                  <path
                    d="M 50 39 L 52 44 L 57 44 L 53 47 L 55 52 L 50 49 L 45 52 L 47 47 L 43 44 L 48 44 Z"
                    fill="#ffffff"
                  />
                </svg>
              )}

              {target.type === 'watermelon' && (
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Watermelon Wedge */}
                  <path
                    d="M 10 35 C 10 75 40 92 85 85 C 80 40 55 15 10 35 Z"
                    fill="#15803d"
                    stroke="#166534"
                    strokeWidth="3"
                  />
                  {/* Rind light green */}
                  <path
                    d="M 16 38 C 16 70 42 85 80 80 C 76 45 52 22 16 38 Z"
                    fill="#bbf7d0"
                  />
                  {/* Juicy Red Flesh */}
                  <path
                    d="M 22 41 C 22 66 45 78 75 74 C 71 49 50 28 22 41 Z"
                    fill="#ef4444"
                  />
                  {/* Seeds */}
                  <ellipse cx="36" cy="52" rx="2" ry="4" fill="#1f2937" transform="rotate(-20 36 52)" />
                  <ellipse cx="50" cy="58" rx="2" ry="4" fill="#1f2937" transform="rotate(10 50 58)" />
                  <ellipse cx="62" cy="62" rx="2" ry="4" fill="#1f2937" transform="rotate(35 62 62)" />
                  <ellipse cx="44" cy="42" rx="2" ry="4" fill="#1f2937" transform="rotate(-10 44 42)" />
                </svg>
              )}

              {target.type === 'pineapple' && (
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Crown Leaves */}
                  <path d="M 50 10 Q 42 28 50 36 Q 58 28 50 10 Z" fill="#22c55e" />
                  <path d="M 40 16 Q 36 30 46 38 Q 42 22 40 16 Z" fill="#16a34a" />
                  <path d="M 60 16 Q 64 30 54 38 Q 58 22 60 16 Z" fill="#16a34a" />
                  {/* Body */}
                  <ellipse cx="50" cy="62" rx="28" ry="32" fill="#eab308" stroke="#ca8a04" strokeWidth="2.5" />
                  {/* Diamond pattern */}
                  <path
                    d="M 32 50 L 68 74 M 32 74 L 68 50 M 26 62 L 74 62 M 50 35 L 50 89"
                    stroke="#a16207"
                    strokeWidth="2"
                    opacity="0.6"
                  />
                  {/* Sweet smile */}
                  <circle cx="43" cy="58" r="3" fill="#713f12" />
                  <circle cx="57" cy="58" r="3" fill="#713f12" />
                  <path d="M 46 66 Q 50 71 54 66" fill="none" stroke="#713f12" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}

              {target.type === 'apple' && (
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Stem & Leaf */}
                  <path d="M 50 30 Q 52 18 58 14" fill="none" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
                  <path d="M 54 20 Q 64 16 68 22 Q 62 26 54 20 Z" fill="#22c55e" />
                  {/* Apple body */}
                  <path
                    d="M 50 34 C 32 30 18 45 22 68 C 26 88 44 92 50 86 C 56 92 74 88 78 68 C 82 45 68 30 50 34 Z"
                    fill="#ef4444"
                    stroke="#b91c1c"
                    strokeWidth="2.5"
                  />
                  {/* Highlight */}
                  <path d="M 32 44 Q 28 58 32 66" fill="none" stroke="#fecaca" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
                </svg>
              )}

              {target.type === 'strawberry' && (
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Green Top */}
                  <path d="M 32 34 L 50 40 L 68 34 L 58 44 L 50 38 L 42 44 Z" fill="#16a34a" />
                  {/* Berry Body */}
                  <path
                    d="M 50 88 C 28 72 24 45 32 38 C 40 32 60 32 68 38 C 76 45 72 72 50 88 Z"
                    fill="#f43f5e"
                    stroke="#be123c"
                    strokeWidth="2.5"
                  />
                  {/* Tiny seeds */}
                  <circle cx="44" cy="50" r="1.5" fill="#fef08a" />
                  <circle cx="56" cy="50" r="1.5" fill="#fef08a" />
                  <circle cx="50" cy="62" r="1.5" fill="#fef08a" />
                  <circle cx="42" cy="70" r="1.5" fill="#fef08a" />
                  <circle cx="58" cy="70" r="1.5" fill="#fef08a" />
                </svg>
              )}

              {target.type === 'star' && (
                <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
                  {/* Rainbow Star */}
                  <path
                    d="M 50 12 L 61 36 L 88 38 L 67 56 L 74 82 L 50 68 L 26 82 L 33 56 L 12 38 L 39 36 Z"
                    fill="url(#starGrad)"
                    stroke="#ca8a04"
                    strokeWidth="2.5"
                  />
                  <defs>
                    <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#fde047" />
                      <stop offset="50%" stopColor="#f59e0b" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                  {/* Sparkling face */}
                  <circle cx="43" cy="48" r="3" fill="#78350f" />
                  <circle cx="57" cy="48" r="3" fill="#78350f" />
                  <path d="M 46 56 Q 50 60 54 56" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}

              {/* Point badge pill under target */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] shadow border border-white whitespace-nowrap">
                +{target.points}
              </div>
            </motion.div>
          </div>
        );
      })}

      {/* Bursting Splat Particles on Hit */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.emoji ? 'transparent' : p.color,
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
          className="z-30 flex items-center justify-center font-bold"
        >
          {p.emoji && <span style={{ fontSize: `${p.size * 1.5}px` }}>{p.emoji}</span>}
        </div>
      ))}

      {/* Floating Score Labels */}
      <AnimatePresence>
        {floatingScores.map((fs) => (
          <motion.div
            key={fs.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -45, scale: 1.25 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${fs.x}%`,
              top: `${fs.y}%`,
              color: fs.color,
              pointerEvents: 'none',
            }}
            className="z-40 font-black text-sm md:text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] whitespace-nowrap"
          >
            {fs.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Hint Tier 2 Speech Bubble */}
      {currentHintTier === 2 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-amber-50 border-4 border-amber-400 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-3xl">🎯</span>
          <div>
            <p className="font-extrabold text-amber-900 text-sm">
              Mẹo từ Cung Thủ Nhí:
            </p>
            <p className="text-xs font-bold text-amber-800">
              Rê chuột vào tâm bia hoặc quả hoa quả rồi <span className="text-rose-600 underline">nháy chuột trái 1 lần</span> để bắn tên nhé!
            </p>
          </div>
        </div>
      )}

      {/* Hint Tier 3: Ghost Cursor Animation */}
      {ghostCursor.active && (
        <div
          style={{
            position: 'absolute',
            left: `${ghostCursor.x}%`,
            top: `${ghostCursor.y}%`,
            transform: 'translate(-30%, -30%)',
            transition: 'all 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)',
            pointerEvents: 'none',
          }}
          className="z-50 flex flex-col items-center"
        >
          <div className="relative">
            {/* Cartoon Mouse with Left Button Highlighted */}
            <div className={`w-10 h-14 bg-white border-2 border-indigo-600 rounded-t-xl rounded-b-2xl shadow-2xl relative overflow-hidden ${ghostCursor.clicking ? 'scale-90' : ''}`}>
              {/* Left Button highlighted in red/amber */}
              <div className="absolute top-0 left-0 w-1/2 h-6 bg-rose-500 border-r border-b border-indigo-600 flex items-center justify-center">
                <span className="text-[8px] font-black text-white">CLICK</span>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-6 bg-gray-200 border-b border-indigo-600" />
              {/* Scroll wheel */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-indigo-700 rounded-full" />
            </div>

            {/* Click Ripple Effect */}
            {ghostCursor.clicking && (
              <motion.div
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 2.5, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute -top-3 -left-3 w-16 h-16 rounded-full border-4 border-rose-500 bg-rose-400/30"
              />
            )}
          </div>
          <span className="mt-1 px-2 py-0.5 rounded-full bg-indigo-900 text-white font-extrabold text-[10px] shadow">
            Xem mẫu nháy chuột trái!
          </span>
        </div>
      )}

      {/* Custom Crosshair Cursor Reticle Following Mouse */}
      <div
        style={{
          position: 'absolute',
          left: `${mousePos.x}%`,
          top: `${mousePos.y}%`,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
        className="z-40 w-12 h-12 flex items-center justify-center"
      >
        <div className="relative w-full h-full flex items-center justify-center">
          {/* Animated Target Rings */}
          <div className="w-8 h-8 rounded-full border-2 border-rose-500/80 bg-rose-500/10 shadow-[0_0_10px_rgba(244,63,94,0.4)]" />
          <div className="absolute w-2 h-2 rounded-full bg-rose-600" />
          {/* Crosshair lines */}
          <div className="absolute -top-1 w-0.5 h-2.5 bg-rose-600" />
          <div className="absolute -bottom-1 w-0.5 h-2.5 bg-rose-600" />
          <div className="absolute -left-1 w-2.5 h-0.5 bg-rose-600" />
          <div className="absolute -right-1 w-2.5 h-0.5 bg-rose-600" />
        </div>
      </div>
    </div>
  );
};
