import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, ArrowRight, Home, Award, Star, Sparkles, CheckCircle2 } from 'lucide-react';
import { GameResult } from '../../state/types';
import { Mascot } from './Mascot';
import { audioEngine } from '../../audio/audioEngine';

interface VictoryModalProps {
  result: GameResult;
  currentLevel: 1 | 2 | 3;
  currentRound: 1 | 2;
  hasNextGame: boolean;
  onReplay: () => void;
  onNextRoundOrLevel: () => void;
  onSelectLevelRound?: (level: 1 | 2 | 3, round: 1 | 2) => void;
  onNextGame: () => void;
  onHome: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  result,
  currentLevel,
  currentRound,
  hasNextGame,
  onReplay,
  onNextRoundOrLevel,
  onSelectLevelRound,
  onNextGame,
  onHome,
}) => {
  const [animatedStars, setAnimatedStars] = useState(0);

  const levelNames: Record<1 | 2 | 3, string> = {
    1: 'DỄ',
    2: 'VỪA',
    3: 'KHÓ',
  };

  const isLastRoundOfLevel = currentRound === 2;
  const isAllLevelsCompleted = currentLevel === 3 && currentRound === 2;

  useEffect(() => {
    // Play celebratory fanfare
    audioEngine.playFanfare();

    // Animate stars sequentially with audio chime
    let current = 0;
    const interval = setInterval(() => {
      if (current < result.stars) {
        current += 1;
        setAnimatedStars(current);
        audioEngine.playStarChime(current);
      } else {
        clearInterval(interval);
      }
    }, 200);

    return () => {
      clearInterval(interval);
    };
  }, [result.stars]);

  // Determine next step text
  const getNextActionDetails = () => {
    if (currentRound === 1) {
      return {
        title: `CHƠI TIẾP VÒNG 2 (MÀN ${levelNames[currentLevel]})`,
        subtitle: 'Thử thách vòng 2 để hoàn thành trọn vẹn màn này!',
        color: 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700',
        badge: 'Vòng 2',
      };
    }
    if (currentLevel === 1) {
      return {
        title: 'LÊN MÀN VỪA (VÒNG 1)',
        subtitle: 'Bé đã qua Màn Dễ! Tiến lên Màn Vừa nào!',
        color: 'from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700',
        badge: 'Màn Vừa',
      };
    }
    if (currentLevel === 2) {
      return {
        title: 'LÊN MÀN KHÓ (VÒNG 1)',
        subtitle: 'Tuyệt đỉnh! Thử sức với Màn Khó nhất!',
        color: 'from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700',
        badge: 'Màn Khó',
      };
    }
    return {
      title: 'SANG BÀI TIẾP THEO',
      subtitle: `Bé đã chiến thắng toàn bộ 3 màn (6 vòng) của Bài ${result.gameId}!`,
      color: 'from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700',
      badge: 'Bài mới',
    };
  };

  const nextAction = getNextActionDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="relative my-auto w-full max-w-xl overflow-hidden rounded-3xl border-8 border-pink-400 bg-amber-50 p-5 sm:p-7 text-center shadow-2xl"
      >
        {/* Floating Confetti Elements */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 18 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: -20, x: (i % 6) * 80, opacity: 1, rotate: 0 }}
              animate={{
                y: [0, 450],
                x: [(i % 6) * 80, (i % 6) * 80 + (i % 2 === 0 ? 40 : -40)],
                rotate: [0, 360],
                opacity: [1, 0],
              }}
              transition={{
                duration: 2.5 + (i % 3) * 0.5,
                repeat: Infinity,
                delay: i * 0.1,
              }}
              className="absolute h-3 w-3 rounded-xs"
              style={{
                backgroundColor: ['#f43f5e', '#3b82f6', '#eab308', '#22c55e', '#a855f7'][i % 5],
              }}
            />
          ))}
        </div>

        {/* Mascot Cheering */}
        <div className="flex justify-center -mt-1 mb-2">
          <Mascot character="tiger" state="cheering" size="sm" />
        </div>

        {/* Level & Round Completed Tag */}
        <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-black text-blue-900 border border-blue-300 shadow-xs mb-1">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>
            HOÀN THÀNH: MÀN {levelNames[currentLevel]} · VÒNG {currentRound}/2
          </span>
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-rose-600 drop-shadow-xs">
          XUẤT SẮC! BÉ GIỎI QUÁ!
        </h2>

        {/* 10 Stars Reward Display */}
        <div className="my-3 flex flex-col items-center rounded-2xl bg-white/95 p-3.5 border-2 border-amber-200 shadow-inner">
          <div className="mb-1 text-xs font-bold text-slate-500 uppercase tracking-wider">
            Thành tích đạt được ({result.stars}/10 Sao)
          </div>
          <div className="flex flex-wrap justify-center gap-1 sm:gap-1.5">
            {Array.from({ length: 10 }).map((_, idx) => {
              const isFilled = idx < animatedStars;
              return (
                <motion.div
                  key={idx}
                  animate={isFilled ? { scale: [1, 1.35, 1] } : {}}
                  transition={{ duration: 0.25 }}
                >
                  <Star
                    className={`h-6 w-6 sm:h-7 sm:w-7 ${
                      isFilled
                        ? 'fill-amber-400 text-amber-500 drop-shadow-[0_2px_4px_rgba(245,158,11,0.6)]'
                        : 'fill-slate-200 text-slate-300'
                    }`}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm font-bold mb-4">
          <div className="rounded-xl bg-blue-50 p-2 border border-blue-200">
            <div className="text-slate-500 text-[10px]">ĐIỂM SỐ</div>
            <div className="text-base sm:text-lg font-black text-blue-700">{result.score}</div>
          </div>
          <div className="rounded-xl bg-emerald-50 p-2 border border-emerald-200">
            <div className="text-slate-500 text-[10px]">ĐỘ CHÍNH XÁC</div>
            <div className="text-base sm:text-lg font-black text-emerald-700">{Math.round(result.accuracy)}%</div>
          </div>
          <div className="rounded-xl bg-purple-50 p-2 border border-purple-200">
            <div className="text-slate-500 text-[10px]">THỜI GIAN</div>
            <div className="text-base sm:text-lg font-black text-purple-700">{result.timeTakenSeconds}s</div>
          </div>
        </div>

        {/* PRIMARY BIG ACTION BUTTON: NEXT ROUND OR NEXT LEVEL */}
        <div className="mb-3">
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              if (isAllLevelsCompleted && hasNextGame) {
                onNextGame();
              } else {
                onNextRoundOrLevel();
              }
            }}
            className={`w-full flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-gradient-to-r ${nextAction.color} text-white font-black transition-all active:scale-98 shadow-lg cursor-pointer border-2 border-white`}
          >
            <div className="text-left">
              <div className="text-sm sm:text-base tracking-wide flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span>{nextAction.title}</span>
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-white/90">
                {nextAction.subtitle}
              </div>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white shadow-inner">
              <ArrowRight className="h-5 w-5" />
            </div>
          </button>
        </div>

        {/* QUICK LEVEL & ROUND JUMPER CHIPS */}
        <div className="mb-4 rounded-2xl bg-white/80 p-2.5 border border-amber-200">
          <div className="text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
            Chọn nhanh Màn và Vòng bất kỳ:
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {([1, 2, 3] as const).map((lvl) => (
              <div key={lvl} className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-500">
                  Màn {levelNames[lvl]}
                </span>
                <div className="grid grid-cols-2 gap-1">
                  {([1, 2] as const).map((rnd) => {
                    const isCurrent = currentLevel === lvl && currentRound === rnd;
                    return (
                      <button
                        key={rnd}
                        type="button"
                        onClick={() => {
                          audioEngine.playClick();
                          onSelectLevelRound?.(lvl, rnd);
                        }}
                        className={`rounded-lg py-1 text-[11px] font-bold transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-amber-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        Vòng {rnd}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM ACTION BUTTONS */}
        <div className="flex flex-row items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onHome();
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs sm:text-sm transition-transform active:scale-95 cursor-pointer"
          >
            <Home className="h-4 w-4" />
            <span>Về Menu</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onReplay();
            }}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold text-xs sm:text-sm transition-transform active:scale-95 shadow-xs cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Chơi lại vòng này</span>
          </button>

          {hasNextGame && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playClick();
                onNextGame();
              }}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm transition-transform active:scale-95 shadow-xs cursor-pointer"
            >
              <span>Bài sau</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
