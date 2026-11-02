import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { audioEngine } from '../../audio/audioEngine';

export type MascotState = 'idle' | 'happy' | 'cheering' | 'hinting' | 'thinking';

interface MascotProps {
  state?: MascotState;
  bubbleText?: string;
  size?: 'sm' | 'md' | 'lg';
  character?: 'tiger' | 'elephant';
  onClick?: () => void;
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({
  state = 'idle',
  bubbleText,
  size = 'md',
  character = 'tiger',
  onClick,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  }[size];

  const handleBubbleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bubbleText) {
      audioEngine.playPop();
    }
    onClick?.();
  };

  return (
    <div className={`relative flex items-end gap-3 select-none ${className}`}>
      {/* Speech Bubble */}
      <AnimatePresence>
        {bubbleText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="relative z-30 max-w-xs cursor-pointer rounded-2xl bg-amber-50 p-3.5 shadow-lg border-2 border-amber-300 text-amber-950"
            onClick={handleBubbleClick}
          >
            {/* Bubble Tail */}
            <div className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border-b-2 border-r-2 border-amber-300 bg-amber-50" />
            <div className="flex items-start gap-2">
              <span className="text-sm font-semibold leading-relaxed sm:text-base">
                {bubbleText}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mascot SVG Vector Character */}
      <motion.div
        animate={
          state === 'cheering'
            ? { y: [0, -12, 0, -12, 0], rotate: [0, -4, 4, -4, 0] }
            : state === 'happy'
            ? { y: [0, -8, 0], rotate: [-2, 2, -2] }
            : state === 'thinking'
            ? { rotate: [0, 5, 0] }
            : { y: [0, -4, 0] }
        }
        transition={{
          repeat: Infinity,
          duration: state === 'cheering' ? 1.2 : 2.5,
          ease: 'easeInOut',
        }}
        onClick={() => {
          audioEngine.playPop();
          onClick?.();
        }}
        className={`${sizeClasses} cursor-pointer drop-shadow-md transition-transform hover:scale-105 active:scale-95`}
        title="Bạn mascot ngộ nghĩnh"
      >
        {character === 'tiger' ? (
          /* Little Tiger (Bé Hổ Con Trượt Tuyết) */
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {/* Ears */}
            <circle cx="28" cy="24" r="14" fill="#f97316" stroke="#c2410c" strokeWidth="2.5" />
            <circle cx="28" cy="24" r="8" fill="#fef08a" />
            <circle cx="72" cy="24" r="14" fill="#f97316" stroke="#c2410c" strokeWidth="2.5" />
            <circle cx="72" cy="24" r="8" fill="#fef08a" />

            {/* Head */}
            <circle cx="50" cy="52" r="34" fill="#fb923c" stroke="#c2410c" strokeWidth="3" />

            {/* Cheek patches */}
            <ellipse cx="32" cy="62" rx="12" ry="8" fill="#fef9c3" />
            <ellipse cx="68" cy="62" rx="12" ry="8" fill="#fef9c3" />

            {/* Tiger stripes */}
            <path d="M 50 20 L 50 30" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
            <path d="M 42 24 L 46 32" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
            <path d="M 58 24 L 54 32" stroke="#7c2d12" strokeWidth="3" strokeLinecap="round" />
            {/* Side stripes */}
            <path d="M 20 48 L 28 50" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 80 48 L 72 50" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />

            {/* Eyes */}
            {state === 'happy' || state === 'cheering' ? (
              // Happy squinting curves
              <>
                <path d="M 34 46 Q 40 40 46 46" fill="none" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
                <path d="M 54 46 Q 60 40 66 46" fill="none" stroke="#431407" strokeWidth="3" strokeLinecap="round" />
              </>
            ) : (
              // Big curious round eyes with shine
              <>
                <circle cx="40" cy="46" r="6" fill="#431407" />
                <circle cx="38" cy="44" r="2.2" fill="#ffffff" />
                <circle cx="60" cy="46" r="6" fill="#431407" />
                <circle cx="58" cy="44" r="2.2" fill="#ffffff" />
              </>
            )}

            {/* Rosy cheeks */}
            <ellipse cx="30" cy="56" rx="6" ry="4" fill="#fb7185" opacity="0.75" />
            <ellipse cx="70" cy="56" rx="6" ry="4" fill="#fb7185" opacity="0.75" />

            {/* Cute nose and mouth */}
            <polygon points="46,55 54,55 50,60" fill="#f43f5e" />
            <path d="M 50 60 Q 45 66 42 63" fill="none" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 50 60 Q 55 66 58 63" fill="none" stroke="#431407" strokeWidth="2.5" strokeLinecap="round" />

            {/* Cute Scarf */}
            <path
              d="M 28 78 Q 50 86 72 78 Q 75 88 50 92 Q 25 88 28 78 Z"
              fill="#38bdf8"
              stroke="#0284c7"
              strokeWidth="2.5"
            />
            {/* Scarf knot tail */}
            <path d="M 58 84 L 66 98 L 74 94 L 64 82 Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="2" />
          </svg>
        ) : (
          /* Little Elephant (Bé Voi Nhỏ) */
          <svg viewBox="0 0 100 100" className="h-full w-full">
            {/* Big Ears */}
            <ellipse cx="20" cy="46" rx="18" ry="24" fill="#93c5fd" stroke="#2563eb" strokeWidth="2.5" />
            <ellipse cx="20" cy="46" rx="10" ry="16" fill="#fbcfe8" />
            <ellipse cx="80" cy="46" rx="18" ry="24" fill="#93c5fd" stroke="#2563eb" strokeWidth="2.5" />
            <ellipse cx="80" cy="46" rx="10" ry="16" fill="#fbcfe8" />

            {/* Head */}
            <circle cx="50" cy="50" r="30" fill="#60a5fa" stroke="#2563eb" strokeWidth="3" />

            {/* Eyes */}
            <circle cx="40" cy="44" r="5" fill="#1e3a8a" />
            <circle cx="38" cy="42" r="1.8" fill="#ffffff" />
            <circle cx="60" cy="44" r="5" fill="#1e3a8a" />
            <circle cx="58" cy="42" r="1.8" fill="#ffffff" />

            {/* Rosy cheeks */}
            <circle cx="32" cy="52" r="5" fill="#fb7185" opacity="0.7" />
            <circle cx="68" cy="52" r="5" fill="#fb7185" opacity="0.7" />

            {/* Trunk */}
            <path
              d="M 46 54 Q 50 72 62 70 Q 68 68 66 62"
              fill="none"
              stroke="#3b82f6"
              strokeWidth="7"
              strokeLinecap="round"
            />
            {/* Little cap */}
            <path d="M 38 24 Q 50 16 62 24 L 56 12 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          </svg>
        )}
      </motion.div>
    </div>
  );
};
