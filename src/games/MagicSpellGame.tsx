import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Wand2, Flame, Droplets, Flower2, Star, Crown, Zap } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface SpellOption {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
}

const ALL_SPELLS: Record<string, SpellOption> = {
  bloom: { id: 'bloom', name: 'Phép Nở Hoa', emoji: '🌸', color: '#ec4899', bgColor: 'bg-pink-100 hover:bg-pink-200 border-pink-400' },
  fire: { id: 'fire', name: 'Phép Ngọn Lửa', emoji: '🔥', color: '#f97316', bgColor: 'bg-orange-100 hover:bg-orange-200 border-orange-400' },
  water: { id: 'water', name: 'Phép Nước Mát', emoji: '💧', color: '#38bdf8', bgColor: 'bg-sky-100 hover:bg-sky-200 border-sky-400' },
  star: { id: 'star', name: 'Phép Tinh Tú', emoji: '⭐', color: '#fbbf24', bgColor: 'bg-amber-100 hover:bg-amber-200 border-amber-400' },
  crown: { id: 'crown', name: 'Phép Hoàng Gia', emoji: '👑', color: '#a855f7', bgColor: 'bg-purple-100 hover:bg-purple-200 border-purple-400' },
};

interface TargetObject {
  id: number;
  name: string;
  beforeEmoji: string;
  afterEmoji: string;
  requiredSpellId: string;
  transformationText: string;
  x: number; // percentage
  y: number; // percentage
  isTransformed: boolean;
}

interface SpellParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  emoji?: string;
}

