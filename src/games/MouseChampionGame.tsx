import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Trophy } from 'lucide-react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface QuickChallenge {
  id: number;
  prompt: string;
  action: 'hover' | 'click' | 'dblclick' | 'rightclick' | 'drag';
  targetEmoji: string;
  targetLabel: string;
  destEmoji?: string;
  destLabel?: string;
}

export const MouseChampionGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  const [taskIndex, setTaskIndex] = useState(0);
  const [completedTasks, setCompletedTasks] = useState(0);
  const [startTime] = useState(Date.now());
  const [mistakes, setMistakes] = useState(0);
  const lastClickRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const finishedRef = useRef(false);

  const challenges: QuickChallenge[] = [
    { id: 1, prompt: 'Rê chuột chạm vào cầu vồng sắc màu!', action: 'hover', targetEmoji: '🌈', targetLabel: 'Cầu vồng' },
    { id: 2, prompt: 'Nháy chuột trái một lần vào quả táo đỏ!', action: 'click', targetEmoji: '🍎', targetLabel: 'Quả táo đỏ' },
    { id: 3, prompt: 'Nháy đúp thật nhanh 2 lần vào quả trứng!', action: 'dblclick', targetEmoji: '🥚', targetLabel: 'Quả trứng' },
    { id: 4, prompt: 'Nháy chuột phải vào hộp quà sinh nhật!', action: 'rightclick', targetEmoji: '🎁', targetLabel: 'Hộp quà' },
    { id: 5, prompt: 'Kéo chú cá béo đến cho bạn mèo ăn!', action: 'drag', targetEmoji: '🐟', targetLabel: 'Cá tươi', destEmoji: '🐱', destLabel: 'Mèo con' },
    { id: 6, prompt: 'Rê chuột lướt nhẹ qua ngôi sao vàng!', action: 'hover', targetEmoji: '⭐', targetLabel: 'Ngôi sao' },
    { id: 7, prompt: 'Nháy đúp chuột 2 lần để mở cánh cửa!', action: 'dblclick', targetEmoji: '🚪', targetLabel: 'Cánh cửa' },
    { id: 8, prompt: 'Nháy chuột trái chạm vào Chiếc Cúp Vàng!', action: 'click', targetEmoji: '🏆', targetLabel: 'Cúp vô địch' },
  ];

  const totalTasks = challenges.length;
  const currentTask = challenges[taskIndex] || challenges[0];

  const advanceTask = () => {
    if (finishedRef.current) return;
    audioEngine.playSuccess();
    onSuccess();
    const nextIdx = taskIndex + 1;
    setCompletedTasks(nextIdx);
    onProgress?.(nextIdx, totalTasks);

    if (nextIdx >= totalTasks && !finishedRef.current) {
      finishedRef.current = true;
      const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
      const accuracy = Math.max(60, Math.round((totalTasks / (totalTasks + mistakes)) * 100));
      const stars = 10;
      const score = 1500 + Math.max(0, 400 - timeTaken * 10);

      setTimeout(() => {
        onComplete({
          gameId: 20,
          score,
          stars,
          accuracy,
          timeTakenSeconds: timeTaken,
          correctCount: totalTasks,
          mistakeCount: mistakes,
        });
      }, 700);
    } else {
      setTimeout(() => setTaskIndex(nextIdx), 400);
    }
  };

  // Window pointer listeners for dragging task 5
  useEffect(() => {
    if (!isDragging) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      setIsDragging(false);
      if (destRef.current) {
        const rect = destRef.current.getBoundingClientRect();
        if (
          e.clientX >= rect.left - 25 &&
          e.clientX <= rect.right + 25 &&
          e.clientY >= rect.top - 25 &&
          e.clientY <= rect.bottom + 25
        ) {
          advanceTask();
          return;
        }
      }
      audioEngine.playError();
      onMistake();
      setMistakes((m) => m + 1);
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);

    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
    };
  }, [isDragging]);

  const handleHoverTarget = () => {
    if (currentTask.action === 'hover') {
      advanceTask();
    }
  };

  const handleClickTarget = (e: React.MouseEvent) => {
    if (currentTask.action === 'click') {
      advanceTask();
    } else if (currentTask.action === 'dblclick') {
      const now = Date.now();
      const diff = now - lastClickRef.current;
      lastClickRef.current = now;
      if (diff > 40 && diff < 650) {
        advanceTask();
      } else {
        audioEngine.playPop();
      }
    }
  };

  const handleDoubleClickTarget = () => {
    if (currentTask.action === 'dblclick') {
      advanceTask();
    }
  };

  const handleContextMenuTarget = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentTask.action === 'rightclick') {
      audioEngine.playRightClick();
      advanceTask();
    }
  };

  const handleDragStart = (e: React.PointerEvent) => {
    if (currentTask.action !== 'drag') return;
    e.preventDefault();
    audioEngine.playPop();
    setIsDragging(true);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-amber-100 via-yellow-50 to-orange-100 p-4 select-none flex flex-col justify-between"
    >
      {/* Top Banner Guide with Championship Badge */}
      <div className="z-20 self-center flex items-center gap-3 rounded-2xl bg-white px-6 py-2.5 border-2 border-amber-400 shadow-xl">
        <Trophy className="h-6 w-6 text-amber-500 fill-amber-400" />
        <div className="text-center">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wide">
            Thử thách Vô địch chuột: {taskIndex + 1}/{totalTasks}
          </span>
          <h3 className="text-base sm:text-lg font-black text-slate-800">{currentTask.prompt}</h3>
        </div>
      </div>

      {/* Main Championship Stage */}
      <div className="flex-1 flex items-center justify-center my-auto max-w-xl mx-auto w-full">
        <div className="relative flex flex-col sm:flex-row items-center justify-center gap-10">
          {/* Main Action Target */}
          <motion.div
            key={currentTask.id}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: 1.08 }}
            onMouseEnter={handleHoverTarget}
            onPointerEnter={handleHoverTarget}
            onClick={handleClickTarget}
            onDoubleClick={handleDoubleClickTarget}
            onContextMenu={handleContextMenuTarget}
            onPointerDown={handleDragStart}
            className="flex flex-col items-center justify-center rounded-3xl border-4 border-amber-400 bg-white p-6 shadow-2xl cursor-pointer"
          >
            <span className="text-6xl sm:text-7xl drop-shadow-md">
              {currentTask.targetEmoji}
            </span>
            <span className="mt-2 rounded-full bg-amber-200 px-3 py-1 text-xs font-black text-amber-950">
              {currentTask.targetLabel}
            </span>

            {/* Extra fallback button for right click challenge */}
            {currentTask.action === 'rightclick' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  audioEngine.playRightClick();
                  advanceTask();
                }}
                className="mt-2 rounded-lg bg-pink-100 hover:bg-pink-200 px-2 py-0.5 text-[10px] font-bold text-pink-900 border border-pink-300"
              >
                Nháy chuột phải (hoặc bấm đây)
              </button>
            )}
          </motion.div>

          {/* Destination for drag & drop challenge */}
          {currentTask.action === 'drag' && (
            <div
              ref={destRef}
              className="flex flex-col items-center justify-center rounded-3xl border-4 border-dashed border-emerald-400 bg-emerald-50 p-6 shadow-lg min-w-[130px] min-h-[130px]"
            >
              <span className="text-6xl sm:text-7xl">{currentTask.destEmoji}</span>
              <span className="mt-2 rounded-full bg-emerald-200 px-3 py-1 text-xs font-bold text-emerald-950">
                Thả vào đây!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Indicators along bottom */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {challenges.map((ch, i) => (
          <div
            key={ch.id}
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
              i < completedTasks
                ? 'bg-emerald-500 text-white shadow-xs'
                : i === taskIndex
                ? 'bg-amber-400 text-amber-950 ring-2 ring-amber-500 scale-110'
                : 'bg-white text-slate-400 border border-slate-200'
            }`}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Floating Dragging Ghost */}
      {isDragging && (
        <div
          style={{
            position: 'fixed',
            left: `${dragPos.x}px`,
            top: `${dragPos.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none z-50 flex items-center justify-center rounded-2xl bg-white p-3 shadow-2xl border-3 border-amber-500 scale-120"
        >
          <span className="text-5xl">{currentTask.targetEmoji}</span>
        </div>
      )}
    </div>
  );
};
