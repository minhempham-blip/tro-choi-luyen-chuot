import React, { useState, useEffect, useRef } from 'react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface RoomItem {
  id: number;
  emoji: string;
  name: string;
  category: 'toys' | 'books' | 'clothes';
  tidied: boolean;
}

export const TidyRoomGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shelfRefs = {
    toys: useRef<HTMLDivElement>(null),
    books: useRef<HTMLDivElement>(null),
    clothes: useRef<HTMLDivElement>(null),
  };

  const [items, setItems] = useState<RoomItem[]>([]);
  const [tidiedCount, setTidiedCount] = useState(0);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const finishedRef = useRef(false);

  const totalItemsCount = level === 1 ? 4 : level === 2 ? 6 : 9;

  const allItemsList: Omit<RoomItem, 'id' | 'tidied'>[] = [
    { emoji: '🧸', name: 'Gấu bông', category: 'toys' },
    { emoji: '🚗', name: 'Ô tô', category: 'toys' },
    { emoji: '🤖', name: 'Robot', category: 'toys' },
    { emoji: '📘', name: 'Sách Toán', category: 'books' },
    { emoji: '📕', name: 'Truyện cổ tích', category: 'books' },
    { emoji: '📗', name: 'Vở vẽ', category: 'books' },
    { emoji: '👕', name: 'Áo phông', category: 'clothes' },
    { emoji: '👗', name: 'Chiếc váy', category: 'clothes' },
    { emoji: '🧦', name: 'Đôi tất', category: 'clothes' },
  ];

  useEffect(() => {
    finishedRef.current = false;
    const selected = allItemsList.slice(0, totalItemsCount).map((it, idx) => ({
      ...it,
      id: idx,
      tidied: false,
    }));
    setItems(selected);
    setTidiedCount(0);
  }, [level, totalItemsCount]);

  // Global window pointer listeners while dragging to guarantee drag/drop never gets lost
  useEffect(() => {
    if (draggingId === null) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      const draggedItem = items.find((it) => it.id === draggingId);
      setDraggingId(null);
      if (!draggedItem || finishedRef.current) return;

      // Check drop zone intersection via bounding rects (100% reliable)
      let droppedCategory: 'toys' | 'books' | 'clothes' | null = null;
      (['toys', 'books', 'clothes'] as const).forEach((cat) => {
        const el = shelfRefs[cat].current;
        if (el) {
          const rect = el.getBoundingClientRect();
          // Add generous tolerance of 20px
          if (
            e.clientX >= rect.left - 20 &&
            e.clientX <= rect.right + 20 &&
            e.clientY >= rect.top - 20 &&
            e.clientY <= rect.bottom + 20
          ) {
            droppedCategory = cat;
          }
        }
      });

      if (droppedCategory === draggedItem.category) {
        audioEngine.playSwoosh();
        onSuccess();

        setItems((prev) =>
          prev.map((it) => (it.id === draggingId ? { ...it, tidied: true } : it))
        );

        const newCount = tidiedCount + 1;
        setTidiedCount(newCount);
        onProgress?.(newCount, totalItemsCount);

        if (newCount >= totalItemsCount && !finishedRef.current) {
          finishedRef.current = true;
          const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          const accuracy = Math.max(50, Math.round((newCount / (newCount + mistakes)) * 100));
          const stars = Math.min(10, Math.max(6, 11 - Math.floor(mistakes / 2)));
          const score = newCount * 150 + Math.max(0, 300 - timeTaken * 8);

          setTimeout(() => {
            onComplete({
              gameId: 15,
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
  }, [draggingId, items, tidiedCount, totalItemsCount, mistakes, startTime, onSuccess, onMistake, onComplete, onProgress]);

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    e.preventDefault();
    const target = items.find((it) => it.id === id);
    if (!target || target.tidied) return;

    audioEngine.playPop();
    setDraggingId(id);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const nextUntidied = items.find((it) => !it.tidied);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 via-amber-50 to-pink-50 p-4 select-none flex flex-col justify-between"
    >
      {/* Top Banner Guide */}
      <div className="z-20 self-center rounded-full bg-white/95 px-5 py-1 text-xs sm:text-sm font-bold text-slate-800 border border-amber-300 shadow-md">
        Nhấn giữ và kéo đồ vật vào đúng ngăn tủ: {tidiedCount}/{totalItemsCount}
      </div>

      {/* DROP ZONES: 3 Shelves (Toys, Books, Clothes) */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6 my-auto max-w-3xl mx-auto w-full">
        {/* Shelf 1: Toys */}
        <div
          ref={shelfRefs.toys}
          className="flex flex-col items-center justify-between rounded-2xl border-4 border-amber-400 bg-amber-100/90 p-3 shadow-md min-h-[140px] sm:min-h-[160px]"
        >
          <div className="flex items-center gap-1">
            <span className="text-2xl">🧸</span>
            <span className="text-xs sm:text-sm font-black text-amber-900">HÒM ĐỒ CHƠI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 my-2">
            {items
              .filter((it) => it.category === 'toys' && it.tidied)
              .map((it) => (
                <span key={it.id} className="text-2xl sm:text-3xl animate-bounce-gentle">
                  {it.emoji}
                </span>
              ))}
          </div>
          <span className="rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-bold text-amber-950">
            Kéo đồ chơi vào đây
          </span>
        </div>

        {/* Shelf 2: Books */}
        <div
          ref={shelfRefs.books}
          className="flex flex-col items-center justify-between rounded-2xl border-4 border-blue-400 bg-blue-100/90 p-3 shadow-md min-h-[140px] sm:min-h-[160px]"
        >
          <div className="flex items-center gap-1">
            <span className="text-2xl">📚</span>
            <span className="text-xs sm:text-sm font-black text-blue-900">GIÁ SÁCH VỞ</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 my-2">
            {items
              .filter((it) => it.category === 'books' && it.tidied)
              .map((it) => (
                <span key={it.id} className="text-2xl sm:text-3xl animate-bounce-gentle">
                  {it.emoji}
                </span>
              ))}
          </div>
          <span className="rounded-full bg-blue-300 px-2 py-0.5 text-[10px] font-bold text-blue-950">
            Kéo sách vở vào đây
          </span>
        </div>

        {/* Shelf 3: Clothes */}
        <div
          ref={shelfRefs.clothes}
          className="flex flex-col items-center justify-between rounded-2xl border-4 border-pink-400 bg-pink-100/90 p-3 shadow-md min-h-[140px] sm:min-h-[160px]"
        >
          <div className="flex items-center gap-1">
            <span className="text-2xl">👗</span>
            <span className="text-xs sm:text-sm font-black text-pink-900">TỦ QUẦN ÁO</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 my-2">
            {items
              .filter((it) => it.category === 'clothes' && it.tidied)
              .map((it) => (
                <span key={it.id} className="text-2xl sm:text-3xl animate-bounce-gentle">
                  {it.emoji}
                </span>
              ))}
          </div>
          <span className="rounded-full bg-pink-300 px-2 py-0.5 text-[10px] font-bold text-pink-950">
            Kéo quần áo vào đây
          </span>
        </div>
      </div>

      {/* Untidied items at bottom of room */}
      <div className="rounded-2xl bg-white/90 p-3 border-2 border-slate-200 shadow-sm max-w-3xl mx-auto w-full">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 min-h-[64px]">
          {items.map((it) => {
            if (it.tidied) return null;
            const isDragging = draggingId === it.id;

            return (
              <div
                key={it.id}
                onPointerDown={(e) => handlePointerDown(e, it.id)}
                className={`relative flex items-center gap-1 rounded-2xl bg-amber-100 p-2.5 border-2 border-amber-300 shadow-sm cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${
                  isDragging ? 'opacity-30' : ''
                }`}
              >
                <span className="text-3xl sm:text-4xl">{it.emoji}</span>
                <span className="text-xs font-bold text-slate-800 pr-1">{it.name}</span>

                {currentHintTier === 1 && nextUntidied?.id === it.id && (
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
          className="pointer-events-none z-50 flex items-center gap-1 rounded-2xl bg-white p-2.5 shadow-2xl border-3 border-blue-500 scale-110"
        >
          <span className="text-4xl">
            {items.find((it) => it.id === draggingId)?.emoji}
          </span>
          <span className="text-xs font-black text-blue-900">
            {items.find((it) => it.id === draggingId)?.name}
          </span>
        </div>
      )}
    </div>
  );
};
