import React from 'react';
import { Play, Sparkles, X, Star, Layers, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import { GameMetadata } from '../../state/types';
import { AnimatedMouse } from './AnimatedMouse';
import { Mascot } from './Mascot';
import { audioEngine } from '../../audio/audioEngine';

interface TutorialModalProps {
  game: GameMetadata;
  selectedLevel: 1 | 2 | 3;
  selectedRound: 1 | 2;
  onSelectLevel: (lvl: 1 | 2 | 3) => void;
  onSelectRound: (rnd: 1 | 2) => void;
  onStart: (practice: boolean) => void;
  onClose: () => void;
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  game,
  selectedLevel,
  selectedRound,
  onSelectLevel,
  onSelectRound,
  onStart,
  onClose,
}) => {
  const handleStartGame = (practice: boolean) => {
    audioEngine.playClick();
    onStart(practice);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        className="relative my-auto w-full max-w-2xl overflow-hidden rounded-3xl border-8 border-pink-400 bg-amber-50 p-5 sm:p-7 shadow-2xl"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => {
            audioEngine.playClick();
            onClose();
          }}
          className="absolute right-4 top-4 rounded-full bg-rose-500 p-2 text-white shadow-md hover:bg-rose-600 transition-colors cursor-pointer z-20"
          title="Đóng"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Ribbon */}
        <div className="mb-3 text-center">
          <span className="inline-block rounded-full bg-blue-100 px-4 py-1 text-xs sm:text-sm font-bold text-blue-800 border border-blue-200">
            {game.groupName} · Bài tập {game.id}
          </span>
          <h2 className="mt-1 text-2xl font-black text-blue-900 sm:text-3xl">
            {game.title}
          </h2>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 items-center gap-4 sm:grid-cols-12">
          {/* Animated Mouse Model */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center rounded-2xl bg-white/90 p-3 sm:p-4 border-2 border-amber-200 shadow-sm">
            <span className="mb-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
              Thao tác chuột:
            </span>
            <AnimatedMouse action={game.targetMouseButton} size="md" />
            <div className="mt-2 rounded-xl bg-amber-100 px-3 py-1 text-center text-xs font-extrabold text-amber-900 border border-amber-300">
              {game.actionLabel}
            </div>
          </div>

          {/* Instructions and Mascot */}
          <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
            <div className="rounded-2xl bg-white p-3.5 sm:p-4 border-2 border-sky-200 shadow-sm">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs sm:text-sm font-extrabold text-sky-800 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Hướng dẫn bé làm quen
                </span>
              </div>
              <p className="text-sm sm:text-base font-semibold leading-relaxed text-slate-800">
                {game.detailedTutorial}
              </p>
            </div>

            {/* Mascot Cheer */}
            <div className="flex items-center justify-end">
              <Mascot
                character={game.id % 2 === 0 ? 'elephant' : 'tiger'}
                state="happy"
                size="sm"
                bubbleText="Bé hãy chọn Màn & Vòng bên dưới rồi bắt đầu nhé!"
              />
            </div>
          </div>
        </div>

        {/* LEVEL & ROUND SELECTOR SECTION */}
        <div className="mt-4 rounded-2xl bg-white/95 p-3 sm:p-4 border-2 border-pink-300 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Level Selector */}
            <div>
              <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                <span>1. Chọn độ khó (Màn):</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    { lvl: 1, label: 'DỄ', stars: '⭐', color: 'emerald' },
                    { lvl: 2, label: 'VỪA', stars: '⭐⭐', color: 'amber' },
                    { lvl: 3, label: 'KHÓ', stars: '⭐⭐⭐', color: 'rose' },
                  ] as const
                ).map((item) => {
                  const isSelected = selectedLevel === item.lvl;
                  return (
                    <button
                      key={item.lvl}
                      type="button"
                      onClick={() => {
                        audioEngine.playClick();
                        onSelectLevel(item.lvl);
                      }}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl font-black text-xs transition-all cursor-pointer border-2 ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-700 shadow-md scale-102'
                          : 'bg-slate-50 hover:bg-blue-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>Màn {item.label}</span>
                      <span className="text-[10px] opacity-90">{item.stars}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Round Selector (Vòng 1 & Vòng 2) */}
            <div>
              <div className="text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-indigo-500" />
                <span>2. Chọn Vòng chơi (2 vòng):</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    { rnd: 1, label: 'VÒNG 1', desc: 'Căn bản' },
                    { rnd: 2, label: 'VÒNG 2', desc: 'Thử thách' },
                  ] as const
                ).map((item) => {
                  const isSelected = selectedRound === item.rnd;
                  return (
                    <button
                      key={item.rnd}
                      type="button"
                      onClick={() => {
                        audioEngine.playClick();
                        onSelectRound(item.rnd);
                      }}
                      className={`flex flex-col items-center justify-center py-2 px-2 rounded-xl font-black text-xs transition-all cursor-pointer border-2 ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-700 shadow-md scale-102'
                          : 'bg-slate-50 hover:bg-indigo-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>{item.label}</span>
                      <span className="text-[10px] opacity-90 font-medium">({item.desc})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleStartGame(true)}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-sm sm:text-base transition-transform active:scale-95 shadow-sm cursor-pointer"
          >
            Chơi thử (Không tính điểm)
          </button>
          <button
            type="button"
            onClick={() => handleStartGame(false)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-black text-base sm:text-lg transition-transform active:scale-95 shadow-lg flex items-center justify-center gap-2 cursor-pointer border-2 border-white"
          >
            <Play className="h-5 w-5 fill-current" />
            <span>BẮT ĐẦU: MÀN {selectedLevel === 1 ? 'DỄ' : selectedLevel === 2 ? 'VỪA' : 'KHÓ'} - VÒNG {selectedRound}!</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
