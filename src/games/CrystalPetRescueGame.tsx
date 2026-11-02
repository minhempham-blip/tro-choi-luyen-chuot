import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Award, Zap, ShieldCheck } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface PetInfo {
  name: string;
  emoji: string;
  color: string;
  soundName: string;
}

const PET_ROSTER: PetInfo[] = [
  { name: 'Mèo Lông Xù', emoji: '🐱', color: '#fbcfe8', soundName: 'Meo meo!' },
  { name: 'Cún Cưng', emoji: '🐶', color: '#fed7aa', soundName: 'Gâu gâu!' },
  { name: 'Thỏ Ngọc', emoji: '🐰', color: '#fef08a', soundName: 'Cà rốt ơi!' },
  { name: 'Gấu Trúc', emoji: '🐼', color: '#e2e8f0', soundName: 'Măm măm!' },
  { name: 'Rồng Con Phép Thuật', emoji: '🐲', color: '#bbf7d0', soundName: 'Phù phù!' },
  { name: 'Kỳ Lân Cầu Vồng', emoji: '🦄', color: '#e9d5ff', soundName: 'Lấp lánh!' },
  { name: 'Chim Cánh Cụt', emoji: '🐧', color: '#bae6fd', soundName: 'Vui quá!' },
  { name: 'Cáo Đỏ Tinh Nghịch', emoji: '🦊', color: '#ffedd5', soundName: 'Hi hi!' },
  { name: 'Gấu Con Ngọt Ngào', emoji: '🐻', color: '#fde68a', soundName: 'Mật ong!' },
  { name: 'Hamster Đáng Yêu', emoji: '🐹', color: '#fed7aa', soundName: 'Chít chít!' },
];

interface CrystalOrb {
  id: number;
  pet: PetInfo;
  x: number; // percentage 10% - 90%
  y: number; // percentage 18% - 78%
  baseX: number;
  baseY: number;
  size: number;
  speed: number;
  amplitude: number;
  phase: number;
  isFirstClick: boolean;
  firstClickTime: number;
  isRescued: boolean;
  crackLevel: number; // 0: intact, 1: cracked, 2: shattered
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface ShardParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
}