export const MagicSpellGame: React.FC<GameComponentProps> = ({
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

  // Targets needed per round
  const targetRequired = useMemo(() => {
    if (easyMode) return 3;
    if (level === 1) return round === 1 ? 3 : 4;
    if (level === 2) return round === 1 ? 5 : 6;
    return round === 1 ? 7 : 8;
  }, [level, round, easyMode]);

  // Available spells on the magic ring based on level
  const activeSpellKeys = useMemo(() => {
    if (level === 1) return ['bloom', 'star', 'fire'];
    if (level === 2) return ['bloom', 'star', 'fire', 'water'];
    return ['bloom', 'star', 'fire', 'water', 'crown'];
  }, [level]);

  // Target objects pool per level & round
  const targetPool = useMemo<TargetObject[]>(() => {
    const list: TargetObject[] = [
      { id: 1, name: 'Quả Bí Ngô', beforeEmoji: '🎃', afterEmoji: '🏰✨', requiredSpellId: 'crown', transformationText: 'Hóa thành Cỗ xe Hoàng gia!', x: 25, y: 35, isTransformed: false },
      { id: 2, name: 'Hạt Mầm Ngủ Say', beforeEmoji: '🌱', afterEmoji: '🌻💖', requiredSpellId: 'bloom', transformationText: 'Nở thành Hoa Hướng Dương!', x: 50, y: 30, isTransformed: false },
      { id: 3, name: 'Cây Chổi Cũ', beforeEmoji: '🧹', afterEmoji: '🧹💫', requiredSpellId: 'star', transformationText: 'Biến thành Chổi Thần Bay Lượn!', x: 75, y: 35, isTransformed: false },
      { id: 4, name: 'Cây Nến Tắt', beforeEmoji: '🕯️', afterEmoji: '🔥✨', requiredSpellId: 'fire', transformationText: 'Thắp sáng Ngọn Lửa Phép Thuật!', x: 30, y: 65, isTransformed: false },
      { id: 5, name: 'Bình Đất Khô', beforeEmoji: '🏺', afterEmoji: '⛲💧', requiredSpellId: 'water', transformationText: 'Phun trào Dòng Suối Pha Lê!', x: 70, y: 65, isTransformed: false },
      { id: 6, name: 'Chú Cóc Xanh', beforeEmoji: '🐸', afterEmoji: '👑🐸', requiredSpellId: 'crown', transformationText: 'Hóa thành Vua Ếch Đội Vương Miện!', x: 50, y: 70, isTransformed: false },
      { id: 7, name: 'Cành Khô Cằn', beforeEmoji: '🪵', afterEmoji: '🌸🌺', requiredSpellId: 'bloom', transformationText: 'Nở bung Trăm Hoa Khoe Sắc!', x: 20, y: 50, isTransformed: false },
      { id: 8, name: 'Viên Đá Xám', beforeEmoji: '🪨', afterEmoji: '💎✨', requiredSpellId: 'star', transformationText: 'Biến thành Kim Cương Tinh Tú!', x: 80, y: 50, isTransformed: false },
    ];

    // Filter to spells available in this level
    const compatible = list.filter((item) => activeSpellKeys.includes(item.requiredSpellId));
    // If not enough compatible, adapt spells to available ones
    const adapted = list.slice(0, targetRequired).map((item, idx) => {
      const spellKey = activeSpellKeys[idx % activeSpellKeys.length];
      return {
        ...item,
        id: idx + 1,
        requiredSpellId: spellKey,
      };
    });

    return adapted;
  }, [targetRequired, activeSpellKeys]);

  const [targets, setTargets] = useState<TargetObject[]>([]);
  const [transformedCount, setTransformedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [particles, setParticles] = useState<SpellParticle[]>([]);

  // Magic Spell Ring Menu state
  const [activeMenu, setActiveMenu] = useState<{
    targetId: number;
    x: number; // percentage
    y: number; // percentage
  } | null>(null);

  // Left-click warning message if student left-clicks before opening menu
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Ghost demonstration cursor for Tier 3 hint
  const [ghostCursor, setGhostCursor] = useState<{
    x: number;
    y: number;
    active: boolean;
    state: 'flying' | 'right_click' | 'selecting';
  }>({
    x: 50,
    y: 50,
    active: false,
    state: 'flying',
  });

  // Current target object for next transformation
  const currentTarget = useMemo(() => {
    return targets.find((t) => !t.isTransformed);
  }, [targets]);

  // Initialize targets
  useEffect(() => {
    finishedRef.current = false;
    setTargets(targetPool);
    setTransformedCount(0);
    setScore(0);
    setCombo(0);
    setMistakes(0);
    setActiveMenu(null);
    setWarningMessage(null);
    setParticles([]);
  }, [targetPool]);

  // Particle physics updates
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.14,
            size: Math.max(0, p.size - 0.35),
          }))
          .filter((p) => p.size > 1)
      );
    }, 25);
    return () => clearInterval(timer);
  }, [particles.length]);

  // Clear warning message after delay
  useEffect(() => {
    if (!warningMessage) return;
    const timer = setTimeout(() => setWarningMessage(null), 2500);
    return () => clearTimeout(timer);
  }, [warningMessage]);

  // Tier 3 Ghost Cursor Demo loop
  useEffect(() => {
    if (currentHintTier < 3 || finishedRef.current) {
      setGhostCursor((g) => ({ ...g, active: false }));
      return;
    }

    if (!currentTarget) return;

    let isCancelled = false;
    setGhostCursor({ x: 20, y: 80, active: true, state: 'flying' });

    const timeout1 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor({ x: currentTarget.x, y: currentTarget.y, active: true, state: 'flying' });
    }, 500);

    const timeout2 = setTimeout(() => {
      if (isCancelled) return;
      // Right-click demonstration
      setGhostCursor({ x: currentTarget.x, y: currentTarget.y, active: true, state: 'right_click' });
      audioEngine.playRightClick();
      setActiveMenu({
        targetId: currentTarget.id,
        x: currentTarget.x,
        y: currentTarget.y,
      });
    }, 1200);

    const timeout3 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor((g) => ({ ...g, active: false }));
    }, 2500);

    return () => {
      isCancelled = true;
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [currentHintTier, currentTarget]);

  // Spawn spell sparkle burst
  const triggerSpellBurst = (x: number, y: number, color: string) => {
    const newParticles: SpellParticle[] = [];
    const colors = [color, '#fbbf24', '#ffffff', '#ec4899', '#38bdf8'];
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.4;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: colors[i % colors.length],
        size: 8 + Math.random() * 8,
        emoji: i % 3 === 0 ? '✨' : undefined,
      });
    }
    setParticles((prev) => [...prev.slice(-28), ...newParticles]);
  };

  // RIGHT-CLICK: Open Magic Spell Ring on target
  const handleContextMenuTarget = (e: React.MouseEvent, target: TargetObject) => {
    e.preventDefault();
    e.stopPropagation();

    if (target.isTransformed || finishedRef.current) return;

    audioEngine.playRightClick();
    setActiveMenu({
      targetId: target.id,
      x: target.x,
      y: target.y,
    });
  };

  // Prevent default context menu on background
  const handleContextMenuBackground = (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMenu(null);
  };

  // LEFT-CLICK on object: If not right-clicked yet, guide the student
  const handleLeftClickTarget = (e: React.MouseEvent, target: TargetObject) => {
    if (target.isTransformed || finishedRef.current) return;

    if (!activeMenu || activeMenu.targetId !== target.id) {
      audioEngine.playPop();
      setWarningMessage('Em hãy nháy nút chuột phải (ngón giữa) để mở vòng tròn phép thuật nhé!');
    }
  };

  // Select spell from the Magic Ring
  const handleSelectSpell = (spellId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeMenu || finishedRef.current) return;

    const target = targets.find((t) => t.id === activeMenu.targetId);
    if (!target) return;

    if (spellId !== target.requiredSpellId) {
      // Wrong Spell Chosen!
      audioEngine.playError();
      onMistake();
      setMistakes((m) => m + 1);
      setCombo(0);

      const requiredSpell = ALL_SPELLS[target.requiredSpellId];
      setWarningMessage(`Bùa chú chưa đúng rồi! Đồ vật này cần ${requiredSpell.name} (${requiredSpell.emoji}) nè!`);
      setActiveMenu(null);
      return;
    }

    // Correct Spell Chosen!
    audioEngine.playPop();
    const nextCount = transformedCount + 1;
    audioEngine.playStarChime(nextCount % 10);
    onSuccess();

    const newCombo = combo + 1;
    setCombo(newCombo);
    const addedScore = 120 + Math.min(newCombo * 20, 100);
    setScore((s) => s + addedScore);

    const spell = ALL_SPELLS[spellId];
    triggerSpellBurst(target.x, target.y, spell.color);

    // Transform the target
    setTargets((prev) =>
      prev.map((t) => (t.id === target.id ? { ...t, isTransformed: true } : t))
    );
    setActiveMenu(null);
    setWarningMessage(null);

    setTransformedCount(nextCount);
    onProgress?.(nextCount, targetRequired);

    // Check completion
    if (nextCount >= targetRequired) {
      finishedRef.current = true;
      audioEngine.playSuccess();
      audioEngine.playFanfare();

      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const accuracy = Math.max(50, Math.round((nextCount / Math.max(1, nextCount + mistakes)) * 100));
      const stars = Math.min(10, Math.max(5, 11 - Math.floor(mistakes / 2)));
      const finalScore = score + addedScore + Math.max(0, 360 - timeTaken * 6);

      setTimeout(() => {
        onComplete({
          gameId: 13,
          level,
          round,
          score: finalScore,
          stars,
          accuracy,
          timeTakenSeconds: timeTaken,
          correctCount: nextCount,
          mistakeCount: mistakes,
        });
      }, 700);
    }
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={handleContextMenuBackground}
      onClick={() => setActiveMenu(null)}
      className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-b from-indigo-950 via-purple-900 to-slate-950 select-none p-4"
    >
      {/* Decorative Wizard Room Patterns */}
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="absolute top-4 left-6 text-5xl">🧙‍♂️</div>
        <div className="absolute top-10 right-10 text-5xl">🔮</div>
        <div className="absolute bottom-10 left-10 text-5xl">📜</div>
        <div className="absolute bottom-12 right-12 text-5xl">✨</div>
        <div className="absolute top-1/2 left-4 text-4xl">🦉</div>
      </div>

      {/* TOP BANNER: Wizard Mission Header */}
      <div className="relative z-20 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-xl border-2 border-purple-300">
        {/* Wizard Mascot Info */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 text-white shadow-md">
            <span className="text-2xl sm:text-3xl animate-pulse">🧙‍♂️</span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                Màn {level} • Vòng {round}
              </span>
              {combo > 1 && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full animate-bounce">
                  ⚡ Phép x{combo}
                </span>
              )}
            </div>
            <h2 className="text-xs sm:text-sm font-black text-slate-800 line-clamp-1">
              Phù Thủy Tí Hon – Vòng Phép Thuật Biến Hình
            </h2>
          </div>
        </div>

        {/* Target requirement chip */}
        <div className="flex items-center gap-2">
          {currentTarget && (
            <div className="hidden sm:flex items-center gap-1 rounded-xl bg-purple-50 px-3 py-1.5 border border-purple-200">
              <span className="text-xs font-bold text-purple-900">
                Mục tiêu: <span className="font-black text-purple-700">{currentTarget.name}</span>
              </span>
              <span className="text-xs font-bold text-slate-500">
                (Dùng {ALL_SPELLS[currentTarget.requiredSpellId].emoji} {ALL_SPELLS[currentTarget.requiredSpellId].name})
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-3 py-1.5 font-black text-white shadow-sm text-xs sm:text-sm">
            <span>🔮</span>
            <span>
              {transformedCount} / {targetRequired}
            </span>
          </div>
        </div>
      </div>

      {/* TIER 2 HINT BUBBLE: Mascot dialogue */}
      {currentHintTier === 2 && currentTarget && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-2 shadow-xl border-2 border-amber-500 text-amber-950 font-black text-xs sm:text-sm animate-pulse"
        >
          <span>💡</span>
          <span>
            Bé dùng ngón giữa nháy chuột phải vào {currentTarget.name}, rồi bấm chọn {ALL_SPELLS[currentTarget.requiredSpellId].name} nhé!
          </span>
        </motion.div>
      )}

      {/* Warning Toast message if left-clicked */}
      {warningMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-35 flex items-center gap-2 rounded-2xl bg-rose-500 px-4 py-2 text-xs sm:text-sm font-black text-white shadow-2xl border-2 border-white"
        >
          <span>🖱️</span>
          <span>{warningMessage}</span>
        </motion.div>
      )}

      {/* PLAYFIELD: Magical Alchemist Chamber */}
      <div className="relative h-[80%] w-full overflow-hidden rounded-2xl mt-3 bg-gradient-to-b from-indigo-950/80 via-purple-950/70 to-slate-900/90 shadow-2xl border border-purple-500/40 p-4">
        {/* Particles */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
            }}
            className="pointer-events-none absolute z-30 rounded-full shadow-sm"
          >
            {p.emoji && <span className="absolute -top-3 -left-3 text-sm">{p.emoji}</span>}
          </div>
        ))}

        {/* Target Objects */}
        {targets.map((target) => {
          const isCurrent = currentTarget?.id === target.id;
          const isHinted = currentHintTier >= 1 && isCurrent;

          return (
            <motion.div
              key={target.id}
              initial={{ scale: 0 }}
              animate={{
                scale: target.isTransformed ? [1, 1.25, 1.1] : [1, 1.05, 1],
                rotate: target.isTransformed ? [0, 8, -8, 0] : [0, 2, -2, 0],
              }}
              transition={{
                scale: { duration: 0.4 },
                rotate: { repeat: Infinity, duration: target.isTransformed ? 2.5 : 4, ease: 'easeInOut' },
              }}
              style={{
                left: `${target.x}%`,
                top: `${target.y}%`,
              }}
              onContextMenu={(e) => handleContextMenuTarget(e, target)}
              onClick={(e) => handleLeftClickTarget(e, target)}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center rounded-3xl transition-all cursor-pointer ${
                target.isTransformed
                  ? 'z-10 opacity-90'
                  : isHinted
                  ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-purple-950 animate-bounce z-25'
                  : 'z-20'
              }`}
            >
              {/* Circular Altar Base */}
              <div
                className={`relative flex h-18 w-18 sm:h-22 sm:w-22 items-center justify-center rounded-full transition-all duration-300 ${
                  target.isTransformed
                    ? 'bg-gradient-to-tr from-purple-600/40 to-pink-500/40 border-2 border-pink-400 shadow-xl'
                    : 'bg-slate-800/80 border-2 border-purple-400/60 shadow-lg group-hover:scale-110 group-hover:border-purple-300'
                }`}
              >
                {/* Object Emoji */}
                <span className="text-4xl sm:text-5xl drop-shadow-lg select-none pointer-events-none">
                  {target.isTransformed ? target.afterEmoji : target.beforeEmoji}
                </span>

                {/* Right-click prompt badge */}
                {!target.isTransformed && (
                  <span className="absolute -bottom-2 rounded-full bg-purple-600 px-2 py-0.5 text-[9px] font-black text-white shadow-md border border-purple-300 whitespace-nowrap">
                    Chuột phải 🖱️
                  </span>
                )}
              </div>

              {/* Title / Status label */}
              <span className="mt-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-purple-200 border border-purple-800/60 whitespace-nowrap">
                {target.isTransformed ? target.transformationText : target.name}
              </span>

              {/* TIER 1 HINT: Animated pointing finger */}
              {isHinted && !target.isTransformed && (
                <motion.div
                  animate={{ y: [-8, 4, -8] }}
                  transition={{ repeat: Infinity, duration: 0.7 }}
                  className="pointer-events-none absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center z-40"
                >
                  <span className="text-3xl filter drop-shadow">👇</span>
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-amber-950 shadow-md whitespace-nowrap">
                    Nháy chuột phải!
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* RADIAL / MAGIC SPELL RING MENU (Appears on right-click) */}
        <AnimatePresence>
          {activeMenu && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{
                left: `${activeMenu.x}%`,
                top: `${activeMenu.y}%`,
              }}
              onClick={(e) => e.stopPropagation()}
              className="absolute z-50 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
            >
              {/* Magic Ring Center Aura */}
              <div className="absolute inset-0 -m-8 rounded-full bg-purple-500/20 blur-xl pointer-events-none animate-pulse" />

              {/* Magic Menu Header */}
              <div className="mb-2 whitespace-nowrap rounded-full bg-purple-900/90 px-3 py-1 text-xs font-black text-amber-300 shadow-xl border border-purple-400">
                ✨ Chọn Bùa Chú Thần Kỳ:
              </div>

              {/* Circular Spells Grid */}
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-3xl bg-slate-900/95 p-3 shadow-2xl border-2 border-purple-400 backdrop-blur-md">
                {activeSpellKeys.map((key) => {
                  const spell = ALL_SPELLS[key];
                  return (
                    <motion.button
                      key={spell.id}
                      type="button"
                      whileHover={{ scale: 1.15 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleSelectSpell(spell.id, e)}
                      className={`flex flex-col items-center justify-center rounded-2xl border-2 p-2.5 transition-all cursor-pointer shadow-md ${spell.bgColor}`}
                    >
                      <span className="text-2xl sm:text-3xl">{spell.emoji}</span>
                      <span className="mt-1 text-[10px] font-black text-slate-800 whitespace-nowrap">
                        {spell.name}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <div className="mt-1 text-[9px] font-bold text-purple-300">
                (Nháy chuột trái để chọn phép)
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* TIER 3 HINT: Ghost Mouse Cursor Demonstration */}
        {ghostCursor.active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              left: `${ghostCursor.x}%`,
              top: `${ghostCursor.y}%`,
            }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="pointer-events-none absolute z-50 -translate-x-2 -translate-y-2"
          >
            <div className="relative">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
                <path
                  d="M3 3L10.07 19.97L12.58 13.58L19.97 10.07L3 3Z"
                  fill="#a855f7"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              {ghostCursor.state === 'right_click' && (
                <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 font-black text-[10px] text-purple-950 animate-ping">
                  Phải!
                </span>
              )}
            </div>
            <div className="whitespace-nowrap rounded-lg bg-purple-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
              Mẫu: Nháy chuột phải mở vòng phép
            </div>
          </motion.div>
        )}
      </div>

      {/* BOTTOM FOOTER: Tip & Mouse Button Reminder */}
      <div className="mt-2 flex items-center justify-between px-2 text-xs text-purple-200">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-purple-900/80 px-2.5 py-1 font-bold text-purple-200 border border-purple-500">
            🔮 Đồ vật đã biến hình: {transformedCount}/{targetRequired}
          </span>
          {mistakes > 0 && (
            <span className="rounded-full bg-rose-950/80 px-2.5 py-1 font-bold text-rose-300 border border-rose-600">
              Nhầm bùa phép: {mistakes} lần
            </span>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 font-bold text-amber-300 bg-purple-950/80 px-3 py-1 rounded-full border border-purple-500/50">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>Thao tác: Dùng ngón giữa nháy chuột phải vào đồ vật để mở vòng phép, rồi nháy chuột trái chọn bùa chú!</span>
        </div>
      </div>
    </div>
  );
};
