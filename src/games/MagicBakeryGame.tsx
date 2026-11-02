import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface DessertItem {
  id: number;
  type: string;
  name: string;
  emoji: string;
  isTarget: boolean;
  x: number; // percentage 10% - 90%
  y: number; // percentage 15% - 80%
  baseX: number;
  baseY: number;
  speed: number;
  vx: number;
  vy: number;
  size: number;
  isCollected: boolean;
  wiggle: boolean;
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
}

interface CandyParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  emoji?: string;
}

export const MagicBakeryGame: React.FC<GameComponentProps> = ({
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
  const nextItemIdRef = useRef(1);

  // Targets needed per round
  const targetRequired = useMemo(() => {
    if (easyMode) return 5;
    if (level === 1) return round === 1 ? 5 : 7;
    if (level === 2) return round === 1 ? 8 : 10;
    return round === 1 ? 11 : 14;
  }, [level, round, easyMode]);

  // Order specifications per level & round
  const orderConfig = useMemo(() => {
    if (level === 1) {
      if (round === 1) {
        return {
          title: 'Đơn hàng: Cupcake Cầu Vồng',
          targetTypes: ['cupcake'],
          targetNames: 'Bánh Cupcake Cầu Vồng 🧁',
          distractorNames: 'Hạt Tiêu Cay 🌶️ và Chanh Chua 🍋',
          targetTemplates: [{ type: 'cupcake', name: 'Cupcake Cầu Vồng', emoji: '🧁' }],
          distractorTemplates: [
            { type: 'pepper', name: 'Ớt Cay', emoji: '🌶️' },
            { type: 'lemon', name: 'Chanh Chua', emoji: '🍋' },
          ],
        };
      }
      return {
        title: 'Đơn hàng: Bánh Kem Dâu Tây',
        targetTypes: ['strawberry_cake'],
        targetNames: 'Bánh Kem Dâu Tây 🍰',
        distractorNames: 'Bánh Khét Cháy 🪨',
        targetTemplates: [{ type: 'strawberry_cake', name: 'Bánh Kem Dâu', emoji: '🍰' }],
        distractorTemplates: [
          { type: 'burnt', name: 'Bánh Khét', emoji: '🪨' },
          { type: 'onion', name: 'Hành Tây Hăng', emoji: '🧅' },
        ],
      };
    }

    if (level === 2) {
      if (round === 1) {
        return {
          title: 'Đơn hàng: Donut Hạt Cốm & Kẹo Mút',
          targetTypes: ['donut', 'lollipop'],
          targetNames: 'Bánh Donut 🍩 & Kẹo Mút 🍭',
          distractorNames: 'Bình Giấm Chua 🧪 và Ớt Đỏ 🌶️',
          targetTemplates: [
            { type: 'donut', name: 'Donut Hạt Cốm', emoji: '🍩' },
            { type: 'lollipop', name: 'Kẹo Mút Cầu Vồng', emoji: '🍭' },
          ],
          distractorTemplates: [
            { type: 'vinegar', name: 'Giấm Chua', emoji: '🧪' },
            { type: 'pepper', name: 'Ớt Đỏ Cay', emoji: '🌶️' },
          ],
        };
      }
      return {
        title: 'Đơn hàng: Macaron Pháp & Kem Ốc Quế',
        targetTypes: ['macaron', 'icecream'],
        targetNames: 'Bánh Macaron 🧁 & Kem Ốc Quế 🍦',
        distractorNames: 'Bánh Khét Đen 🪨 và Muối Mặn 🧂',
        targetTemplates: [
          { type: 'macaron', name: 'Macaron Pháp', emoji: '🧁' },
          { type: 'icecream', name: 'Kem Ốc Quế', emoji: '🍦' },
        ],
        distractorTemplates: [
          { type: 'burnt', name: 'Bánh Khét', emoji: '🪨' },
          { type: 'salt', name: 'Muối Mặn', emoji: '🧂' },
        ],
      };
    }

    // Level 3
    if (round === 1) {
      return {
        title: 'Đại tiệc: Bánh Tart Hoàng Gia & Socola',
        targetTypes: ['tart', 'chocolate'],
        targetNames: 'Bánh Tart Vàng 🍮 & Socola Ngọt 🍫',
        distractorNames: 'Bình Độc 🧪 và Củ Hành 🧅',
        targetTemplates: [
          { type: 'tart', name: 'Bánh Tart Vàng', emoji: '🍮' },
          { type: 'chocolate', name: 'Socola Ngọt', emoji: '🍫' },
        ],
        distractorTemplates: [
          { type: 'poison', name: 'Bình Độc', emoji: '🧪' },
          { type: 'burnt', name: 'Bánh Khét', emoji: '🪨' },
          { type: 'onion', name: 'Củ Hành', emoji: '🧅' },
        ],
      };
    }

    return {
      title: 'Đại tiệc Đỉnh Cao: Bánh Kem Vương Miện',
      targetTypes: ['crown_cake', 'pudding'],
      targetNames: 'Bánh Kem Vương Miện 🎂 & Bánh Pudding Vàng 🍮',
      distractorNames: 'Ớt Cay 🌶️, Bánh Đen 🪨 và Chanh 🍋',
      targetTemplates: [
        { type: 'crown_cake', name: 'Bánh Kem Vương Miện', emoji: '🎂' },
        { type: 'pudding', name: 'Pudding Hoàng Gia', emoji: '🍮' },
      ],
      distractorTemplates: [
        { type: 'pepper', name: 'Ớt Siêu Cay', emoji: '🌶️' },
        { type: 'burnt', name: 'Bánh Cháy Đen', emoji: '🪨' },
        { type: 'lemon', name: 'Chanh Rất Chua', emoji: '🍋' },
      ],
    };
  }, [level, round]);

  const [collectedCount, setCollectedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const [items, setItems] = useState<DessertItem[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [particles, setParticles] = useState<CandyParticle[]>([]);

  // Ghost demonstration cursor for Tier 3 hint
  const [ghostCursor, setGhostCursor] = useState<{ x: number; y: number; active: boolean; clicking: boolean }>({
    x: 50,
    y: 50,
    active: false,
    clicking: false,
  });

  // Spawn dessert helper
  const createDessert = (preferTarget = false): DessertItem => {
    const isTarget = preferTarget || Math.random() < (level === 1 ? 0.72 : level === 2 ? 0.6 : 0.52);
    const template = isTarget
      ? orderConfig.targetTemplates[Math.floor(Math.random() * orderConfig.targetTemplates.length)]
      : orderConfig.distractorTemplates[Math.floor(Math.random() * orderConfig.distractorTemplates.length)];

    const id = nextItemIdRef.current++;
    const x = 12 + Math.random() * 76;
    const y = 20 + Math.random() * 62;
    const size = easyMode ? 86 : level === 1 ? 80 : level === 2 ? 72 : 68;

    // Speeds and drifts
    const speed = level === 1 ? 0.15 : level === 2 ? 0.45 : 0.75;
    const angle = Math.random() * Math.PI * 2;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed;

    return {
      id,
      type: template.type,
      name: template.name,
      emoji: template.emoji,
      isTarget,
      x,
      y,
      baseX: x,
      baseY: y,
      speed,
      vx,
      vy,
      size,
      isCollected: false,
      wiggle: false,
    };
  };

  // Initial population of desserts
  useEffect(() => {
    finishedRef.current = false;
    setCollectedCount(0);
    setScore(0);
    setCombo(0);
    setMistakes(0);
    setParticles([]);
    setFloatingScores([]);

    const initialCount = level === 1 ? 6 : level === 2 ? 8 : 10;
    const list: DessertItem[] = [];

    // Ensure at least 3 initial targets
    for (let i = 0; i < 3; i++) {
      list.push(createDessert(true));
    }
    for (let i = 3; i < initialCount; i++) {
      list.push(createDessert(false));
    }

    setItems(list);
  }, [level, round, orderConfig, easyMode]);

  // Movement animation loop for Level 2 & 3
  useEffect(() => {
    if (level === 1) return; // Static / gentle floating handled via CSS in level 1

    const interval = setInterval(() => {
      setItems((prev) =>
        prev.map((item) => {
          if (item.isCollected) return item;
          let nx = item.x + item.vx;
          let ny = item.y + item.vy;
          let nvx = item.vx;
          let nvy = item.vy;

          // Bounce off boundary walls
          if (nx < 10) {
            nx = 10;
            nvx = Math.abs(nvx);
          } else if (nx > 90) {
            nx = 90;
            nvx = -Math.abs(nvx);
          }

          if (ny < 18) {
            ny = 18;
            nvy = Math.abs(nvy);
          } else if (ny > 82) {
            ny = 82;
            nvy = -Math.abs(nvy);
          }

          return {
            ...item,
            x: nx,
            y: ny,
            vx: nvx,
            vy: nvy,
          };
        })
      );
    }, 40);

    return () => clearInterval(interval);
  }, [level]);

  // Particle updates
  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.18, // gravity
            size: Math.max(0, p.size - 0.4),
          }))
          .filter((p) => p.size > 1)
      );
    }, 25);
    return () => clearInterval(timer);
  }, [particles.length]);

  // Floating score timer
  useEffect(() => {
    if (floatingScores.length === 0) return;
    const timer = setTimeout(() => {
      setFloatingScores((prev) => prev.slice(1));
    }, 1200);
    return () => clearTimeout(timer);
  }, [floatingScores]);

  // Tier 3 Ghost Cursor Demo loop
  useEffect(() => {
    if (currentHintTier < 3 || finishedRef.current) {
      setGhostCursor((g) => ({ ...g, active: false }));
      return;
    }

    const targetItem = items.find((i) => !i.isCollected && i.isTarget);
    if (!targetItem) return;

    let isCancelled = false;
    setGhostCursor({ x: 20, y: 80, active: true, clicking: false });

    const timeout1 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor({ x: targetItem.x, y: targetItem.y, active: true, clicking: false });
    }, 500);

    const timeout2 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor({ x: targetItem.x, y: targetItem.y, active: true, clicking: true });
      audioEngine.playClick();
    }, 1200);

    const timeout3 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor((g) => ({ ...g, active: false }));
    }, 2000);

    return () => {
      isCancelled = true;
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [currentHintTier, items]);

  // Spawn splash particles when collecting
  const triggerConfetti = (x: number, y: number, emoji: string) => {
    const colors = ['#f43f5e', '#ec4899', '#a855f7', '#fbbf24', '#34d399', '#38bdf8'];
    const newParticles: CandyParticle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.4;
      const speed = 2 + Math.random() * 4;
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        color: colors[i % colors.length],
        size: 8 + Math.random() * 8,
        emoji: i % 4 === 0 ? '✨' : undefined,
      });
    }
    setParticles((prev) => [...prev.slice(-24), ...newParticles]);
  };

  // Handle clicking on an item
  const handleItemClick = (item: DessertItem, e: React.MouseEvent) => {
    if (item.isCollected || finishedRef.current) return;
    e.stopPropagation();

    if (!item.isTarget) {
      // Mistake! Clicked wrong item (distractor like hot pepper or burnt toast)
      audioEngine.playError();
      onMistake();
      setMistakes((m) => m + 1);
      setCombo(0);

      // Wiggle effect on distractor
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, wiggle: true } : i))
      );
      setTimeout(() => {
        setItems((prev) =>
          prev.map((i) => (i.id === item.id ? { ...i, wiggle: false } : i))
        );
      }, 500);

      const penaltyMessages = ['Ôi cay quá!', 'Khét rồi bé ơi!', 'Chanh chua quá!', 'Bỏ qua món này nhé!'];
      const msg = penaltyMessages[Math.floor(Math.random() * penaltyMessages.length)];
      setFloatingScores((prev) => [
        ...prev,
        {
          id: Math.random(),
          x: item.x,
          y: item.y - 6,
          text: msg,
          color: 'text-rose-500 font-extrabold',
        },
      ]);
      return;
    }

    // Correct Target Clicked!
    audioEngine.playPop();
    const nextCount = collectedCount + 1;
    audioEngine.playStarChime(nextCount % 10);
    onSuccess();

    const newCombo = combo + 1;
    setCombo(newCombo);

    const bonus = Math.min(newCombo * 20, 100);
    const addedScore = 100 + bonus;
    setScore((s) => s + addedScore);

    triggerConfetti(item.x, item.y, item.emoji);

    // Floating score animation
    const praiseWords = ['Tuyệt hảo!', 'Ngon tuyệt!', 'Bé giỏi lắm!', 'Đúng rồi!'];
    const praise = newCombo > 2 ? `Combo x${newCombo}! ${praiseWords[newCombo % praiseWords.length]}` : `+${addedScore}`;
    setFloatingScores((prev) => [
      ...prev,
      {
        id: Math.random(),
        x: item.x,
        y: item.y - 8,
        text: praise,
        color: newCombo > 2 ? 'text-amber-500 font-black' : 'text-emerald-600 font-extrabold',
      },
    ]);

    // Mark as collected & spawn replacement
    setItems((prev) => {
      const updated = prev.map((i) => (i.id === item.id ? { ...i, isCollected: true } : i));
      // Add replacement dessert after brief pause
      setTimeout(() => {
        if (!finishedRef.current) {
          setItems((current) => [...current.filter((c) => !c.isCollected), createDessert(true)]);
        }
      }, 350);
      return updated;
    });

    setCollectedCount(nextCount);
    onProgress?.(nextCount, targetRequired);

    // Check completion condition
    if (nextCount >= targetRequired) {
      finishedRef.current = true;
      audioEngine.playSuccess();
      audioEngine.playFanfare();

      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const totalClicks = nextCount + mistakes;
      const accuracy = Math.max(50, Math.round((nextCount / Math.max(1, totalClicks)) * 100));
      const stars = Math.min(10, Math.max(5, 11 - Math.floor(mistakes / 2)));
      const finalScore = score + addedScore + Math.max(0, 350 - timeTaken * 8);

      setTimeout(() => {
        onComplete({
          gameId: 7,
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

  // Find target for Hint Tier 1
  const hintTarget = useMemo(() => {
    return items.find((i) => !i.isCollected && i.isTarget);
  }, [items]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-b from-pink-200 via-rose-100 to-amber-100 select-none p-4"
    >
      {/* Decorative Candy Bakery Wallpaper Patterns */}
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="absolute top-2 left-6 text-5xl">🧁</div>
        <div className="absolute top-12 right-12 text-5xl">🍭</div>
        <div className="absolute bottom-20 left-10 text-5xl">🍩</div>
        <div className="absolute bottom-16 right-16 text-5xl">🍰</div>
        <div className="absolute top-1/2 left-4 text-4xl">🍬</div>
        <div className="absolute top-1/3 right-6 text-4xl">🍦</div>
      </div>

      {/* TOP BANNER: Chef Order Board */}
      <div className="relative z-20 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg border-2 border-pink-300">
        {/* Chef Mascot Info */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-rose-400 text-white shadow-md">
            <span className="text-2xl sm:text-3xl">👨‍🍳</span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                Màn {level} • Vòng {round}
              </span>
              {combo > 1 && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full animate-bounce">
                  ⚡ Combo x{combo}
                </span>
              )}
            </div>
            <h2 className="text-xs sm:text-sm font-black text-slate-800 line-clamp-1">
              {orderConfig.title}
            </h2>
          </div>
        </div>

        {/* Order Goal Chips */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-pink-50 px-3 py-1.5 border border-pink-200">
            <span className="text-xs sm:text-sm font-bold text-pink-900">
              Cần chọn: <span className="font-black text-rose-600">{orderConfig.targetNames}</span>
            </span>
          </div>

          {/* Collection Counter */}
          <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-pink-500 px-3 py-1.5 font-black text-white shadow-sm text-xs sm:text-sm">
            <span>🍰</span>
            <span>
              {collectedCount} / {targetRequired}
            </span>
          </div>
        </div>
      </div>

      {/* TIER 2 HINT BUBBLE: Mascot dialogue */}
      {currentHintTier === 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-2 shadow-xl border-2 border-amber-500 text-amber-950 font-black text-xs sm:text-sm animate-pulse"
        >
          <span>💡</span>
          <span>Bé hãy nháy chuột trái vào {orderConfig.targetNames}, đừng bấm nhầm {orderConfig.distractorNames} nhé!</span>
        </motion.div>
      )}

      {/* PLAYFIELD: Festive Bakery Counter & Trays */}
      <div className="relative h-[80%] w-full overflow-hidden rounded-2xl mt-3 bg-gradient-to-b from-white/70 via-pink-50/60 to-rose-100/70 shadow-inner border border-pink-200">
        {/* Conveyor / Table surface styling */}
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-pink-300/40 via-amber-200/30 to-transparent pointer-events-none" />

        {/* Floating Scores */}
        {floatingScores.map((f) => (
          <motion.div
            key={f.id}
            initial={{ opacity: 0, y: 0, scale: 0.8 }}
            animate={{ opacity: 1, y: -35, scale: 1.15 }}
            exit={{ opacity: 0 }}
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
            className={`pointer-events-none absolute z-40 -translate-x-1/2 rounded-full bg-white/95 px-3 py-1 shadow-lg text-xs sm:text-sm border border-pink-200 ${f.color}`}
          >
            {f.text}
          </motion.div>
        ))}

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

        {/* Dessert Items */}
        <AnimatePresence>
          {items.map((item) => {
            if (item.isCollected) return null;

            const isHinted = currentHintTier >= 1 && hintTarget?.id === item.id;

            return (
              <motion.div
                key={item.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: item.wiggle ? [1, 1.25, 0.9, 1.15, 1] : 1,
                  rotate: item.wiggle ? [-12, 12, -8, 8, 0] : [0, 2, -2, 0],
                  opacity: 1,
                }}
                exit={{ scale: 0, opacity: 0, y: -20 }}
                transition={{
                  scale: { duration: 0.3 },
                  rotate: item.wiggle ? { duration: 0.4 } : { repeat: Infinity, duration: 3, ease: 'easeInOut' },
                }}
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  width: `${item.size}px`,
                  height: `${item.size}px`,
                }}
                onClick={(e) => handleItemClick(item, e)}
                className={`group absolute -translate-x-1/2 -translate-y-1/2 flex cursor-pointer items-center justify-center rounded-3xl transition-transform active:scale-90 hover:scale-110 ${
                  isHinted ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-pink-200 animate-bounce z-30' : 'z-20'
                }`}
              >
                {/* Plate / Pedestal Base */}
                <div className="absolute inset-0 rounded-3xl bg-white/90 shadow-md border-2 border-pink-200 group-hover:border-pink-400 group-hover:shadow-xl transition-all" />

                {/* Shimmer on target items */}
                {item.isTarget && (
                  <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-white shadow-sm animate-pulse">
                    ✨
                  </div>
                )}

                {/* Big Emoji Graphic */}
                <span className="relative z-10 text-4xl sm:text-5xl drop-shadow-md select-none pointer-events-none">
                  {item.emoji}
                </span>

                {/* Subtitle Label on Hover */}
                <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.name}
                </span>

                {/* TIER 1 HINT: Animated pointing finger */}
                {isHinted && (
                  <motion.div
                    animate={{ y: [-6, 6, -6] }}
                    transition={{ repeat: Infinity, duration: 0.8 }}
                    className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-40"
                  >
                    <span className="text-3xl filter drop-shadow">👇</span>
                    <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-950 shadow-md">
                      Bấm đây nè!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
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
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="pointer-events-none absolute z-50 -translate-x-2 -translate-y-2"
          >
            {/* Animated pointer cursor */}
            <div className="relative">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" className="drop-shadow-lg">
                <path
                  d="M3 3L10.07 19.97L12.58 13.58L19.97 10.07L3 3Z"
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              {ghostCursor.clicking && (
                <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 font-black text-xs text-rose-900 animate-ping">
                  Click!
                </span>
              )}
            </div>
            <div className="whitespace-nowrap rounded-lg bg-rose-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
              Mẫu: Nháy chuột trái vào bánh
            </div>
          </motion.div>
        )}
      </div>

      {/* BOTTOM FOOTER: Delivery Basket & Tip */}
      <div className="mt-2 flex items-center justify-between px-2 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pink-100 px-2.5 py-1 font-bold text-pink-800 border border-pink-300">
            🧺 Giỏ bánh ngọt đã thu thập: {collectedCount} chiếc
          </span>
          {mistakes > 0 && (
            <span className="rounded-full bg-rose-100 px-2.5 py-1 font-bold text-rose-800 border border-rose-300">
              Nhầm: {mistakes} lần (Thử lại nhé!)
            </span>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-1.5 font-bold text-pink-900 bg-white/80 px-3 py-1 rounded-full border border-pink-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Thao tác: Nháy chuột trái dứt khoát vào chiếc bánh đúng yêu cầu!</span>
        </div>
      </div>
    </div>
  );
};
