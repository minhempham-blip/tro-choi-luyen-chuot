import React from 'react';
import { motion } from 'motion/react';

export type TargetMouseButton = 'left' | 'right' | 'left-double' | 'move' | 'drag' | 'wheel';

interface AnimatedMouseProps {
  action: TargetMouseButton;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedMouse: React.FC<AnimatedMouseProps> = ({ action, size = 'md' }) => {
  const isLeftHighlighted = action === 'left' || action === 'left-double' || action === 'drag';
  const isRightHighlighted = action === 'right';
  const isWheelHighlighted = action === 'wheel';
  const isMoving = action === 'move';

  const containerSizes = {
    sm: 'w-28 h-36',
    md: 'w-40 h-52',
    lg: 'w-52 h-64',
  }[size];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none ${containerSizes}`}>
      {/* Gliding motion if action is move */}
      <motion.div
        animate={
          isMoving
            ? {
                x: [-24, 24, -24],
                y: [-6, 6, -6],
              }
            : action === 'drag'
            ? {
                x: [-18, 22, -18],
              }
            : {}
        }
        transition={{
          repeat: Infinity,
          duration: 2.2,
          ease: 'easeInOut',
        }}
        className="relative flex flex-col items-center"
      >
        {/* Mouse Wire / Cord */}
        <div className="h-6 w-1 rounded-full bg-slate-400" />

        {/* Mouse Body SVG */}
        <div className="relative h-36 w-28 drop-shadow-xl sm:h-44 sm:w-32">
          <svg viewBox="0 0 100 140" className="h-full w-full">
            <defs>
              <linearGradient id="mouseBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
              <linearGradient id="highlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="rightHighlightGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbcfe8" />
                <stop offset="100%" stopColor="#ec4899" />
              </linearGradient>
            </defs>

            {/* Mouse Main Base Shadow & Outline */}
            <path
              d="M 20 50 C 20 20, 80 20, 80 50 L 80 95 C 80 125, 20 125, 20 95 Z"
              fill="url(#mouseBodyGrad)"
              stroke="#64748b"
              strokeWidth="3.5"
            />

            {/* LEFT BUTTON */}
            <motion.path
              d="M 21 48 C 21 24, 46 22, 47 22 L 47 55 L 21 55 Z"
              fill={isLeftHighlighted ? (action === 'left-double' ? '#fbbf24' : '#facc15') : '#ffffff'}
              stroke="#64748b"
              strokeWidth="2.5"
              animate={
                action === 'left'
                  ? { fill: ['#ffffff', '#facc15', '#ffffff'], scale: [1, 0.96, 1] }
                  : action === 'left-double'
                  ? {
                      fill: ['#ffffff', '#f59e0b', '#ffffff', '#f59e0b', '#ffffff'],
                      scale: [1, 0.95, 1, 0.95, 1],
                    }
                  : action === 'drag'
                  ? { fill: '#fbbf24', scale: 0.97 }
                  : {}
              }
              transition={{ repeat: Infinity, duration: action === 'left-double' ? 1.4 : 1.6 }}
            />

            {/* RIGHT BUTTON */}
            <motion.path
              d="M 53 22 C 54 22, 79 24, 79 48 L 79 55 L 53 55 Z"
              fill={isRightHighlighted ? '#f472b6' : '#ffffff'}
              stroke="#64748b"
              strokeWidth="2.5"
              animate={
                action === 'right'
                  ? { fill: ['#ffffff', '#f472b6', '#ffffff'], scale: [1, 0.96, 1] }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.6 }}
            />

            {/* SCROLL WHEEL */}
            <motion.rect
              x="46"
              y="28"
              width="8"
              height="20"
              rx="4"
              fill={isWheelHighlighted ? '#0284c7' : '#94a3b8'}
              stroke="#475569"
              strokeWidth="2"
              animate={
                isWheelHighlighted
                  ? {
                      y: [28, 24, 32, 28],
                      fill: ['#38bdf8', '#0284c7', '#38bdf8'],
                    }
                  : {}
              }
              transition={{ repeat: Infinity, duration: 1.4 }}
            />

            {/* Palm Rest Contour */}
            <path
              d="M 32 90 Q 50 102 68 90"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          {/* Action Labels & Indicators */}
          {action === 'left' && (
            <motion.div
              animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="absolute -top-3 left-0 rounded-full bg-amber-400 px-2 py-0.5 text-[11px] font-extrabold text-amber-950 shadow"
            >
              Nháy 1 lần!
            </motion.div>
          )}

          {action === 'left-double' && (
            <motion.div
              animate={{ scale: [0.9, 1.15, 0.9], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute -top-4 -left-3 rounded-full bg-orange-500 px-2.5 py-0.5 text-[11px] font-black text-white shadow"
            >
              Tách - Tách!
            </motion.div>
          )}

          {action === 'right' && (
            <motion.div
              animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="absolute -top-3 right-0 rounded-full bg-pink-500 px-2 py-0.5 text-[11px] font-extrabold text-white shadow"
            >
              Chuột phải!
            </motion.div>
          )}

          {action === 'wheel' && (
            <motion.div
              animate={{ y: [-4, 4, -4] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-sky-500 px-2 py-0.5 text-[11px] font-extrabold text-white shadow whitespace-nowrap"
            >
              Cuộn con lăn ⇅
            </motion.div>
          )}

          {action === 'drag' && (
            <motion.div
              animate={{ x: [-10, 10, -10] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-2 py-0.5 text-[11px] font-extrabold text-white shadow whitespace-nowrap"
            >
              Nhấn giữ & Kéo!
            </motion.div>
          )}

          {action === 'move' && (
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-2.5 py-0.5 text-[11px] font-extrabold text-white shadow whitespace-nowrap"
            >
              Rê chuột nhẹ nhàng
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
