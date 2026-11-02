import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface FoodItem {
  id: number;
  emoji: string;
  name: string;
  targetPet: 'cat' | 'dog' | 'rabbit';
  eaten: boolean;
}

export const FeedAnimalsGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const petRefs = {
    cat: useRef<HTMLDivElement>(null),
    dog: useRef<HTMLDivElement>(null),
    rabbit: useRef<HTMLDivElement>(null),
  };

  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [fedCount, setFedCount] = useState(0);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [happyPet, setHappyPet] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const finishedRef = useRef(false);

  const totalFoodCount = level === 1 ? 4 : level === 2 ? 6 : 8;

  const foodPool: Omit<FoodItem, 'id' | 'eaten'>[] = [
    { emoji: '🐟', name: 'Cá tươi', targetPet: 'cat' },
    { emoji: '🦴', name: 'Khúc xương', targetPet: 'dog' },
    { emoji: '🥕', name: 'Cà rốt', targetPet: 'rabbit' },
    { emoji: '🐟', name: 'Cá béo', targetPet: 'cat' },
    { emoji: '🦴', name: 'Xương giòn', targetPet: 'dog' },
    { emoji: '🥕', name: 'Cà rốt ngọt', targetPet: 'rabbit' },
    { emoji: '🐟', name: 'Cá chiên', targetPet: 'cat' },
    { emoji: '🥕', name: 'Cà rốt non', targetPet: 'rabbit' },
  ];

  useEffect(() => {
    finishedRef.current = false;
    const list: FoodItem[] = foodPool.slice(0, totalFoodCount).map((f, i) => ({
      ...f,
      id: i,
      eaten: false,
    }));
    setFoods(list);
    setFedCount(0);
  }, [level, totalFoodCount]);

  // Window pointer listeners for smooth, unbreakable drag & drop
  useEffect(() => {
    if (draggingId === null) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      const draggedFood = foods.find((f) => f.id === draggingId);
      setDraggingId(null);
      if (!draggedFood || finishedRef.current) return;

      // Check which pet is under cursor
      let targetedPet: 'cat' | 'dog' | 'rabbit' | null = null;
      (['cat', 'dog', 'rabbit'] as const).forEach((pet) => {
        const el = petRefs[pet].current;
        if (el) {
          const rect = el.getBoundingClientRect();
          if (
            e.clientX >= rect.left - 20 &&
            e.clientX <= rect.right + 20 &&
            e.clientY >= rect.top - 20 &&
            e.clientY <= rect.bottom + 20
          ) {
            targetedPet = pet;
          }
        }
      });

      if (targetedPet === draggedFood.targetPet) {
        audioEngine.playSuccess();
        onSuccess();
        setHappyPet(targetedPet);
        setTimeout(() => setHappyPet(null), 1000);

        setFoods((prev) =>
          prev.map((f) => (f.id === draggingId ? { ...f, eaten: true } : f))
        );

        const newCount = fedCount + 1;
        setFedCount(newCount);
        onProgress?.(newCount, totalFoodCount);

        if (newCount >= totalFoodCount && !finishedRef.current) {
          finishedRef.current = true;
          const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          const accuracy = Math.max(50, Math.round((newCount / (newCount + mistakes)) * 100));
          const stars = Math.min(10, Math.max(6, 11 - Math.floor(mistakes / 2)));
          const score = newCount * 150 + Math.max(0, 300 - timeTaken * 8);

          setTimeout(() => {
            onComplete({
              gameId: 16,
              score,
              stars,
              accuracy,
              timeTakenSeconds: timeTaken,
              correctCount: newCount,
              mistakeCount: mistakes,
            });
          }, 500);
        }
      } else {
        audioEngine.playError();
        onMistake();
        setMistakes((m) => m + 1);
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [draggingId, foods, fedCount, totalFoodCount, mistakes, startTime, onSuccess, onMistake, onComplete, onProgress]);

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    e.preventDefault();
    const target = foods.find((f) => f.id === id);
    if (!target || target.eaten) return;

    audioEngine.playPop();
    setDraggingId(id);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const nextFood = foods.find((f) => !f.eaten);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-emerald-100 via-amber-50 to-orange-100 p-4 select-none flex flex-col justify-between"
    >
      {/* Top Banner Guide */}
      <div className="z-20 self-center rounded-full bg-white/95 px-5 py-1 text-xs sm:text-sm font-bold text-slate-800 border border-emerald-300 shadow-md">
        Kéo thức ăn cho thú cưng: Cá cho mèo, Xương cho cún, Cà rốt cho thỏ ({fedCount}/{totalFoodCount})
      </div>

      {/* 3 ANIMAL PETS STAGE */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 my-auto max-w-2xl mx-auto w-full">
        {/* Cat */}
        <div
          ref={petRefs.cat}
          className={`flex flex-col items-center justify-center rounded-3xl border-4 p-3 shadow-md transition-all ${
            happyPet === 'cat'
              ? 'border-pink-500 bg-pink-100 scale-105'
              : 'border-pink-300 bg-white/90'
          }`}
        >
          <motion.div
            animate={happyPet === 'cat' ? { y: [0, -10, 0] } : {}}
            className="text-5xl sm:text-6xl"
          >
            🐱
          </motion.div>
          <span className="mt-1 text-xs sm:text-sm font-black text-pink-900">Mèo con (Thích cá 🐟)</span>
          {happyPet === 'cat' && <span className="text-xs font-bold text-pink-600">Ngon quá meo!</span>}
        </div>

        {/* Dog */}
        <div
          ref={petRefs.dog}
          className={`flex flex-col items-center justify-center rounded-3xl border-4 p-3 shadow-md transition-all ${
            happyPet === 'dog'
              ? 'border-amber-500 bg-amber-100 scale-105'
              : 'border-amber-300 bg-white/90'
          }`}
        >
          <motion.div
            animate={happyPet === 'dog' ? { y: [0, -10, 0] } : {}}
            className="text-5xl sm:text-6xl"
          >
            🐶
          </motion.div>
          <span className="mt-1 text-xs sm:text-sm font-black text-amber-900">Cún con (Thích xương 🦴)</span>
          {happyPet === 'dog' && <span className="text-xs font-bold text-amber-600">Gâu gâu, cảm ơn bé!</span>}
        </div>

        {/* Rabbit */}
        <div
          ref={petRefs.rabbit}
          className={`flex flex-col items-center justify-center rounded-3xl border-4 p-3 shadow-md transition-all ${
            happyPet === 'rabbit'
              ? 'border-orange-500 bg-orange-100 scale-105'
              : 'border-orange-300 bg-white/90'
          }`}
        >
          <motion.div
            animate={happyPet === 'rabbit' ? { y: [0, -10, 0] } : {}}
            className="text-5xl sm:text-6xl"
          >
            🐰
          </motion.div>
          <span className="mt-1 text-xs sm:text-sm font-black text-orange-900">Thỏ trắng (Thích cà rốt 🥕)</span>
          {happyPet === 'rabbit' && <span className="text-xs font-bold text-orange-600">Cà rốt giòn ngọt!</span>}
        </div>
      </div>

      {/* Food Plates at bottom */}
      <div className="rounded-2xl bg-white/90 p-3 border-2 border-emerald-300 shadow-sm max-w-2xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 min-h-[64px]">
          {foods.map((food) => {
            if (food.eaten) return null;
            const isDragging = draggingId === food.id;

            return (
              <div
                key={food.id}
                onPointerDown={(e) => handlePointerDown(e, food.id)}
                className={`relative flex items-center gap-1.5 rounded-2xl bg-amber-50 p-2.5 border-2 border-amber-300 shadow-sm cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${
                  isDragging ? 'opacity-30' : ''
                }`}
              >
                <span className="text-3xl sm:text-4xl">{food.emoji}</span>
                <span className="text-xs font-bold text-slate-700 pr-1">{food.name}</span>

                {currentHintTier === 1 && nextFood?.id === food.id && (
                  <div className="pointer-events-none absolute -inset-2 rounded-2xl border-4 border-dashed border-rose-500 animate-spin" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Dragging Ghost */}
      {draggingId !== null && (
        <div
          style={{
            position: 'fixed',
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none z-50 flex items-center gap-1.5 rounded-2xl bg-white p-2.5 shadow-2xl border-3 border-emerald-500 scale-120"
        >
          <span className="text-4xl">
            {foods.find((f) => f.id === draggingId)?.emoji}
          </span>
          <span className="text-xs font-black text-emerald-900">
            {foods.find((f) => f.id === draggingId)?.name}
          </span>
        </div>
      )}
    </div>
  );
};
