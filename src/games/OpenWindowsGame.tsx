import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface WindowItem {
  id: number;
  isOpen: boolean;
  shaking: boolean;
  animal: string;
  name: string;
}

export const OpenWindowsGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const [windows, setWindows] = useState<WindowItem[]>([]);
  const [openedCount, setOpenedCount] = useState(0);
  const [startTime] = useState(Date.now());
  const lastClickRef = useRef<Record<number, number>>({});
  const finishedRef = useRef(false);

  const totalWindows = level === 1 ? 4 : level === 2 ? 6 : 8;
  const dblClickThreshold = 650; // ms

  const animalsList = [
    { animal: '🐱', name: 'Mèo con' },
    { animal: '🐶', name: 'Cún con' },
    { animal: '🐼', name: 'Gấu trúc' },
    { animal: '🦊', name: 'Cáo nhỏ' },
    { animal: '🐻', name: 'Gấu nâu' },
    { animal: '🦁', name: 'Sư tử' },
    { animal: '🦉', name: 'Cú mèo' },
    { animal: '🐧', name: 'Chim cánh cụt' },
  ];

  useEffect(() => {
    finishedRef.current = false;
    const list: WindowItem[] = [];
    for (let i = 0; i < totalWindows; i++) {
      const a = animalsList[i % animalsList.length];
      list.push({
        id: i,
        isOpen: false,
        shaking: false,
        animal: a.animal,
        name: a.name,
      });
    }
    setWindows(list);
    setOpenedCount(0);
  }, [level, totalWindows]);

  const triggerOpen = (id: number) => {
    if (finishedRef.current) return;
    const target = windows.find((w) => w.id === id);
    if (!target || target.isOpen) return;

    audioEngine.playSuccess();
    onSuccess();

    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isOpen: true, shaking: false } : w))
    );

    const newOpened = openedCount + 1;
    setOpenedCount(newOpened);
    onProgress?.(newOpened, totalWindows);

    if (newOpened >= totalWindows && !finishedRef.current) {
      finishedRef.current = true;
      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const stars = Math.min(10, Math.max(6, 11 - Math.floor(timeTaken / 5)));
      const score = newOpened * 150 + Math.max(0, 300 - timeTaken * 8);

      setTimeout(() => {
        onComplete({
          gameId: 11,
          score,
          stars,
          accuracy: 100,
          timeTakenSeconds: timeTaken,
          correctCount: newOpened,
          mistakeCount: 0,
        });
      }, 500);
    }
  };

  const handleClickWindow = (id: number) => {
    const target = windows.find((w) => w.id === id);
    if (!target || target.isOpen) return;

    const now = Date.now();
    const lastTime = lastClickRef.current[id] || 0;
    const diff = now - lastTime;
    lastClickRef.current[id] = now;

    if (diff > 40 && diff < dblClickThreshold) {
      triggerOpen(id);
    } else {
      audioEngine.playPop();
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, shaking: true } : w))
      );
      setTimeout(() => {
        setWindows((prev) =>
          prev.map((w) => (w.id === id ? { ...w, shaking: false } : w))
        );
      }, 350);
    }
  };

  const nextClosed = windows.find((w) => !w.isOpen);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 via-amber-100 to-emerald-100 p-4 select-none flex flex-col items-center justify-between">
      {/* Top Banner Guide */}
      <div className="z-20 rounded-full bg-white/95 px-5 py-1 text-xs sm:text-sm font-bold text-blue-950 border border-blue-300 shadow-md">
        Nháy đúp chuột (2 lần liên tiếp) để mở cửa sổ đón bạn mới: {openedCount}/{totalWindows}
      </div>

      {/* House Front Façade */}
      <div className="relative flex-1 w-full max-w-2xl flex flex-col items-center justify-center p-2">
        {/* House Roof SVG */}
        <div className="w-full h-16 sm:h-20 flex justify-center">
          <svg viewBox="0 0 400 80" className="w-full h-full drop-shadow-md">
            <polygon points="200,5 390,75 10,75" fill="#dc2626" stroke="#991b1b" strokeWidth="4" />
            <rect x="290" y="15" width="24" height="40" fill="#78350f" stroke="#451a03" strokeWidth="2" />
          </svg>
        </div>

        {/* House Walls with Windows Grid */}
        <div className="w-full rounded-2xl border-4 border-amber-800 bg-amber-50 p-4 shadow-xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 items-center justify-items-center">
            {windows.map((w) => (
              <div
                key={w.id}
                onClick={() => handleClickWindow(w.id)}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  triggerOpen(w.id);
                }}
                className="relative flex flex-col items-center cursor-pointer p-1"
              >
                {/* Window Frame */}
                <motion.div
                  animate={w.shaking ? { x: [-4, 4, -4, 4, 0] } : {}}
                  className={`relative flex h-24 w-20 sm:h-28 sm:w-24 items-center justify-center rounded-t-full border-4 border-amber-900 overflow-hidden shadow-md ${
                    w.isOpen ? 'bg-sky-100' : 'bg-amber-700'
                  }`}
                >
                  {w.isOpen ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.15, 1], y: [0, -3, 0] }}
                      transition={{ repeat: Infinity, duration: 1.8 }}
                      className="flex flex-col items-center"
                    >
                      <span className="text-3xl sm:text-4xl">{w.animal}</span>
                      <span className="text-[10px] font-bold text-blue-900">{w.name}</span>
                    </motion.div>
                  ) : (
                    <div className="flex h-full w-full">
                      <div className="flex-1 border-r-2 border-amber-950 bg-amber-600 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-amber-900" />
                      </div>
                      <div className="flex-1 bg-amber-600 flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-amber-900" />
                      </div>
                    </div>
                  )}

                  <div className="absolute bottom-0 inset-x-0 h-2 bg-amber-950" />
                </motion.div>

                {w.shaking && (
                  <span className="absolute -bottom-4 rounded-full bg-amber-300 px-2 text-[9px] font-black text-amber-950 shadow-xs animate-bounce whitespace-nowrap">
                    Bấm nhanh 2 lần!
                  </span>
                )}

                {currentHintTier === 1 && nextClosed?.id === w.id && (
                  <div className="pointer-events-none absolute -inset-2 rounded-2xl border-4 border-dashed border-rose-500 animate-spin" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
