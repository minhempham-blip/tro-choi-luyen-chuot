import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Wand2, Sparkles, Heart, Sun, CloudRain } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface MagicObject {
  id: number;
  type: string;
  name: string;
  emoji: string;
  bloomedEmoji: string;
  x: number; // percentage
  y: number; // percentage
  size: number;
  isAwakened: boolean;
  glowColor: string;
}

interface SparkleParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  emoji?: string;
}

interface CursorTrail {
  id: number;
  x: number;
  y: number;
}

export const MagicWandGame: React.FC<GameComponentProps> = ({
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

  // Targets needed per round
  const targetRequired = useMemo(() => {
    if (easyMode) return 5;
    if (level === 1) return round === 1 ? 5 : 7;
    if (level === 2) return round === 1 ? 8 : 10;
    return round === 1 ? 12 : 14;
  }, [level, round, easyMode]);

  // Object templates per level & round
  const stageTheme = useMemo(() => {
    if (level === 1) {
      if (round === 1) {
        return {
          title: 'Đánh thức Đóa hoa thần kỳ',
          subtitle: 'Rê chuột lướt nhẹ qua những nụ hoa để hoa nở xòe rực rỡ',
          templates: [
            { type: 'tulip', name: 'Hoa Tulip Đỏ', emoji: '🌱', bloomedEmoji: '🌷', glow: '#f43f5e' },
            { type: 'sunflower', name: 'Hoa Hướng Dương', emoji: '🌱', bloomedEmoji: '🌻', glow: '#fbbf24' },
            { type: 'blossom', name: 'Hoa Anh Đào', emoji: '🌱', bloomedEmoji: '🌸', glow: '#ec4899' },
            { type: 'rose', name: 'Hoa Hồng Nhung', emoji: '🌱', bloomedEmoji: '🌹', glow: '#ef4444' },
          ],
        };
      }
      return {
        title: 'Thắp sáng Cầu vồng & Tinh tú',
        subtitle: 'Rê chuột chạm vào những đám mây để cầu vồng và ánh sao tỏa sáng',
        templates: [
          { type: 'cloud', name: 'Mây Cầu Vồng', emoji: '☁️', bloomedEmoji: '🌈', glow: '#38bdf8' },
          { type: 'star', name: 'Sao Pha Lê', emoji: '⭐', bloomedEmoji: '🌟', glow: '#f59e0b' },
          { type: 'crystal', name: 'Pha Lê Sáng', emoji: '💎', bloomedEmoji: '✨', glow: '#a855f7' },
          { type: 'moon', name: 'Trăng Lưỡi Liềm', emoji: '🌙', bloomedEmoji: '🌕', glow: '#fde047' },
        ],
      };
    }

    if (level === 2) {
      if (round === 1) {
        return {
          title: 'Vườn Nấm Tiên & Đèn Lồng Huyền Ảo',
          subtitle: 'Rê chuột lướt qua để thắp sáng các cây nấm và đèn lồng đom đóm',
          templates: [
            { type: 'mushroom', name: 'Nấm Tiên Hồng', emoji: '🍄', bloomedEmoji: '🍄✨', glow: '#f43f5e' },
            { type: 'lantern', name: 'Đèn Lồng Đom Đóm', emoji: '🏮', bloomedEmoji: '🏮🌟', glow: '#fbbf24' },
            { type: 'bell', name: 'Chuông Gió Pha Lê', emoji: '🎐', bloomedEmoji: '🎐✨', glow: '#34d399' },
            { type: 'firefly', name: 'Đom Đóm Rực Rỡ', emoji: '✨', bloomedEmoji: '💫', glow: '#38bdf8' },
          ],
        };
      }
      return {
        title: 'Khu Rừng Sinh Vật Diệu Kỳ',
        subtitle: 'Rê chuột đánh thức các bạn thú cưng và hoa quả phát sáng',
        templates: [
          { type: 'bunny', name: 'Thỏ Bông Nhỏ', emoji: '🐇', bloomedEmoji: '🐰💖', glow: '#ec4899' },
          { type: 'deer', name: 'Hươu Sao Tinh Tú', emoji: '🦌', bloomedEmoji: '🦌✨', glow: '#f59e0b' },
          { type: 'apple', name: 'Quả Táo Vàng', emoji: '🍏', bloomedEmoji: '🍎✨', glow: '#fbbf24' },
          { type: 'butterfly', name: 'Bướm Tiên Cầu Vồng', emoji: '🦋', bloomedEmoji: '🦋💫', glow: '#a855f7' },
        ],
      };
    }

    // Level 3
    if (round === 1) {
      return {
        title: 'Tinh Thể Vũ Trụ & Bong Bóng Phép Thuật',
        subtitle: 'Rê chuột lướt dẻo dai qua các chùm tinh thể pha lê lơ lửng',
        templates: [
          { type: 'planet', name: 'Hành Tinh Kẹo Ngọt', emoji: '🪐', bloomedEmoji: '🪐✨', glow: '#ec4899' },
          { type: 'comet', name: 'Sao Băng Cầu Vồng', emoji: '☄️', bloomedEmoji: '🌠', glow: '#38bdf8' },
          { type: 'gem', name: 'Ngọc Bích Thần Kỳ', emoji: '🔮', bloomedEmoji: '🔮✨', glow: '#a855f7' },
          { type: 'spark', name: 'Hạt Bụi Tiên', emoji: '🌟', bloomedEmoji: '🎇', glow: '#fbbf24' },
        ],
      };
    }

    return {
      title: 'Đại Tiệc Cung Điện Ánh Sáng',
      subtitle: 'Rê chuột thắp sáng toàn bộ ngọn đèn hoàng gia để khai hội pháo hoa',
      templates: [
        { type: 'crown', name: 'Vương Miện Kim Cương', emoji: '👑', bloomedEmoji: '👑✨', glow: '#fbbf24' },
        { type: 'castle', name: 'Lâu Đài Cổ Tích', emoji: '🏰', bloomedEmoji: '🏰🌟', glow: '#f43f5e' },
        { type: 'firework', name: 'Pháo Hoa Rực Rỡ', emoji: '🎆', bloomedEmoji: '🎇✨', glow: '#38bdf8' },
        { type: 'trophy', name: 'Chiếc Cúp Hoàng Gia', emoji: '🏆', bloomedEmoji: '🏆💫', glow: '#f59e0b' },
      ],
    };
  }, [level, round]);

  const [awakenedCount, setAwakenedCount] = useState(0);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [startTime] = useState(Date.now());
  const [objects, setObjects] = useState<MagicObject[]>([]);
  const [particles, setParticles] = useState<SparkleParticle[]>([]);
  const [cursorTrails, setCursorTrails] = useState<CursorTrail[]>([]);

  // Ghost demonstration cursor for Tier 3 hint
  const [ghostCursor, setGhostCursor] = useState<{ x: number; y: number; active: boolean }>({
    x: 50,
    y: 50,
    active: false,
  });

  // Generate objects layout without overlaps
  useEffect(() => {
    finishedRef.current = false;
    setAwakenedCount(0);
    setScore(0);
    setCombo(0);
    setParticles([]);
    setCursorTrails([]);

    const items: MagicObject[] = [];
    const cols = level === 1 ? 3 : 4;
    const rows = Math.ceil(targetRequired / cols);

    const cellW = 74 / cols;
    const cellH = 60 / rows;

    for (let i = 0; i < targetRequired; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const tmpl = stageTheme.templates[i % stageTheme.templates.length];

      const x = 14 + c * cellW + Math.random() * (cellW * 0.45);
      const y = 20 + r * cellH + Math.random() * (cellH * 0.45);
      const size = easyMode ? 82 : level === 1 ? 76 : level === 2 ? 68 : 62;

      items.push({
        id: i,
        type: tmpl.type,
        name: tmpl.name,
        emoji: tmpl.emoji,
        bloomedEmoji: tmpl.bloomedEmoji,
        x,
        y,
        size,
        isAwakened: false,
        glowColor: tmpl.glow,
      });
    }

    setObjects(items);
  }, [level, round, stageTheme, targetRequired, easyMode]);

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
            vy: p.vy + 0.12, // gravity
            size: Math.max(0, p.size - 0.35),
          }))
          .filter((p) => p.size > 1)
      );
    }, 25);
    return () => clearInterval(timer);
  }, [particles.length]);

  // Clean cursor trail
  useEffect(() => {
    if (cursorTrails.length === 0) return;
    const timer = setTimeout(() => {
      setCursorTrails((prev) => prev.slice(1));
    }, 400);
    return () => clearTimeout(timer);
  }, [cursorTrails]);

  // Tier 3 Ghost Cursor Demo loop
  useEffect(() => {
    if (currentHintTier < 3 || finishedRef.current) {
      setGhostCursor((g) => ({ ...g, active: false }));
      return;
    }

    const unawakened = objects.find((o) => !o.isAwakened);
    if (!unawakened) return;

    let isCancelled = false;
    setGhostCursor({ x: 20, y: 70, active: true });

    const timeout1 = setTimeout(() => {
      if (isCancelled) return;
      setGhostCursor({ x: unawakened.x, y: unawakened.y, active: true });
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
  }, [currentHintTier, objects]);

  // Add fairy dust particle trail on mouse move
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current || finishedRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * 100;
    const py = ((e.clientY - rect.top) / rect.height) * 100;

    // Small trail
    if (Math.random() < 0.4) {
      setCursorTrails((prev) => [...prev.slice(-12), { id: Math.random(), x: px, y: py }]);
    }
  };

  // Sparkle burst when touching an object
  const triggerFairyBurst = (x: number, y: number, color: string) => {
    const newParticles: SparkleParticle[] = [];
    const colors = [color, '#fde047', '#ffffff', '#38bdf8', '#ec4899'];
    for (let i = 0; i < 10; i++) {
      const angle = (Math.PI * 2 * i) / 10 + Math.random() * 0.4;
      const speed = 1.5 + Math.random() * 3.5;
      newParticles.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        color: colors[i % colors.length],
        size: 7 + Math.random() * 7,
        emoji: i % 3 === 0 ? '✨' : undefined,
      });
    }
    setParticles((prev) => [...prev.slice(-25), ...newParticles]);
  };

  // HOVER EVENT: Touch object to awaken it
  const handleHoverObject = (obj: MagicObject) => {
    if (obj.isAwakened || finishedRef.current) return;

    audioEngine.playPop();
    const nextCount = awakenedCount + 1;
    audioEngine.playStarChime(nextCount % 10);
    onSuccess();

    const newCombo = combo + 1;
    setCombo(newCombo);
    const addedScore = 100 + Math.min(newCombo * 15, 80);
    setScore((s) => s + addedScore);

    triggerFairyBurst(obj.x, obj.y, obj.glowColor);

    // Update object state
    setObjects((prev) =>
      prev.map((o) => (o.id === obj.id ? { ...o, isAwakened: true } : o))
    );

    setAwakenedCount(nextCount);
    onProgress?.(nextCount, targetRequired);

    // Check completion condition
    if (nextCount >= targetRequired) {
      finishedRef.current = true;
      audioEngine.playSuccess();
      audioEngine.playFanfare();

      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const accuracy = 100;
      const stars = 10;
      const finalScore = score + addedScore + Math.max(0, 300 - timeTaken * 5);

      setTimeout(() => {
        onComplete({
          gameId: 1,
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
  };

  // Find target for Tier 1 Hint
  const hintTarget = useMemo(() => {
    return objects.find((o) => !o.isAwakened);
  }, [objects]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative h-full w-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky-300 via-indigo-100 to-pink-100 select-none p-4 cursor-default"
    >
      {/* Decorative Fairytale Sky & Magic Elements */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <div className="absolute top-4 left-10 text-5xl">🏰</div>
        <div className="absolute top-12 right-12 text-5xl">🌈</div>
        <div className="absolute bottom-12 left-12 text-5xl">🌸</div>
        <div className="absolute bottom-10 right-16 text-5xl">🦄</div>
        <div className="absolute top-1/2 left-6 text-4xl">✨</div>
      </div>

      {/* Fairy Dust Cursor Trails */}
      {cursorTrails.map((t) => (
        <motion.div
          key={t.id}
          initial={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.4 }}
          style={{ left: `${t.x}%`, top: `${t.y}%` }}
          className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-1/2 text-sm"
        >
          ✨
        </motion.div>
      ))}

      {/* TOP BANNER: Fairy Wand Mission Header */}
      <div className="relative z-20 mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl bg-white/95 px-4 py-2.5 shadow-lg border-2 border-pink-300">
        {/* Fairy Wand Mascot Info */}
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-pink-500 to-amber-400 text-white shadow-md">
            <Wand2 className="h-6 w-6 animate-pulse" />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-pink-700 bg-pink-50 px-2 py-0.5 rounded-full border border-pink-200">
                Màn {level} • Vòng {round}
              </span>
              {combo > 1 && (
                <span className="text-[10px] font-black text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full animate-bounce">
                  ✨ Vệt phép x{combo}
                </span>
              )}
            </div>
            <h2 className="text-xs sm:text-sm font-black text-slate-800 line-clamp-1">
              {stageTheme.title}
            </h2>
          </div>
        </div>

        {/* Progress Counter */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-pink-50 px-3 py-1.5 border border-pink-200">
            <span className="text-xs font-bold text-pink-900">{stageTheme.subtitle}</span>
          </div>

          <div className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-pink-500 to-amber-400 px-3 py-1.5 font-black text-white shadow-sm text-xs sm:text-sm">
            <span>🪄</span>
            <span>
              {awakenedCount} / {targetRequired}
            </span>
          </div>
        </div>
      </div>

      {/* TIER 2 HINT BUBBLE: Mascot advice */}
      {currentHintTier === 2 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl bg-amber-300 px-4 py-2 shadow-xl border-2 border-amber-500 text-amber-950 font-black text-xs sm:text-sm animate-pulse"
        >
          <span>💡</span>
          <span>Bé chỉ cần rê chuột lướt nhẹ qua mục tiêu để thắp sáng nhé, không cần bấm nút nào cả!</span>
        </motion.div>
      )}

      {/* PLAYFIELD: Magical Fairytale Garden */}
      <div className="relative h-[80%] w-full overflow-hidden rounded-2xl mt-3 bg-gradient-to-b from-white/70 via-pink-50/60 to-indigo-50/70 shadow-inner border border-pink-200 p-4">
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

        {/* Magic Interactive Objects */}
        {objects.map((obj) => {
          const isHinted = currentHintTier >= 1 && hintTarget?.id === obj.id;

          return (
            <motion.div
              key={obj.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: obj.isAwakened ? [1, 1.3, 1.1] : [1, 1.05, 1],
                rotate: obj.isAwakened ? [0, 10, -10, 0] : [0, 2, -2, 0],
                opacity: 1,
              }}
              transition={{
                scale: { duration: 0.4 },
                rotate: { repeat: Infinity, duration: obj.isAwakened ? 2.5 : 4, ease: 'easeInOut' },
              }}
              style={{
                left: `${obj.x}%`,
                top: `${obj.y}%`,
                width: `${obj.size}px`,
                height: `${obj.size}px`,
              }}
              onMouseEnter={() => handleHoverObject(obj)}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center rounded-3xl transition-all cursor-pointer ${
                obj.isAwakened
                  ? 'z-20'
                  : isHinted
                  ? 'ring-4 ring-amber-400 ring-offset-4 ring-offset-pink-200 animate-bounce z-30'
                  : 'z-10'
              }`}
            >
              {/* Pedestal / Halo Aura */}
              <div
                style={{
                  boxShadow: obj.isAwakened ? `0 0 25px ${obj.glowColor}` : undefined,
                  borderColor: obj.isAwakened ? obj.glowColor : '#fbcfe8',
                }}
                className={`absolute inset-0 rounded-3xl transition-all duration-500 ${
                  obj.isAwakened
                    ? 'bg-white/95 border-2 shadow-2xl scale-110'
                    : 'bg-white/70 border-2 border-dashed group-hover:scale-105'
                }`}
              />

              {/* Shimmer badge */}
              {obj.isAwakened && (
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] text-white shadow-sm animate-pulse">
                  ✨
                </div>
              )}

              {/* Object Emoji Display */}
              <span className="relative z-10 text-4xl sm:text-5xl drop-shadow-md select-none pointer-events-none transition-transform group-hover:scale-120">
                {obj.isAwakened ? obj.bloomedEmoji : obj.emoji}
              </span>

              {/* Label */}
              <span className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity">
                {obj.name}
              </span>

              {/* TIER 1 HINT: Animated pointing finger */}
              {isHinted && !obj.isAwakened && (
                <motion.div
                  animate={{ y: [-6, 6, -6] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-40"
                >
                  <span className="text-3xl filter drop-shadow">👇</span>
                  <span className="rounded-full bg-amber-400 px-2 py-0.5 text-[10px] font-black text-amber-950 shadow-md whitespace-nowrap">
                    Rê chuột qua đây!
                  </span>
                </motion.div>
              )}
            </motion.div>
          );
        })}

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
                  fill="#ec4899"
                  stroke="#ffffff"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="absolute -top-3 -right-3 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-400 font-black text-xs text-pink-900 animate-ping">
                🪄
              </span>
            </div>
            <div className="whitespace-nowrap rounded-lg bg-pink-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md">
              Mẫu: Rê chuột chạm nhẹ
            </div>
          </motion.div>
        )}
      </div>

      {/* BOTTOM FOOTER: Hint and Tips */}
      <div className="mt-2 flex items-center justify-between px-2 text-xs text-slate-700">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-pink-100 px-2.5 py-1 font-bold text-pink-800 border border-pink-300">
            🪄 Đã thắp sáng: {awakenedCount}/{targetRequired} mục tiêu
          </span>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 font-bold text-pink-900 bg-white/80 px-3 py-1 rounded-full border border-pink-200">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          <span>Thao tác: Cầm chuột nhẹ nhàng, rê con trỏ lướt qua mục tiêu (Không cần bấm chuột)!</span>
        </div>
      </div>
    </div>
  );
};
