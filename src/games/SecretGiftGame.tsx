import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gift, Eye, Scissors } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface GiftBox {
  id: number;
  opened: boolean;
  surprise: string;
  surpriseName: string;
  color: string;
  ribbonColor: string;
}

export const SecretGiftGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const [gifts, setGifts] = useState<GiftBox[]>([]);
  const [openedCount, setOpenedCount] = useState(0);
  const [activeMenu, setActiveMenu] = useState<{ giftId: number; x: number; y: number } | null>(null);
  const [startTime] = useState(Date.now());

  const totalGifts = level === 1 ? 3 : level === 2 ? 4 : 5;

  const surprises = [
    { emoji: '🧸', name: 'Gấu bông ấm áp' },
    { emoji: '🚀', name: 'Tàu vũ trụ mini' },
    { emoji: '🚗', name: 'Ô tô đồ chơi' },
    { emoji: '🤖', name: 'Người máy thông minh' },
    { emoji: '🦖', name: 'Khủng long xanh' },
    { emoji: '🚁', name: 'Máy bay trực thăng' },
  ];

  useEffect(() => {
    const boxColors = ['#f43f5e', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];
    const ribbonColors = ['#fef08a', '#ffffff', '#fed7aa', '#fbcfe8', '#e0e7ff'];

    const list: GiftBox[] = [];
    for (let i = 0; i < totalGifts; i++) {
      const s = surprises[i % surprises.length];
      list.push({
        id: i,
        opened: false,
        surprise: s.emoji,
        surpriseName: s.name,
        color: boxColors[i % boxColors.length],
        ribbonColor: ribbonColors[i % ribbonColors.length],
      });
    }
    setGifts(list);
    setOpenedCount(0);
    setActiveMenu(null);
  }, [level, totalGifts]);

  const openBoxMenu = (clientX: number, clientY: number, giftId: number) => {
    const target = gifts.find((g) => g.id === giftId);
    if (!target || target.opened) return;

    audioEngine.playRightClick();
    const clampedX = Math.min(window.innerWidth - 200, Math.max(20, clientX - 80));
    const clampedY = Math.min(window.innerHeight - 200, Math.max(70, clientY - 80));
    setActiveMenu({ giftId, x: clampedX, y: clampedY });
  };

  const handleBoxContextMenu = (e: React.MouseEvent, giftId: number) => {
    e.preventDefault();
    e.stopPropagation();
    openBoxMenu(e.clientX, e.clientY, giftId);
  };

  const handleOpenGiftAction = (giftId: number) => {
    setActiveMenu(null);
    audioEngine.playSuccess();
    onSuccess();

    setGifts((prev) =>
      prev.map((g) => (g.id === giftId ? { ...g, opened: true } : g))
    );

    const newCount = openedCount + 1;
    setOpenedCount(newCount);
    onProgress?.(newCount, totalGifts);

    if (newCount >= totalGifts) {
      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const stars = Math.min(10, Math.max(6, 11 - Math.floor(timeTaken / 6)));
      const score = newCount * 200 + Math.max(0, 300 - timeTaken * 8);

      setTimeout(() => {
        onComplete({
          gameId: 14,
          score,
          stars,
          accuracy: 100,
          timeTakenSeconds: timeTaken,
          correctCount: newCount,
          mistakeCount: 0,
        });
      }, 700);
    }
  };

  const nextUnopened = gifts.find((g) => !g.opened);

  return (
    <div
      onClick={() => setActiveMenu(null)}
      onContextMenu={(e) => {
        e.preventDefault();
        setActiveMenu(null);
      }}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-rose-100 via-pink-50 to-indigo-100 p-4 select-none flex flex-col items-center justify-between"
    >
      {/* Top Banner Guide */}
      <div className="z-20 rounded-full bg-white/95 px-5 py-1 text-xs sm:text-sm font-bold text-rose-950 border border-rose-300 shadow-md">
        Nháy chuột phải vào hộp quà rồi chọn "Mở quà": {openedCount}/{totalGifts}
      </div>

      {/* Gift Boxes Stage */}
      <div className="flex-1 flex items-center justify-center w-full max-w-3xl">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {gifts.map((gift) => (
            <div
              key={gift.id}
              onContextMenu={(e) => handleBoxContextMenu(e, gift.id)}
              className="relative flex flex-col items-center cursor-context-menu p-1"
            >
              <AnimatePresence>
                {!gift.opened ? (
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ repeat: Infinity, duration: 2 + (gift.id % 3) * 0.3 }}
                    className="relative flex h-28 w-28 sm:h-32 sm:w-32 flex-col items-center justify-center rounded-2xl border-4 border-slate-700/30 p-2 shadow-xl"
                    style={{ backgroundColor: gift.color }}
                  >
                    <div
                      className="absolute inset-x-0 h-6 top-1/2 -translate-y-1/2 opacity-90"
                      style={{ backgroundColor: gift.ribbonColor }}
                    />
                    <div
                      className="absolute inset-y-0 w-6 left-1/2 -translate-x-1/2 opacity-90"
                      style={{ backgroundColor: gift.ribbonColor }}
                    />

                    <div className="absolute -top-4 text-3xl drop-shadow-md">🎀</div>

                    <span className="relative z-10 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-slate-800 shadow-xs">
                      Chuột phải
                    </span>

                    {/* Secondary click helper for trackpads */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        openBoxMenu(rect.left + 50, rect.top - 80, gift.id);
                      }}
                      className="relative z-10 mt-1 rounded-md bg-white/70 hover:bg-white px-1.5 text-[9px] font-bold text-slate-800 shadow-xs"
                    >
                      Bấm menu
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.2 }}
                    animate={{ scale: [1, 1.15, 1], y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-5xl sm:text-6xl drop-shadow-lg">{gift.surprise}</span>
                    <span className="mt-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white shadow-xs">
                      {gift.surpriseName}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {currentHintTier === 1 && nextUnopened?.id === gift.id && !gift.opened && (
                <div className="pointer-events-none absolute -inset-3 rounded-2xl border-4 border-dashed border-amber-400 animate-spin" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom Context Menu on Right Click */}
      <AnimatePresence>
        {activeMenu && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            style={{
              position: 'fixed',
              left: `${activeMenu.x}px`,
              top: `${activeMenu.y}px`,
            }}
            onClick={(e) => e.stopPropagation()}
            className="z-50 w-44 rounded-2xl border-2 border-rose-300 bg-white p-1.5 shadow-2xl"
          >
            <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wide border-b border-slate-100">
              Menu Hộp Quà
            </div>

            <button
              type="button"
              onClick={() => handleOpenGiftAction(activeMenu.giftId)}
              className="mt-1 flex w-full items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 px-3 py-2 text-left text-sm font-black text-white shadow-sm hover:from-emerald-600 hover:to-green-700 transition-colors cursor-pointer"
            >
              <Gift className="h-4 w-4" />
              <span>Mở quà</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playPop();
                setActiveMenu(null);
              }}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Eye className="h-3.5 w-3.5 text-blue-500" />
              <span>Xem bên ngoài</span>
            </button>
            <button
              type="button"
              onClick={() => {
                audioEngine.playPop();
                setActiveMenu(null);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <Scissors className="h-3.5 w-3.5 text-pink-500" />
              <span>Chỉnh nơ</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
