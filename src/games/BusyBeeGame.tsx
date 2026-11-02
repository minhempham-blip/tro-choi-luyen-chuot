import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Sun, Flower2, Heart } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface FlowerItem {
  id: number;
  x: number; // percentage 10-90
  y: number; // percentage 15-85
  type: string;
  name: string;
  emoji: string;
  bloomedEmoji: string;
  color: string;
  collected: boolean;
}

interface PollenParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export const BusyBeeGame: React.FC<GameComponentProps> = ({
  level = 1,
  round = 1,
  easyMode,
  currentHintTier,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(false);
  const prevBeePosRef = useRef({ x: 12, y: 50 });

  // Bee character position & angle
  const [beePos, setBeePos] = useState({ x: 12, y: 50 });
  const [beeAngle, setBeeAngle] = useState(0);

  // Targets needed per round
  const targetRequired = useMemo(() => {
    if (easyMode) return 5;
    if (level === 1) return round === 1 ? 6 : 8;
    if (level === 2) return round === 1 ? 10 : 12;
    return round === 1 ? 14 : 16;
  }, [level, round, easyMode]);

  // Stage theme per level & round
  const stageTheme = useMemo(() => {
    if (level === 1) {
      if (round === 1) {
        return {
          title: 'Đồi Hoa Cúc Vàng – Thung Lũng Mật Ong',
          subtitle: 'Rê chuột dẫn chú ong bay lướt qua các đóa hoa cúc để hút mật ngọt',
          flowerTypes: [
            { type: 'daisy', name: 'Hoa Cúc Vàng', emoji: '🌱', bloomedEmoji: '🌼', color: '#facc15' },
            { type: 'sunflower', name: 'Hoa Hướng Dương', emoji: '🌱', bloomedEmoji: '🌻', color: '#f59e0b' },
          ],
        };
      }
      return {
        title: 'Cung Đường Hoa Hồng Thơm Ngát',
        subtitle: 'Dẫn chú ong lướt nhẹ theo cung đường hoa hồng rực rỡ',
        flowerTypes: [
          { type: 'rose', name: 'Hoa Hồng Đỏ', emoji: '🌱', bloomedEmoji: '🌹', color: '#ef4444' },
          { type: 'tulip', name: 'Hoa Tulip Hồng', emoji: '🌱', bloomedEmoji: '🌷', color: '#ec4899' },
        ],
      };
    }

    if (level === 2) {
      if (round === 1) {
        return {
          title: 'Bờ Suối Hoa Anh Đào Mộng Mơ',
          subtitle: 'Rê chuột khéo léo bám theo dòng suối hoa anh đào uốn lượn',
          flowerTypes: [
            { type: 'cherry', name: 'Hoa Anh Đào', emoji: '🌱', bloomedEmoji: '🌸', color: '#f472b6' },
            { type: 'lotus', name: 'Hoa Sen Suối', emoji: '🌱', bloomedEmoji: '🪷', color: '#38bdf8' },
            { type: 'daisy', name: 'Cúc Dại', emoji: '🌱', bloomedEmoji: '🌼', color: '#facc15' },
          ],
        };
      }
      return {
        title: 'Thung Lũng Cầu Vồng Thần Tiên',
        subtitle: 'Bay qua cầu vồng hoa để gom mật hoa bảy sắc cầu vồng',
        flowerTypes: [
          { type: 'rainbow', name: 'Hoa Cầu Vồng', emoji: '🌱', bloomedEmoji: '🌺', color: '#a855f7' },
          { type: 'berry', name: 'Quả Dâu Rừng', emoji: '🌱', bloomedEmoji: '🍓', color: '#f43f5e' },
          { type: 'sunflower', name: 'Hướng Dương Rực Rỡ', emoji: '🌱', bloomedEmoji: '🌻', color: '#fbbf24' },
        ],
      };
    }

    // Level 3
    if (round === 1) {
      return {
        title: 'Mê Cung Hoa Dạ Yến Thảo Phát Sáng',
        subtitle: 'Lượn sóng dẻo dai qua mê cung hoa phát sáng huyền ảo',
        flowerTypes: [
          { type: 'night', name: 'Dạ Yến Thảo', emoji: '🌱', bloomedEmoji: '🪻', color: '#818cf8' },
          { type: 'crystal', name: 'Hoa Pha Lê', emoji: '🌱', bloomedEmoji: '💎', color: '#22d3ee' },
          { type: 'clover', name: 'Cỏ 4 Lá', emoji: '🌱', bloomedEmoji: '🍀', color: '#4ade80' },
        ],
      };
    }

    return {
      title: 'Đại Tiệc Mật Ong Hoàng Gia',
      subtitle: 'Đưa giọt mật hoa vàng óng về tổ ong chúa để mở tiệc mừng chiến thắng',
      flowerTypes: [
        { type: 'royal', name: 'Hoa Hoàng Gia', emoji: '🌱', bloomedEmoji: '👑', color: '#fbbf24' },
        { type: 'honey', name: 'Hũ Mật Vàng', emoji: '🌱', bloomedEmoji: '🍯', color: '#f59e0b' },
        { type: 'rose', name: 'Hoa Hồng Nhũ', emoji: '🌱', bloomedEmoji: '🌹', color: '#f43f5e' },
      ],
    };
  }, [level, round]);

  const [flowers, setFlowers] = useState<FlowerItem[]>([]);
  const [collectedCount, setCollectedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [startTime] = useState(Date.now());
  const [particles, setParticles] = useState<PollenParticle[]>([]);

  // Ghost demonstration cursor for Tier 3 hint
  const [ghostCursor, setGhostCursor] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  // Generate scenic curved flight path for flowers
  useEffect(() => {
    finishedRef.current = false;
    setCollectedCount(0);
    setScore(0);
    setCombo(0);
    setParticles([]);
    setBeePos({ x: 12, y: 50 });
    prevBeePosRef.current = { x: 12, y: 50 };

    const items: FlowerItem[] = [];
    const step = 75 / (targetRequired - 1 || 1);

    for (let i = 0; i < targetRequired; i++) {
      const tmpl = stageTheme.flowerTypes[i % stageTheme.flowerTypes.length];
      const progress = i / Math.max(1, targetRequired - 1);

      // Natural smooth wavy flight path (sine curve)
      let yCurve = 50;
      if (level === 1) {
        yCurve = 50 + Math.sin(progress * Math.PI * 2) * 22;
      } else if (level === 2) {
        yCurve = 50 + Math.sin(progress * Math.PI * 3.5) * 26;
      } else {
        // Multi-frequency winding path
        yCurve = 50 + Math.sin(progress * Math.PI * 4.5) * 28 + Math.cos(progress * Math.PI * 2) * 6;
      }

      const x = 14 + i * step;
      const y = Math.max(22, Math.min(80, yCurve));

      items.push({
        id: i,
        x,
        y,
        type: tmpl.type,
        name: tmpl.name,
        emoji: tmpl.emoji,
        bloomedEmoji: tmpl.bloomedEmoji,
        color: tmpl.color,
        collected: false,
      });
    }

    setFlowers(items);
  }, [level, round, stageTheme, targetRequired]);

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
            vy: p.vy + 0.1, // gentle gravity
            size: Math.max(0, p.size - 0.35),
          }))
          .filter((p) => p.size > 1)
      );
    }, 25);
    return () => clearInterval(timer);
  }, [particles.length]);

  // Tier 3 Ghost Cursor Demo loop
  useEffect(() => {
    if (currentHintTier < 3 || finishedRef.current) {
      setGhostCursor((g) => ({ ...g, active: false }));
      return;
    }

    const nextTarget = flowers.find((f) => !f.collected);
    if (!nextTarget) return;

    let isCancelled = false;
    setGhostCursor({ x: beePos.x, y: beePos.y, active: true });

    const timeout1 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor({ x: nextTarget.x, y: nextTarget.y, active: true });
      audioEngine.playPop();
    }, 600);

    const timeout2 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor((g) => ({ ...g, active: false }));
    }, 2200);

    return () => {
      isCancelled = true;
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [currentHintTier, flowers, beePos]);

  // Spawn pollen sparkle trail
  const triggerPollenBurst = (x: number, y: number, color: string) => {
    const newParticles: PollenParticle[] = [];
    const colors = [color, '#fde047', '#ffffff', '#fbbf24', '#f59e0b'];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3;
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: colors[i % colors.length],
        size: 7 + Math.random() * 7,
      });
    }
    setParticles((prev) => [...prev.slice(-25), ...newParticles]);
  };

  // Check collision between bee and flowers
  const checkCollisionWithFlowers = (bx: number, by: number) => {
    if (finishedRef.current) return;

    flowers.forEach((flower) => {
      if (flower.collected) return;

      const dx = flower.x - bx;
      const dy = flower.y - by;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Hit radius (percentage)
      const threshold = easyMode ? 7.5 : level === 1 ? 6.5 : level === 2 ? 5.8 : 5.2;

      if (dist < threshold) {
        // Collected flower nectar!
        audioEngine.playPop();
        const nextCount = collectedCount + 1;
        audioEngine.playStarChime(nextCount % 10);
        onSuccess();

        const newCombo = combo + 1;
        setCombo(newCombo);
        const addedScore = 100 + Math.min(newCombo * 15, 80);
        setScore((s) => s + addedScore);

        triggerPollenBurst(flower.x, flower.y, flower.color);

        setFlowers((prev) =>
          prev.map((f) => (f.id === flower.id ? { ...f, collected: true } : f))
        );

        setCollectedCount(nextCount);
        onProgress?.(nextCount, targetRequired);

        // Check completion
        if (nextCount >= targetRequired) {
          finishedRef.current = true;
          audioEngine.playSuccess();
          audioEngine.playFanfare();

          const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          const accuracy = 100;
          const stars = 10;
          const finalScore = score + addedScore + Math.max(0, 320 - timeTaken * 5);

          setTimeout(() => {
            onComplete({
              gameId: 2,
              level,
              round,
              score: finalScore,
              stars,
              accuracy,
              timeTakenSeconds: timeTaken,
              correctCount: nextCount,
              mistakeCount: 0,
            });
          }, 700);
        }
      }
    });
  };

  // MOUSE MOVE: Lead the bee smoothly along the flower path
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || finishedRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = Math.max(5, Math.min(95, ((e.clientX - rect.left) / rect.width) * 100));
    const py = Math.max(15, Math.min(85, ((e.clientY - rect.top) / rect.height) * 100));

    // Calculate heading angle
    const dx = px - prevBeePosRef.current.x;
    const dy = py - prevBeePosRef.current.y;
    if (Math.abs(dx) > 0.2 || Math.abs(dy) > 0.2) {
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      setBeeAngle(angle);
      prevBeePosRef.current = { x: px, y: py };
    }

    setBeePos({ x: px, y: py });
    checkCollisionWithFlowers(px, py);
  };

  // Find next target for Hint Tier 1
  const hintTarget = useMemo(() => {
    return flowers.find((f) => !f.collected);
  }, [flowers]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky-200 via-amber-50 to-emerald-100 select-none p-4 cursor-none"
    >
      {/* Decorative Forest Landscape */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute top-4 left-8 text-5xl">🌳</div>
        <div className="absolute top-10 right-10 text-5xl">🍯</div>
        <div className="absolute bottom-10 left-12 text-5xl">🍄</div>
        <div className="absolute bottom-12 right-14 text-5xl">🌻</div>
        <div className="absolute top-1/2 left-4 text-4xl">🦋</div>
      </div>

      {/* Curved Flower Trail Path (SVG Polyline for Visual Guidance) */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-40">
        {flowers.length > 1 && (
          <path
            d={`M ${flowers.map((f) => `${f.x}%,${f.y}%`).join(' L ')}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="8"
            strokeDasharray="10 10"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* TOP BANNER: Flight Mission Header */}
      <div className="relative z-20 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg border-2 border-amber-300">
        {/* Bee Mascot Info */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-white shadow-md">
            <span className="text-2xl sm:text-3xl animate-bounce">🐝</span>
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                Màn {level} • Vòng {round}
              </span>
              {combo > 1 && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full animate-bounce">
                  🍯 Bay mượt x{combo}
                </span>
              )}
            </div>
            <h2 className="text-xs sm:text-sm font-black text-slate-800 line-clamp-1">
              {stageTheme.title}
            </h2>
          </div>
        </div>

        {/* Honey Jar Collection Progress */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-amber-50 px-3 py-1.5 border border-amber-200">
            <span className="text-xs font-bold text-amber-900">{stageTheme.subtitle}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 px-3 py-1.5 font-black text-amber-950 shadow-sm text-xs sm:text-sm">
            <span>🍯</span>
            <span>
              {collectedCount} / {targetRequired} đóa hoa
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
          <span>Bé chỉ cần rê chuột dẫn chú ong bay lướt qua những bông hoa nhé, không cần bấm phím nào cả!</span>
        </motion.div>
      )}

      {/* PLAYFIELD: Garden Scene */}
      <div className="relative h-[80%] w-full overflow-hidden rounded-2xl mt-3 bg-gradient-to-b from-white/70 via-amber-50/50 to-emerald-50/70 shadow-inner border border-amber-200 p-4">
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
          />
        ))}

        {/* Interactive Flowers on Path */}
        {flowers.map((flower) => {
          const isHinted = currentHintTier >= 1 && hintTarget?.id === flower.id;

          return (
            <motion.div
              key={flower.id}
              animate={{
                scale: flower.collected ? [1, 1.3, 1.1] : [1, 1.08, 1],
                rotate: flower.collected ? [0, 15, -15, 0] : [0, 3, -3, 0],
              }}
              transition={{
                scale: { duration: 0.35 },
                rotate: { repeat: Infinity, duration: flower.collected ? 2 : 3, ease: 'easeInOut' },
              }}
              style={{
                left: `${flower.x}%`,
                top: `${flower.y}%`,
              }}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-3xl transition-all ${
                flower.collected
                  ? 'z-10 opacity-80'
                  : isHinted
                  ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-amber-200 animate-bounce z-25'
                  : 'z-20'
              }`}
            >
              {/* Petal base halo */}
              <div
                style={{
                  boxShadow: flower.collected ? `0 0 20px ${flower.color}` : undefined,
                  borderColor: flower.collected ? flower.color : '#fde68a',
                }}
                className={`flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full transition-all duration-300 ${
                  flower.collected
                    ? 'bg-amber-100 border-2 shadow-lg scale-110'
                    : 'bg-white/90 border-2 shadow-md hover:scale-105'
                }`}
              >
                <span className="text-3xl sm:text-4xl select-none pointer-events-none">
                  {flower.collected ? flower.bloomedEmoji : flower.emoji}
                </span>
              </div>

              {/* Honey drop badge when collected */}
              {flower.collected && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-white shadow-sm animate-pulse">
                  🍯
                </div>
              )}

              {/* TIER 1 HINT: Animated pointing finger */}
              {isHinted && !flower.collected && (
                <motion.div
                  animate={{ y: [-6, 6, -6] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-40"
                >
                  <span className="text-3xl filter drop-shadow">👇</span>
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[9px] font-black text-amber-950 shadow-md whitespace-nowrap">
                    Bay qua đây nè!
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}

        {/* BUSY BEE CHARACTER (Controls with mouse position smoothly) */}
        <motion.div
          animate={{
            rotate: Math.max(-30, Math.min(30, beeAngle)),
          }}
          transition={{ duration: 0.1 }}
          style={{
            left: `${beePos.x}%`,
            top: `${beePos.y}%`,
          }}
          className="pointer-events-none absolute z-40 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
        >
          {/* Animated Bee wings & body */}
          <div className="relative flex items-center justify-center">
            {/* Flapping wings */}
            <motion.div
              animate={{ scaleY: [1, 0.4, 1], scaleX: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 0.12 }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 flex gap-1 text-sm text-sky-200 opacity-80"
            >
              <span>🪽</span>
              <span>🪽</span>
            </motion.div>

            {/* Bee Emoji Graphic */}
            <span className="text-5xl sm:text-6xl filter drop-shadow-xl select-none">
              🐝
            </span>

            {/* Sparkle Honey Trail */}
            <span className="absolute -bottom-2 text-xs animate-ping">
              ✨
            </span>
          </div>

          <span className="mt-1 rounded-full bg-amber-950/80 px-2 py-0.5 text-[9px] font-black text-amber-200 shadow-md whitespace-nowrap">
            Ong Vàng Tí Hon
          </span>
        </motion.div>

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
                  fill="#f59e0b"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 font-black text-xs text-amber-950 animate-ping">
                🐝
              </span>
            </div>
            <div className="whitespace-nowrap rounded-lg bg-amber-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
              Mẫu: Rê chuột dẫn chú ong bay
            </div>
          </motion.div>
        )}
      </div>

      {/* BOTTOM FOOTER: Tip & Progress */}
      <div className="mt-2 flex items-center justify-between px-2 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 font-bold text-amber-900 border border-amber-300">
            🍯 Hũ mật đã thu thập: {collectedCount}/{targetRequired} giọt mật
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 font-bold text-amber-950 bg-white/80 px-3 py-1 rounded-full border border-amber-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          <span>Thao tác: Di chuyển chuột nhẹ nhàng dẫn chú ong lướt qua các đóa hoa (Không cần bấm chuột)!</span>
        </div>
      </div>
    </div>
  );
};
