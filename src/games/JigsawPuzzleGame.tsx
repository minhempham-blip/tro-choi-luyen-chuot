import React, { useState, useEffect, useRef } from 'react';
import { GameComponentProps } from '../state/types';
import { audioEngine } from '../audio/audioEngine';

interface PuzzlePiece {
  id: number;
  row: number;
  col: number;
  placed: boolean;
  color: string;
  icon: string;
}

export const JigsawPuzzleGame: React.FC<GameComponentProps> = ({
  level,
  easyMode,
  currentHintTier,
  onMistake,
  onSuccess,
  onComplete,
  onProgress,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [placedCount, setPlacedCount] = useState(0);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [mistakes, setMistakes] = useState(0);
  const [startTime] = useState(Date.now());
  const finishedRef = useRef(false);

  const rows = level === 1 ? 2 : level === 2 ? 2 : 3;
  const cols = level === 1 ? 2 : level === 2 ? 3 : 3;
  const totalPieces = rows * cols;

  const pieceIcons = ['🌈', '☀️', '🦋', '🌸', '🏡', '🌳', '🌻', '🍎', '⭐'];
  const pieceColors = [
    '#fbcfe8', '#fef08a', '#bae6fd', '#bbf7d0',
    '#fed7aa', '#e9d5ff', '#fde047', '#a7f3d0', '#ddd6fe'
  ];

  useEffect(() => {
    finishedRef.current = false;
    const list: PuzzlePiece[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const id = r * cols + c;
        list.push({
          id,
          row: r,
          col: c,
          placed: false,
          color: pieceColors[id % pieceColors.length],
          icon: pieceIcons[id % pieceIcons.length],
        });
      }
    }
    setPieces(list);
    setPlacedCount(0);
  }, [level, rows, cols]);

  // Window pointer listeners for smooth dragging
  useEffect(() => {
    if (draggingId === null) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      setDragPos({ x: e.clientX, y: e.clientY });
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      const draggedPiece = pieces.find((p) => p.id === draggingId);
      setDraggingId(null);
      if (!draggedPiece || finishedRef.current) return;

      // Check slot intersection
      let matchedSlotId: number | null = null;
      slotRefs.current.forEach((el, idx) => {
        if (el) {
          const rect = el.getBoundingClientRect();
          if (
            e.clientX >= rect.left - 20 &&
            e.clientX <= rect.right + 20 &&
            e.clientY >= rect.top - 20 &&
            e.clientY <= rect.bottom + 20
          ) {
            matchedSlotId = idx;
          }
        }
      });

      if (matchedSlotId === draggedPiece.id) {
        audioEngine.playSwoosh();
        onSuccess();

        setPieces((prev) =>
          prev.map((p) => (p.id === draggingId ? { ...p, placed: true } : p))
        );

        const newCount = placedCount + 1;
        setPlacedCount(newCount);
        onProgress?.(newCount, totalPieces);

        if (newCount >= totalPieces && !finishedRef.current) {
          finishedRef.current = true;
          const timeTaken = Math.max(1, Math.round((Date.now() - startTime) / 1000));
          const accuracy = Math.max(50, Math.round((newCount / (newCount + mistakes)) * 100));
          const stars = Math.min(10, Math.max(6, 11 - Math.floor(mistakes / 2)));
          const score = newCount * 180 + Math.max(0, 300 - timeTaken * 8);

          setTimeout(() => {
            onComplete({
              gameId: 17,
              score,
              stars,
              accuracy,
              timeTakenSeconds: timeTaken,
              correctCount: newCount,
              mistakeCount: mistakes,
            });
          }, 600);
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
  }, [draggingId, pieces, placedCount, totalPieces, mistakes, startTime, onSuccess, onMistake, onComplete, onProgress]);

  const handlePointerDown = (e: React.PointerEvent, id: number) => {
    e.preventDefault();
    const target = pieces.find((p) => p.id === id);
    if (!target || target.placed) return;

    audioEngine.playPop();
    setDraggingId(id);
    setDragPos({ x: e.clientX, y: e.clientY });
  };

  const nextUnplaced = pieces.find((p) => !p.placed);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-2xl bg-gradient-to-b from-sky-100 via-amber-50 to-emerald-50 p-4 select-none flex flex-col justify-between"
    >
      {/* Top Banner Guide */}
      <div className="z-20 self-center rounded-full bg-white/95 px-5 py-1 text-xs sm:text-sm font-bold text-slate-800 border border-amber-300 shadow-md">
        Kéo các mảnh ghép vào đúng ô trên khung tranh: {placedCount}/{totalPieces}
      </div>

      {/* Main Area: Puzzle Board + Available Pieces Tray */}
      <div className="flex flex-1 flex-col sm:flex-row items-center justify-center gap-6 my-auto max-w-4xl mx-auto w-full">
        {/* PUZZLE FRAME (SLOTS) */}
        <div className="relative rounded-2xl border-4 border-amber-700 bg-amber-100 p-3 shadow-xl">
          <div
            className="grid gap-2"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
            }}
          >
            {pieces.map((piece) => (
              <div
                key={piece.id}
                ref={(el) => {
                  slotRefs.current[piece.id] = el;
                }}
                className="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-xl border-2 border-dashed border-amber-400 bg-white/70"
              >
                {piece.placed ? (
                  <div
                    className="flex h-full w-full flex-col items-center justify-center rounded-lg shadow-sm"
                    style={{ backgroundColor: piece.color }}
                  >
                    <span className="text-3xl sm:text-4xl">{piece.icon}</span>
                  </div>
                ) : (
                  <span className="text-xl sm:text-2xl opacity-25">{piece.icon}</span>
                )}

                {currentHintTier === 1 && nextUnplaced?.id === piece.id && (
                  <div className="pointer-events-none absolute -inset-1 rounded-xl border-3 border-dashed border-rose-500 animate-spin" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* TRAY OF UNPLACED PIECES */}
        <div className="flex flex-col items-center rounded-2xl border-2 border-slate-300 bg-white/90 p-4 shadow-md max-w-xs">
          <span className="mb-2 text-xs font-bold text-slate-600">Mảnh ghép còn lại:</span>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {pieces.map((piece) => {
              if (piece.placed) return null;
              const isDragging = draggingId === piece.id;

              return (
                <div
                  key={piece.id}
                  onPointerDown={(e) => handlePointerDown(e, piece.id)}
                  className={`flex h-16 w-16 sm:h-20 sm:w-20 flex-col items-center justify-center rounded-xl border-2 border-amber-400 shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition-transform ${
                    isDragging ? 'opacity-30' : ''
                  }`}
                  style={{ backgroundColor: piece.color }}
                >
                  <span className="text-2xl sm:text-3xl">{piece.icon}</span>
                </div>
              );
            })}
          </div>
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
            backgroundColor: pieces.find((p) => p.id === draggingId)?.color,
          }}
          className="pointer-events-none z-50 flex h-20 w-20 flex-col items-center justify-center rounded-xl border-3 border-blue-500 shadow-2xl scale-110"
        >
          <span className="text-4xl">
            {pieces.find((p) => p.id === draggingId)?.icon}
          </span>
        </div>
      )}
    </div>
  );
};
