import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Hand, MousePointer, HelpCircle } from 'lucide-react';
import { speechService } from '../../audio/speech';
import { audioEngine } from '../../audio/audioEngine';
import { Mascot } from './Mascot';

interface HintSystemProps {
  currentTier: 0 | 1 | 2 | 3;
  hintText: string;
  targetCoords?: { x: number; y: number } | null;
  onDismissTier2?: () => void;
}

export const HintSystem: React.FC<HintSystemProps> = ({
  currentTier,
  hintText,
  targetCoords,
  onDismissTier2,
}) => {
  // Silent hint display without voice disruption

  if (currentTier === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-40">
      {/* TIER 1: Pulsing pointing hand & circle at target */}
      {currentTier === 1 && targetCoords && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.5, opacity: 0 }}
          style={{
            position: 'absolute',
            left: `${targetCoords.x}px`,
            top: `${targetCoords.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
          className="flex flex-col items-center pointer-events-none"
        >
          {/* Target Glowing Ring */}
          <div className="h-16 w-16 rounded-full border-4 border-amber-400 bg-amber-400/20 animate-pulse-ring" />
          {/* Bouncing Hand pointer */}
          <motion.div
            animate={{ y: [-10, 0, -10] }}
            transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
            className="absolute -top-12 flex flex-col items-center"
          >
            <div className="rounded-full bg-amber-500 p-2 text-white shadow-lg">
              <Hand className="h-6 w-6 rotate-180" />
            </div>
            <span className="mt-1 rounded-md bg-amber-900/90 px-2 py-0.5 text-[11px] font-bold text-white shadow">
              Ở đây nè!
            </span>
          </motion.div>
        </motion.div>
      )}

      {/* TIER 2: Mascot speech bubble pop-up in bottom-right */}
      <AnimatePresence>
        {currentTier === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="pointer-events-auto absolute bottom-4 right-4 flex items-end gap-2"
          >
            <div className="relative max-w-sm rounded-2xl border-4 border-amber-400 bg-amber-50 p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                  <HelpCircle className="h-4 w-4" />
                  Gợi ý từ Chú Hổ
                </span>
                {onDismissTier2 && (
                  <button
                    type="button"
                    onClick={() => {
                      audioEngine.playPop();
                      onDismissTier2();
                    }}
                    className="text-xs font-bold text-slate-500 hover:text-slate-800 px-1"
                  >
                    Đã hiểu ✕
                  </button>
                )}
              </div>
              <p className="text-sm sm:text-base font-bold text-amber-950">{hintText}</p>
            </div>
            <Mascot character="tiger" state="hinting" size="sm" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* TIER 3: Ghost Cursor Performing the Action */}
      {currentTier === 3 && targetCoords && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-lg">
            Thao tác mẫu của hệ thống: Chú ý quan sát nhé!
          </div>

          <motion.div
            animate={{
              x: [targetCoords.x - 120, targetCoords.x, targetCoords.x],
              y: [targetCoords.y - 80, targetCoords.y, targetCoords.y],
              scale: [1, 1, 0.85, 1],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.2,
              times: [0, 0.6, 0.75, 1],
            }}
            style={{ position: 'absolute', left: 0, top: 0 }}
            className="z-50 flex items-center gap-2"
          >
            <div className="rounded-full bg-rose-500 p-2 text-white shadow-xl ring-4 ring-rose-200">
              <MousePointer className="h-6 w-6" />
            </div>
            <span className="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-rose-600 shadow-md">
              Mẫu: Bấm ở đây!
            </span>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