export const CrystalPetRescueGame: React.FC<GameComponentProps> = ({
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
  const clickTimerRef = useRef<Record<number, NodeJS.Timeout>>({});

  // Required pets to rescue per round
  const targetRequired = useMemo(() => {
    if (easyMode) return 4;
    if (level === 1) return round === 1 ? 4 : 6;
    if (level === 2) return round === 1 ? 6 : 8;
    return round === 1 ? 8 : 10;
  }, [level, round, easyMode]);

  // Double click threshold in milliseconds
  const dblClickWindow = useMemo(() => {
    if (easyMode) return 800;
    if (level === 1) return round === 1 ? 750 : 700;
    if (level === 2) return round === 1 ? 600 : 550;
    return round === 1 ? 500 : 450;
  }, [level, round, easyMode]);

  const [rescuedCount, setRescuedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [misses, setMisses] = useState(0);
  const [startTime] = useState(Date.now());
  const [orbs, setOrbs] = useState<CrystalOrb[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [shards, setShards] = useState<ShardParticle[]>([]);

  // Ghost demonstration cursor for Tier 3 hint
  const [ghostCursor, setGhostCursor] = useState<{
    x: number;
    y: number;
    active: boolean;
    clickCount: number;
  }>({
    x: 50,
    y: 50,
    active: false,
    clickCount: 0,
  });

  // Base orb size
  const orbBaseSize = useMemo(() => {
    if (easyMode) return 96;
    if (level === 1) return 88;
    if (level === 2) return 76;
    return 66;
  }, [level, easyMode]);

  // Initialize orbs
  useEffect(() => {
    finishedRef.current = false;
    const list: CrystalOrb[] = [];
    const count = targetRequired;

    // Distribute nicely across grid positions
    for (let i = 0; i < count; i++) {
      const pet = PET_ROSTER[i % PET_ROSTER.length];
      const cols = count <= 4 ? 2 : count <= 6 ? 3 : 4;
      const row = Math.floor(i / cols);
      const col = i % cols;

      const baseX = cols === 2 ? 30 + col * 40 : cols === 3 ? 20 + col * 30 : 15 + col * 24;
      const baseY = count <= 4 ? 38 + row * 28 : count <= 6 ? 32 + row * 26 : 28 + row * 24;

      const movementMult = level === 1 ? (round === 1 ? 0 : 0.3) : level === 2 ? 0.8 : 1.4;

      list.push({
        id: i,
        pet,
        x: baseX,
        y: baseY,
        baseX,
        baseY,
        size: orbBaseSize,
        speed: (0.5 + Math.random() * 0.5) * movementMult,
        amplitude: (5 + Math.random() * 8) * (level === 1 && round === 1 ? 0 : 1),
        phase: Math.random() * Math.PI * 2,
        isFirstClick: false,
        firstClickTime: 0,
        isRescued: false,
        crackLevel: 0,
      });
    }

    setOrbs(list);
    setRescuedCount(0);

    return () => {
      // Clear all active timers
      Object.values(clickTimerRef.current).forEach((t) => clearTimeout(t));
      clickTimerRef.current = {};
    };
  }, [level, round, targetRequired, orbBaseSize]);

  // Animation loop for gentle floating orbs and sparkling glass shards
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      setOrbs((prev) =>
        prev.map((orb) => {
          if (orb.isRescued || orb.amplitude === 0) return orb;

          const newPhase = orb.phase + orb.speed * dt * 2;
          let newX = orb.baseX + Math.sin(newPhase) * orb.amplitude;
          let newY = orb.baseY + Math.cos(newPhase * 0.9) * (orb.amplitude * 0.5);

          return {
            ...orb,
            x: Math.max(10, Math.min(90, newX)),
            y: Math.max(16, Math.min(84, newY)),
            phase: newPhase,
          };
        })
      );

      // Animate crystal shards
      setShards((prev) =>
        prev
          .map((s) => ({
            ...s,
            x: s.x + s.vx * dt * 60,
            y: s.y + s.vy * dt * 60 + 0.3,
            rotation: s.rotation + 5,
            size: s.size * 0.96,
          }))
          .filter((s) => s.size > 2)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Spawn crystal fragments on rescue
  const spawnShards = (x: number, y: number) => {
    const shardColors = ['#e0e7ff', '#c7d2fe', '#fbcfe8', '#fed7aa', '#fde047', '#ffffff'];
    const newShards: ShardParticle[] = [];

    for (let i = 0; i < 18; i++) {
      const angle = (Math.PI * 2 * i) / 18 + (Math.random() - 0.5);
      const speed = 2.5 + Math.random() * 4.5;
      newShards.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: shardColors[i % shardColors.length],
        size: 8 + Math.random() * 10,
        rotation: Math.random() * 360,
      });
    }

    setShards((prev) => [...prev.slice(-40), ...newShards]);
  };

  // Add floating message
  const addFloatingScore = (x: number, y: number, text: string, color: string) => {
    const id = Date.now() + Math.random();
    setFloatingScores((prev) => [...prev, { id, x, y, text, color }]);
    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((s) => s.id !== id));
    }, 1200);
  };

  // Triggered when a complete double-click is successful
  const handleSuccessfulRescue = (orb: CrystalOrb, isDemo = false) => {
    if (finishedRef.current || orb.isRescued) return;

    // Clear timeout for this orb
    if (clickTimerRef.current[orb.id]) {
      clearTimeout(clickTimerRef.current[orb.id]);
      delete clickTimerRef.current[orb.id];
    }

    // Sound effects
    audioEngine.playDblClick();
    audioEngine.playEggCrack();
    audioEngine.playSuccess();
    audioEngine.playStarChime(rescuedCount % 10);

    // Shatter crystal & rescue pet
    setOrbs((prev) =>
      prev.map((o) =>
        o.id === orb.id
          ? { ...o, isRescued: true, crackLevel: 2, isFirstClick: false }
          : o
      )
    );

    spawnShards(orb.x, orb.y);

    const newCombo = isDemo ? combo : combo + 1;
    setCombo(newCombo);
    const comboBonus = newCombo > 1 ? (newCombo - 1) * 25 : 0;
    const earnedPoints = 100 + comboBonus;
    setScore((prev) => prev + earnedPoints);

    const comboText = newCombo > 1 ? ` (+${comboBonus} Combo x${newCombo}!)` : '';
    addFloatingScore(
      orb.x,
      orb.y,
      `+${earnedPoints} Giải cứu ${orb.pet.name}! 🎉${comboText}`,
      '#a855f7'
    );

    const newRescued = rescuedCount + 1;
    setRescuedCount(newRescued);
    onProgress?.(newRescued, targetRequired);
    onSuccess?.();

    // Check completion
    if (newRescued >= targetRequired) {
      finishedRef.current = true;
      audioEngine.playFanfare();

      setTimeout(() => {
        const durationSec = (Date.now() - startTime) / 1000;
        let earnedStars = 10;
        if (misses >= 3) earnedStars = 9;
        if (misses >= 6) earnedStars = 8;
        if (durationSec > targetRequired * 9) earnedStars = Math.max(7, earnedStars - 1);

        const totalActions = newRescued + misses;
        const accuracy = totalActions > 0 ? Math.round((newRescued / totalActions) * 100) : 100;

        onComplete({
          gameId: 10,
          stars: earnedStars,
          score: score + earnedPoints + (earnedStars === 10 ? 250 : 120),
          accuracy,
          timeTakenSeconds: Math.round(durationSec),
          correctCount: newRescued,
          mistakeCount: misses,
          level,
          round,
        });
      }, 900);
    }
  };

  // Single click on orb: Start or complete double click
  const handleOrbClick = (orb: CrystalOrb, e: React.MouseEvent) => {
    e.stopPropagation();
    if (finishedRef.current || orb.isRescued) return;

    const now = Date.now();

    if (orb.isFirstClick && now - orb.firstClickTime <= dblClickWindow) {
      // SUCCESSFUL DOUBLE CLICK!
      handleSuccessfulRescue(orb);
    } else {
      // First click of the pair
      audioEngine.playClick();
      audioEngine.playPop();

      setOrbs((prev) =>
        prev.map((o) =>
          o.id === orb.id
            ? { ...o, isFirstClick: true, firstClickTime: now, crackLevel: 1 }
            : { ...o, isFirstClick: false, crackLevel: 0 }
        )
      );

      // Start countdown timer for second click
      if (clickTimerRef.current[orb.id]) {
        clearTimeout(clickTimerRef.current[orb.id]);
      }

      clickTimerRef.current[orb.id] = setTimeout(() => {
        // Missed the double-click window
        if (finishedRef.current) return;
        setOrbs((prev) =>
          prev.map((o) =>
            o.id === orb.id ? { ...o, isFirstClick: false, crackLevel: 0 } : o
          )
        );

        setMisses((m) => m + 1);
        setCombo(0);
        audioEngine.playError();
        addFloatingScore(orb.x, orb.y, 'Bấm chậm rồi! Nháy 2 lần nhanh nhé!', '#ef4444');
        onMistake?.();
      }, dblClickWindow);
    }
  };

  // Native onDoubleClick fallback (some mice or browsers fire standard dblclick)
  const handleOrbDblClick = (orb: CrystalOrb, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!orb.isRescued) {
      handleSuccessfulRescue(orb);
    }
  };

  // Click on background
  const handleBackgroundClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.crystal-orb-hitbox')) return;
    if (finishedRef.current) return;

    setMisses((prev) => prev + 1);
    setCombo(0);
    audioEngine.playError();
    onMistake?.();

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      addFloatingScore(x, y, 'Nháy đúp vào quả cầu pha lê nhé!', '#f59e0b');
    }
  };

  // Tier 3 Hint: Demonstration ghost cursor
  useEffect(() => {
    if (currentHintTier === 3 && orbs.length > 0) {
      const targetOrb = orbs.find((o) => !o.isRescued);
      if (targetOrb) {
        setGhostCursor({ x: 50, y: 85, active: true, clickCount: 0 });

        // Glide towards orb
        const t1 = setTimeout(() => {
          setGhostCursor({ x: targetOrb.x, y: targetOrb.y, active: true, clickCount: 0 });
        }, 300);

        // Click 1
        const t2 = setTimeout(() => {
          setGhostCursor({ x: targetOrb.x, y: targetOrb.y, active: true, clickCount: 1 });
          audioEngine.playClick();
        }, 1200);

        // Click 2 (Double Click Complete!)
        const t3 = setTimeout(() => {
          setGhostCursor({ x: targetOrb.x, y: targetOrb.y, active: true, clickCount: 2 });
          handleSuccessfulRescue(targetOrb, true);
        }, 1450);

        // Dismiss
        const t4 = setTimeout(() => {
          setGhostCursor((prev) => ({ ...prev, active: false }));
        }, 2300);

        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
          clearTimeout(t4);
        };
      }
    }
  }, [currentHintTier]);

  const nearestOrb = useMemo(() => {
    return orbs.find((o) => !o.isRescued);
  }, [orbs]);

  return (
    <div
      ref={containerRef}
      onClick={handleBackgroundClick}
      className="relative w-full h-full overflow-hidden select-none cursor-pointer rounded-2xl bg-gradient-to-b from-indigo-900 via-purple-900 to-indigo-950"
    >
      {/* Magical Enchanted Forest at Twilight Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
        {/* Twinkling background stars */}
        <g fill="#ffffff" opacity="0.6">
          <circle cx="10%" cy="15%" r="2" />
          <circle cx="25%" cy="8%" r="1.5" />
          <circle cx="45%" cy="12%" r="2.5" />
          <circle cx="65%" cy="6%" r="2" />
          <circle cx="85%" cy="14%" r="1.5" />
          <circle cx="92%" cy="25%" r="2.5" />
          <circle cx="15%" cy="32%" r="1.5" />
          <circle cx="75%" cy="35%" r="2" />
        </g>

        {/* Crescent Moon */}
        <path
          d="M 880 70 A 40 40 0 1 0 920 120 A 32 32 0 1 1 880 70 Z"
          fill="#fef08a"
          opacity="0.9"
          filter="drop-shadow(0 0 12px rgba(254, 240, 138, 0.8))"
        />

        {/* Giant Magical Glowing Mushrooms & Fairy Flora */}
        <g opacity="0.45">
          {/* Left magical tree */}
          <path d="M 0 450 Q 80 400 120 800 L 0 800 Z" fill="#312e81" />
          <circle cx="110" cy="420" r="120" fill="#4338ca" />
          {/* Right magical tree */}
          <path d="M 1000 480 Q 920 420 880 800 L 1000 800 Z" fill="#312e81" />
          <circle cx="890" cy="450" r="110" fill="#4338ca" />
        </g>

        {/* Bioluminescent Meadow Grass */}
        <path d="M 0 720 Q 250 680 500 720 T 1000 720 L 1000 800 L 0 800 Z" fill="#1e1b4b" />
        <path d="M 0 750 Q 300 710 700 760 T 1000 750 L 1000 800 L 0 800 Z" fill="#2e1065" />

        {/* Fireflies floating in background */}
        <g>
          <circle cx="18%" cy="65%" r="3" fill="#a7f3d0" opacity="0.8" />
          <circle cx="42%" cy="75%" r="4" fill="#fef08a" opacity="0.9" />
          <circle cx="62%" cy="68%" r="3" fill="#fbcfe8" opacity="0.8" />
          <circle cx="82%" cy="72%" r="3.5" fill="#bae6fd" opacity="0.85" />
        </g>
      </svg>

      {/* Top HUD: Info, Level & Round, Progress Bar, Score & Combo */}
      <div className="absolute top-3 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
        <div className="flex items-center gap-3">
          {/* Level and Round pill */}
          <div className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md shadow-lg border border-purple-300/40 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-300" />
            <span className="font-extrabold text-white text-sm">
              Màn {level === 1 ? 'Dễ' : level === 2 ? 'Vừa' : 'Khó'} • Vòng {round}/2
            </span>
          </div>

          {/* Progress counter */}
          <div className="px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md shadow-lg border border-emerald-300/40 flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-200">Đã giải cứu:</span>
            <span className="font-extrabold text-emerald-300 text-sm">
              {rescuedCount} / {targetRequired} bạn thú
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
              className="px-3 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-black text-xs shadow-lg flex items-center gap-1 border border-white/50"
            >
              <Zap className="w-4 h-4 fill-current text-yellow-300" />
              Combo x{combo}!
            </motion.div>
          )}

          <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-purple-950 font-black text-sm shadow-md border-2 border-white flex items-center gap-1.5">
            <Award className="w-4 h-4 text-purple-900" />
            {score} điểm
          </div>
        </div>
      </div>

      {/* Overall Progress Bar at Top Border */}
      <div className="absolute top-0 left-0 right-0 h-2 bg-black/30 z-30">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-400 via-pink-500 to-emerald-400"
          initial={{ width: '0%' }}
          animate={{ width: `${(rescuedCount / targetRequired) * 100}%` }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        />
      </div>

      {/* Crystal Orbs Canvas */}
      {orbs.map((orb) => {
        const isHinted = currentHintTier === 1 && nearestOrb?.id === orb.id;

        return (
          <div
            key={orb.id}
            style={{
              position: 'absolute',
              left: `${orb.x}%`,
              top: `${orb.y}%`,
              width: `${orb.size}px`,
              height: `${orb.size}px`,
              transform: 'translate(-50%, -50%)',
            }}
            className="crystal-orb-hitbox z-10 group"
            onClick={(e) => handleOrbClick(orb, e)}
            onDoubleClick={(e) => handleOrbDblClick(orb, e)}
          >
            {/* Hint Tier 1: Double Flash Aura */}
            {isHinted && !orb.isRescued && (
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="absolute inset-[-14px] rounded-full border-4 border-pink-400 bg-pink-400/25 shadow-[0_0_30px_rgba(244,114,182,0.9)] pointer-events-none"
              >
                <div className="absolute -top-11 left-1/2 -translate-x-1/2 flex flex-col items-center">
                  <span className="text-xl animate-bounce">👇</span>
                  <span className="text-[10px] font-black bg-pink-500 text-white px-2.5 py-0.5 rounded-full shadow-lg whitespace-nowrap">
                    Nháy đúp 2 lần nhanh!
                  </span>
                </div>
              </motion.div>
            )}

            {/* Crack State Reminder Wave if first click was registered */}
            {orb.isFirstClick && !orb.isRescued && (
              <motion.div
                initial={{ scale: 0.9, opacity: 1 }}
                animate={{ scale: 1.4, opacity: 0 }}
                transition={{ repeat: Infinity, duration: dblClickWindow / 1000 }}
                className="absolute inset-[-10px] rounded-full border-4 border-amber-300 pointer-events-none"
              />
            )}

            {/* Interactive Orb Container */}
            <motion.div
              whileHover={{ scale: orb.isRescued ? 1 : 1.1 }}
              whileTap={{ scale: orb.isRescued ? 1 : 0.92 }}
              animate={
                orb.isFirstClick
                  ? { rotate: [-4, 4, -4, 4, 0], scale: 1.05 }
                  : {}
              }
              transition={{ duration: 0.2 }}
              className="w-full h-full relative flex items-center justify-center"
            >
              {!orb.isRescued ? (
                // INTRACT OR CRACKED CRYSTAL ORB
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Glowing Pedestal Base under orb */}
                  <div className="absolute -bottom-2 w-3/4 h-3 bg-purple-500/40 rounded-full blur-[3px]" />

                  {/* Spherical Crystal Orb SVG */}
                  <svg viewBox="0 0 100 100" className="w-full h-full filter drop-shadow-[0_4px_16px_rgba(168,85,247,0.5)]">
                    <defs>
                      <radialGradient id={`orbGrad-${orb.id}`} cx="35%" cy="30%" r="70%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
                        <stop offset="40%" stopColor="#c084fc" stopOpacity="0.5" />
                        <stop offset="80%" stopColor="#7e22ce" stopOpacity="0.75" />
                        <stop offset="100%" stopColor="#3b0764" stopOpacity="0.9" />
                      </radialGradient>
                    </defs>

                    {/* Outer sphere glass */}
                    <circle cx="50" cy="50" r="46" fill={`url(#orbGrad-${orb.id})`} stroke="#e9d5ff" strokeWidth="2.5" />

                    {/* Specular high-light arc */}
                    <ellipse cx="38" cy="28" rx="16" ry="9" fill="#ffffff" opacity="0.65" transform="rotate(-25 38 28)" />
                    <circle cx="30" cy="24" r="3" fill="#ffffff" opacity="0.8" />

                    {/* Crack lines if first click occurred */}
                    {orb.crackLevel >= 1 && (
                      <g stroke="#fef08a" strokeWidth="2.5" strokeLinecap="round" opacity="0.95" filter="drop-shadow(0 0 4px #fbbf24)">
                        <path d="M 50 15 L 45 32 L 54 44 L 46 62 L 52 82" />
                        <path d="M 45 32 L 32 38 L 22 34" />
                        <path d="M 54 44 L 68 50 L 78 46" />
                      </g>
                    )}
                  </svg>

                  {/* Trapped Cute Pet Emoji inside orb */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.span
                      animate={{ y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                      style={{ fontSize: `${orb.size * 0.44}px` }}
                      className="filter drop-shadow-md select-none"
                    >
                      {orb.pet.emoji}
                    </motion.span>
                  </div>

                  {/* First Click "Tách 1!" Badge Indicator */}
                  {orb.isFirstClick && (
                    <motion.div
                      initial={{ scale: 0.5, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-xl border border-white whitespace-nowrap animate-pulse"
                    >
                      ⚡ Nháy thêm cái nữa!
                    </motion.div>
                  )}
                </div>
              ) : (
                // RESCUED PET - CELEBRATING & WAVING
                <motion.div
                  initial={{ scale: 0.6, y: 20 }}
                  animate={{ scale: [1, 1.25, 1.1], y: -15 }}
                  transition={{ duration: 0.6, ease: 'backOut' }}
                  className="relative flex flex-col items-center pointer-events-none"
                >
                  {/* Floating hearts */}
                  <div className="absolute -top-6 flex gap-1">
                    <Heart className="w-4 h-4 text-pink-400 fill-pink-400 animate-bounce" />
                    <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                  </div>

                  <span style={{ fontSize: `${orb.size * 0.56}px` }}>
                    {orb.pet.emoji}
                  </span>

                  <span className="mt-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white font-extrabold text-[10px] shadow-lg whitespace-nowrap border border-white">
                    {orb.pet.name}
                  </span>
                </motion.div>
              )}
            </motion.div>
          </div>
        );
      })}

      {/* Exploding Crystal Shard Particles */}
      {shards.map((s) => (
        <div
          key={s.id}
          style={{
            position: 'absolute',
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            borderRadius: s.size > 5 ? '3px' : '50%',
            transform: `translate(-50%, -50%) rotate(${s.rotation}deg)`,
            pointerEvents: 'none',
          }}
          className="z-30 filter drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        />
      ))}

      {/* Floating Score Popups */}
      <AnimatePresence>
        {floatingScores.map((fs) => (
          <motion.div
            key={fs.id}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -45, scale: 1.2 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              left: `${fs.x}%`,
              top: `${fs.y}%`,
              color: fs.color,
              pointerEvents: 'none',
            }}
            className="z-40 font-black text-sm md:text-base drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] whitespace-nowrap"
          >
            {fs.text}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Bottom Educational Double-Click Guide Bar */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-5 py-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-3 z-20 pointer-events-none">
        <div className="w-8 h-10 rounded-lg border-2 border-pink-400 bg-white/20 flex flex-col items-center justify-start p-1 relative overflow-hidden">
          {/* Mouse left button blinking */}
          <div className="w-3.5 h-4 bg-pink-500 rounded-sm self-start animate-ping opacity-75" />
          <div className="w-3.5 h-4 bg-pink-500 rounded-sm self-start absolute top-1 left-1" />
        </div>
        <div>
          <p className="text-white font-extrabold text-xs">
            Bấm ngón trỏ 2 lần thật nhanh liên tiếp: <span className="text-pink-300">TÁCH - TÁCH</span>
          </p>
          <p className="text-purple-200 text-[11px]">
            để phá vỡ lớp pha lê và giải cứu bạn thú nhé!
          </p>
        </div>
      </div>

      {/* Hint Tier 2 Speech Bubble */}
      {currentHintTier === 2 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-40 bg-purple-950/90 border-4 border-pink-400 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-3xl">🔮</span>
          <div>
            <p className="font-extrabold text-pink-300 text-sm">
              Mẹo từ Thần Rừng:
            </p>
            <p className="text-xs font-bold text-white">
              Em rê chuột vào quả cầu pha lê rồi <span className="text-amber-300 underline font-black">nháy đúp chuột 2 lần thật nhanh liên tiếp</span> nhé!
            </p>
          </div>
        </div>
      )}

      {/* Hint Tier 3: Ghost Mouse Double-Click Demonstration */}
      {ghostCursor.active && (
        <div
          style={{
            position: 'absolute',
            left: `${ghostCursor.x}%`,
            top: `${ghostCursor.y}%`,
            transform: 'translate(-30%, -30%)',
            transition: 'all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)',
            pointerEvents: 'none',
          }}
          className="z-50 flex flex-col items-center"
        >
          <div className="relative">
            {/* Cartoon Mouse */}
            <div className={`w-11 h-16 bg-white border-2 border-pink-500 rounded-t-xl rounded-b-2xl shadow-2xl relative overflow-hidden ${ghostCursor.clickCount > 0 ? 'scale-90' : ''}`}>
              {/* Left Button highlighted in bright pink */}
              <div className="absolute top-0 left-0 w-1/2 h-7 bg-pink-500 border-r border-b border-pink-600 flex items-center justify-center">
                <span className="text-[8px] font-black text-white">
                  {ghostCursor.clickCount === 1 ? '1' : ghostCursor.clickCount === 2 ? '2' : 'ĐÚP'}
                </span>
              </div>
              <div className="absolute top-0 right-0 w-1/2 h-7 bg-gray-200 border-b border-pink-600" />
              {/* Scroll wheel */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-1.5 h-3.5 bg-pink-700 rounded-full" />
            </div>

            {/* Double Tap Ripple Effect */}
            {ghostCursor.clickCount > 0 && (
              <motion.div
                initial={{ scale: 0.6, opacity: 1 }}
                animate={{ scale: 2.6, opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="absolute -top-3 -left-3 w-16 h-16 rounded-full border-4 border-pink-400 bg-pink-400/40"
              />
            )}
          </div>
          <span className="mt-1 px-2.5 py-0.5 rounded-full bg-pink-900 text-white font-extrabold text-[10px] shadow border border-pink-300">
            Xem mẫu nháy đúp: Tách - Tách!
          </span>
        </div>
      )}
    </div>
  );
};
