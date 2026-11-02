import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Settings,
  User,
  Star,
  Sparkles,
  Volume2,
  VolumeX,
  Music,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { GameMetadata, StudentProfile, AppSettings, UserAccount } from '../../state/types';
import { GAME_LIST } from '../../data/gameList';
import { StarRating } from '../common/StarRating';
import { Mascot } from '../common/Mascot';
import { audioEngine } from '../../audio/audioEngine';

interface MenuScreenProps {
  student: StudentProfile;
  settings: AppSettings;
  currentUser?: UserAccount | null;
  onLogout?: () => void;
  onSelectGame: (game: GameMetadata) => void;
  onOpenTeacherModal: () => void;
  onOpenStudentModal: () => void;
  onToggleSound: () => void;
  onToggleMusic: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({
  student,
  settings,
  currentUser,
  onLogout,
  onSelectGame,
  onOpenTeacherModal,
  onOpenStudentModal,
  onToggleSound,
  onToggleMusic,
  onToggleFullscreen,
  isFullscreen,
}) => {
  const [currentPage, setCurrentPage] = useState(0); // 0..3 (4 pages)

  // 6 games per page
  const pageSize = 6;
  const totalPages = Math.ceil(GAME_LIST.length / pageSize); // 4 pages
  const currentGames = GAME_LIST.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  const totalStarsEarned = Object.values(student.stars).reduce((a, b) => a + b, 0);

  const handlePrevPage = () => {
    if (currentPage > 0) {
      audioEngine.playPop();
      setCurrentPage((p) => p - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      audioEngine.playPop();
      setCurrentPage((p) => p + 1);
    }
  };

  const handleGameCardHover = () => {
    audioEngine.playPop();
  };

  // Game thumbnail visual badges
  const gameThumbnails: Record<number, { emoji: string; bg: string }> = {
    1: { emoji: '🪄', bg: 'from-pink-400 via-purple-300 to-amber-300' },
    2: { emoji: '🐝', bg: 'from-amber-300 via-yellow-200 to-emerald-300' },
    3: { emoji: '🏮', bg: 'from-purple-300 to-indigo-500' },
    4: { emoji: '🛸', bg: 'from-indigo-600 via-purple-600 to-pink-500' },
    5: { emoji: '🎯', bg: 'from-amber-300 via-rose-400 to-emerald-400' },
    6: { emoji: '🦔', bg: 'from-amber-300 to-amber-600' },
    7: { emoji: '🧁', bg: 'from-pink-300 via-rose-300 to-amber-300' },
    8: { emoji: '🎆', bg: 'from-purple-400 to-indigo-600' },
    9: { emoji: '🎹', bg: 'from-purple-400 via-pink-400 to-indigo-600' },
    10: { emoji: '🔮', bg: 'from-indigo-500 via-purple-400 to-pink-500' },
    11: { emoji: '🏡', bg: 'from-rose-300 to-pink-500' },
    12: { emoji: '👑', bg: 'from-amber-300 to-yellow-500' },
    13: { emoji: '🧙‍♂️', bg: 'from-purple-600 via-indigo-500 to-pink-500' },
    14: { emoji: '🎁', bg: 'from-rose-300 to-red-500' },
    15: { emoji: '🧸', bg: 'from-amber-200 to-emerald-300' },
    16: { emoji: '🐱', bg: 'from-emerald-300 to-teal-400' },
    17: { emoji: '🧩', bg: 'from-indigo-300 to-purple-400' },
    18: { emoji: '🍓', bg: 'from-pink-300 to-rose-400' },
    19: { emoji: '🤿', bg: 'from-cyan-400 via-blue-500 to-indigo-800' },
    20: { emoji: '🏆', bg: 'from-amber-300 to-yellow-500' },
  };

  return (
    <div className="relative flex h-[92vh] w-full max-w-6xl flex-col items-center justify-between rounded-3xl border-8 border-pink-400 candy-stripe-border wood-board-pattern p-4 sm:p-6 shadow-2xl">
      {/* --- TOP ROW --- */}
      <div className="flex w-full items-start justify-between gap-3">
        {/* Student Profile Info on Top Left */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onOpenStudentModal();
            }}
            className="flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-1.5 shadow-md border-2 border-amber-300 hover:bg-amber-50 active:scale-95 transition-all cursor-pointer"
            title="Đổi tên học sinh"
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-xs ${
              currentUser?.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
            }`}>
              {currentUser?.role === 'admin' ? <ShieldCheck className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className="text-left">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                {currentUser?.role === 'admin' ? 'Quản Trị Viên' : 'Học Sinh'}
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-800 leading-tight block">
                {currentUser?.displayName || student.name}
              </span>
            </div>
          </button>

          {/* Logout Button if logged in */}
          {currentUser && onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-300 shadow-sm hover:bg-rose-50 hover:text-rose-600 active:scale-90 transition-transform cursor-pointer"
              title="Đăng xuất tài khoản"
            >
              <LogOut className="h-4 w-4" />
            </button>
          )}

          {/* Total Stars Counter */}
          <div className="flex items-center gap-1.5 rounded-2xl bg-amber-400 px-3.5 py-2 shadow-md border-2 border-amber-500 text-amber-950 font-black text-xs sm:text-sm">
            <Star className="h-4 w-4 fill-amber-100 text-amber-900" />
            <span>{totalStarsEarned} / 200 Sao</span>
          </div>
        </div>

        {/* Title Header with Pink Underline (Placed on top right as specified) */}
        <div className="flex flex-col items-center sm:items-end">
          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight text-blue-900 text-stroke-white-2 drop-shadow-md">
            NHANH TAY LẸ MẮT
          </h1>
          <div className="h-2 w-48 sm:w-64 rounded-full bg-pink-500 shadow-sm" />
          <span className="mt-1 text-xs sm:text-sm font-extrabold text-blue-800">
            Luyện Thao Tác Chuột Máy Tính
          </span>
        </div>

        {/* Top-Right Control Buttons (Fullscreen + Sound + Teacher) */}
        <div className="flex items-center gap-1.5">
          {/* Sound FX Toggle */}
          <button
            type="button"
            onClick={onToggleSound}
            className={`rounded-xl p-2 transition-transform active:scale-90 shadow-sm ${
              settings.soundEnabled
                ? 'bg-amber-300 text-amber-950 hover:bg-amber-400'
                : 'bg-slate-300 text-slate-600'
            }`}
            title="Âm thanh"
          >
            {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </button>

          {/* Music BGM Toggle */}
          <button
            type="button"
            onClick={onToggleMusic}
            className={`rounded-xl p-2 transition-transform active:scale-90 shadow-sm ${
              settings.musicEnabled
                ? 'bg-pink-300 text-pink-950 hover:bg-pink-400'
                : 'bg-slate-300 text-slate-600'
            }`}
            title="Nhạc nền"
          >
            <Music className="h-4 w-4" />
          </button>

          {/* Fullscreen Toggle (Green/Cyan button as requested) */}
          <button
            type="button"
            onClick={onToggleFullscreen}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-md hover:bg-emerald-600 active:scale-90 transition-transform cursor-pointer"
            title={isFullscreen ? 'Thu nhỏ màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>

          {/* Teacher Mode Button (Red/Pink button) */}
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onOpenTeacherModal();
            }}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white shadow-md hover:bg-rose-600 active:scale-90 transition-transform cursor-pointer"
            title="Trang Giáo viên"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* --- MAIN GAME SELECTION GRID (3 COLS × 2 ROWS) --- */}
      <div className="relative flex flex-1 items-center justify-center w-full px-12 sm:px-14 my-2">
        {/* Pink Rounded Previous Page Arrow */}
        <button
          type="button"
          onClick={handlePrevPage}
          disabled={currentPage === 0}
          className={`absolute left-0 z-20 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-pink-500 text-white shadow-xl border-4 border-white transition-all cursor-pointer ${
            currentPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110 active:scale-95 hover:bg-pink-600'
          }`}
          title="Trang trước"
        >
          <ChevronLeft className="h-8 w-8 stroke-[3]" />
        </button>

        {/* 3×2 Game Cards Grid */}
        <div className="grid h-full w-full grid-cols-2 md:grid-cols-3 grid-rows-3 md:grid-rows-2 gap-3 sm:gap-4 items-center">
          {currentGames.map((game) => {
            const stars = student.stars[game.id] || 0;
            const thumb = gameThumbnails[game.id] || { emoji: '🎮', bg: 'from-blue-300 to-indigo-400' };
            const isDisabled = settings.disabledGames.includes(game.id);

            return (
              <motion.div
                key={game.id}
                whileHover={!isDisabled ? { scale: 1.04, y: -4 } : {}}
                whileTap={!isDisabled ? { scale: 0.96 } : {}}
                onMouseEnter={handleGameCardHover}
                onClick={() => {
                  if (!isDisabled) {
                    audioEngine.playClick();
                    onSelectGame(game);
                  }
                }}
                className={`group relative flex flex-col items-center justify-between h-full rounded-2xl border-4 bg-white p-2.5 shadow-lg transition-all ${
                  isDisabled
                    ? 'border-slate-300 opacity-50 cursor-not-allowed'
                    : 'border-pink-300 hover:border-pink-500 cursor-pointer hover:shadow-2xl'
                }`}
              >
                {/* 10 Stars Header Bar on Top Edge */}
                <div className="w-full flex items-center justify-center py-0.5 border-b border-pink-100 mb-1">
                  <StarRating stars={stars} maxStars={10} size="sm" />
                </div>

                {/* Game Thumbnail Illustration Frame */}
                <div
                  className={`relative flex flex-1 w-full items-center justify-center rounded-xl bg-gradient-to-br ${thumb.bg} shadow-inner overflow-hidden border-2 border-white/80 my-1`}
                >
                  <span className="text-4xl sm:text-5xl drop-shadow-md group-hover:scale-115 transition-transform duration-300">
                    {thumb.emoji}
                  </span>
                  <span className="absolute bottom-1 right-1.5 rounded-full bg-slate-900/60 px-2 py-0.5 text-[9px] font-bold text-white backdrop-blur-xs">
                    {game.actionLabel}
                  </span>
                </div>

                {/* Exercise Title Label Below in Deep Blue */}
                <div className="w-full text-center pt-0.5">
                  <span className="text-xs sm:text-sm font-black text-blue-900 line-clamp-1 block">
                    Bài tập {game.id}: {game.title}
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Pink Rounded Next Page Arrow */}
        <button
          type="button"
          onClick={handleNextPage}
          disabled={currentPage === totalPages - 1}
          className={`absolute right-0 z-20 flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-pink-500 text-white shadow-xl border-4 border-white transition-all cursor-pointer ${
            currentPage === totalPages - 1
              ? 'opacity-30 cursor-not-allowed'
              : 'hover:scale-110 active:scale-95 hover:bg-pink-600'
          }`}
          title="Trang sau"
        >
          <ChevronRight className="h-8 w-8 stroke-[3]" />
        </button>
      </div>

      {/* --- BOTTOM ROW: Page Indicator Dots & Mascots --- */}
      <div className="flex w-full items-end justify-between px-2 pt-1">
        {/* Left Mascot: Little Tiger */}
        <div className="hidden sm:flex items-end">
          <Mascot character="tiger" state="idle" size="sm" bubbleText="Chúc các bé luyện chuột thật vui!" />
        </div>

        {/* Page Dots Indicator */}
        <div className="flex flex-col items-center gap-1 mx-auto">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  audioEngine.playPop();
                  setCurrentPage(idx);
                }}
                className={`h-3.5 rounded-full transition-all cursor-pointer ${
                  currentPage === idx ? 'w-8 bg-pink-500 shadow-xs' : 'w-3.5 bg-pink-200 hover:bg-pink-300'
                }`}
                title={`Trang ${idx + 1}`}
              />
            ))}
          </div>
          <span className="text-[11px] font-bold text-blue-900">
            Trang {currentPage + 1} / {totalPages} (Bài {currentPage * pageSize + 1} –{' '}
            {Math.min(GAME_LIST.length, (currentPage + 1) * pageSize)})
          </span>
        </div>

        {/* Right Mascot: Little Elephant */}
        <div className="hidden sm:flex items-end">
          <Mascot character="elephant" state="idle" size="sm" bubbleText="Nháy đúp vào tớ để chào nhé!" />
        </div>
      </div>
    </div>
  );
};
