import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface FruitItem {
  id: number;
  type: 'strawberry' | 'banana' | 'orange';
  emoji: string;
  x: number; // percentage
  y: number; // percentage
  collected: boolean;
}

export const AreaSelectGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fruitRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [fruits, setFruits] = useState<FruitItem[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [isSelecting, setIsSelecting] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentPos, setCurrentPos] = useState({ x: 0, y: 0 });
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const finishedRef = useRef(false);

  const totalRounds = level === 1 ? 2 : 3;

  useEffect(() => {
    finishedRef.current = false;
    const items: FruitItem[] = [
      { id: 1, type: 'strawberry', emoji: '🍓', x: 38, y: 38, collected: false },
      { id: 2, type: 'strawberry', emoji: '🍓', x: 56, y: 40, collected: false },
      { id: 3, type: 'strawberry', emoji: '🍓', x: 42, y: 56, collected: false },
      { id: 4, type: 'strawberry', emoji: '🍓', x: 58, y: 58, collected: false },
      // Distractors far away
      { id: 5, type: 'banana', emoji: '🍌', x: 18, y: 25, collected: false },
      { id: 6, type: 'orange', emoji: '🍊', x: 82, y: 30, collected: false },
      { id: 7, type: 'banana', emoji: '🍌', x: 20, y: 75, collected: false },
      { id: 8, type: 'orange', emoji: '🍊', x: 80, y: 78, collected: false },
    ];
    setFruits(items);
  }, [currentRound]);

  // Global window pointer listeners for marquee selection
  useEffect(() => {
    if (!isSelecting) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      setCurrentPos({ x, y });
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      setIsSelecting(false);
      if (!containerRef.current || finishedRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const selMinX = Math.min(startPos.x, currentPos.x);
      const selMaxX = Math.max(startPos.x, currentPos.x);
      const selMinY = Math.min(startPos.y, currentPos.y);
      const selMaxY = Math.max(startPos.y, currentPos.y);

      // Must drag a minimum box (at least 25x25 px)
      if (selMaxX - selMinX < 25 || selMaxY - selMinY < 25) return;

      // Check which fruits are inside the marquee selection box
      const selectedFruits = fruits.filter((f) => {
        const fruitPixelX = (f.x / 100) * rect.width;
        const fruitPixelY = (f.y / 100) * rect.height;
        return (
          fruitPixelX >= selMinX &&
          fruitPixelX <= selMaxX &&
          fruitPixelY >= selMinY &&
          fruitPixelY <= selMaxY
        );
      });

      const selectedStrawberries = selectedFruits.filter((f) => f.type === 'strawberry');
      const wrongFruitsSelected = selectedFruits.filter((f) => f.type !== 'strawberry');
      const totalStrawberries = fruits.filter((f) => f.type === 'strawberry');

      if (
        selectedStrawberries.length === totalStrawberries.length &&
        wrongFruitsSelected.length === 0
      ) {
        // SUCCESSFUL SELECTION!
        audioEngine.playSuccess();
        onSuccess();

        setFruits((prev) =>
          prev.map((f) => (f.type === 'strawberry' ? { ...f, collected: true } : f))
        );

        const nextRound = currentRound + 1;
        onProgress?.(nextRound, totalRounds);

        if (nextRound >= totalRounds && !finishedRef.current) {
          finishedRef.current = true;
          const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          const accuracy = Math.max(50, Math.round((totalRounds / (totalRounds + mistakes)) * 100));
          const stars = Math.min(10, Math.max(6, 11 - Math.floor(mistakes / 2)));
          const score = totalRounds * 250 + Math.max(0, 300 - timeTaken * 8);

          setTimeout(() => {
            onComplete({
              gameId: 18,
              score,
              stars,
              accuracy,
              timeTakenSeconds: timeTaken,
              correctCount: totalRounds,
              mistakeCount: mistakes,
            });
          }, 600);
        } else {
          setTimeout(() => {
            setCurrentRound(nextRound);
          }, 700);
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
  }, [isSelecting, startPos, currentPos, fruits, currentRound, totalRounds, mistakes, startTime, onSuccess, onMistake, onComplete, onProgress]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsSelecting(true);
    setStartPos({ x, y });
    setCurrentPos({ x, y });
  };

  const selLeft = Math.min(startPos.x, currentPos.x);
  const selTop = Math.min(startPos.y, currentPos.y);
  const selWidth = Math.abs(currentPos.x - startPos.x);
  const selHeight = Math.abs(currentPos.y - startPos.y);

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 via-amber-50 to-pink-50 p-4 select-none cursor-crosshair flex flex-col justify-between"
    >
      {/* Top Banner Guide */}
      <div className="z-20 self-center rounded-full bg-white/95 px-5 py-1 text-xs sm:text-sm font-bold text-slate-800 border border-pink-300 shadow-md">
        Kéo chuột tạo khung chọn tất cả quả Dâu Tây: Vòng {currentRound + 1}/{totalRounds}
      </div>

      {/* Render Fruits */}
      {fruits.map((f, idx) => (
        <div
          key={f.id}
          ref={(el) => {
            fruitRefs.current[idx] = el;
          }}
          style={{
            position: 'absolute',
            left: `${f.x}%`,
            top: `${f.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none flex flex-col items-center"
        >
          <motion.div
            animate={f.collected ? { scale: 0, opacity: 0 } : { scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2 + (f.id % 3) * 0.4 }}
            className="text-4xl sm:text-5xl drop-shadow-md"
          >
            {f.emoji}
          </motion.div>
        </div>
      ))}

      {/* Active Marquee Selection Box */}
      {isSelecting && (
        <div
          style={{
            position: 'absolute',
            left: `${selLeft}px`,
            top: `${selTop}px`,
            width: `${selWidth}px`,
            height: `${selHeight}px`,
          }}
          className="pointer-events-none border-2 border-dashed border-blue-600 bg-blue-400/25 rounded-md shadow-sm"
        />
      )}

      {/* Hint marquee box outline */}
      {currentHintTier === 1 && (
        <div
          style={{
            position: 'absolute',
            left: '32%',
            top: '32%',
            width: '32%',
            height: '34%',
          }}
          className="pointer-events-none border-4 border-dashed border-rose-400 bg-rose-400/10 rounded-xl animate-pulse flex items-center justify-center text-xs font-bold text-rose-700"
        >
          Kéo khung trùm qua đây!
        </div>
      )}
    </div>
  );
};
