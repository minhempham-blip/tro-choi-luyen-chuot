import React from 'react';
import { Star } from 'lucide-react';
import { motion } from 'motion/react';

interface StarRatingProps {
  stars: number; // 0..10
  maxStars?: number; // default 10
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
}

export const StarRating: React.FC<StarRatingProps> = ({
  stars,
  maxStars = 10,
  size = 'sm',
  animate = false,
}) => {
  const sizeMap = {
    sm: 'w-3.5 h-3.5 sm:w-4 sm:h-4',
    md: 'w-5 h-5 sm:w-6 sm:h-6',
    lg: 'w-7 h-7 sm:w-8 sm:h-8',
  }[size];

  return (
    <div className="flex items-center gap-0.5 sm:gap-1" aria-label={`${stars} trên ${maxStars} sao`}>
      {Array.from({ length: maxStars }).map((_, idx) => {
        const isFilled = idx < stars;
        return (
          <motion.div
            key={idx}
            initial={animate ? { scale: 0, opacity: 0 } : false}
            animate={animate ? { scale: 1, opacity: 1 } : false}
            transition={{ delay: idx * 0.08, type: 'spring', stiffness: 350, damping: 20 }}
            className="relative"
          >
            <Star
              className={`${sizeMap} ${
                isFilled
                  ? 'fill-amber-400 text-amber-500 drop-shadow-[0_1px_2px_rgba(245,158,11,0.5)]'
                  : 'fill-slate-200 text-slate-300'
              } transition-colors`}
            />
            {isFilled && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="h-1 w-1 rounded-full bg-white/70" />
              </span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
