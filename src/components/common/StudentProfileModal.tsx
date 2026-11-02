import React, { useState } from 'react';
import { X, UserPlus, UserCheck, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { StudentProfile } from '../../state/types';
import { StorageService } from '../../state/storage';
import { audioEngine } from '../../audio/audioEngine';
import { Mascot } from './Mascot';

interface StudentProfileModalProps {
  currentStudent: StudentProfile;
  allStudents: StudentProfile[];
  onSelectStudent: (student: StudentProfile) => void;
  onClose: () => void;
  isFirstLaunch?: boolean;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  currentStudent,
  allStudents,
  onSelectStudent,
  onClose,
  isFirstLaunch = false,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [selectedId, setSelectedId] = useState(currentStudent.id);

  const handleAddNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    audioEngine.playSuccess();
    const created = StorageService.addStudent(nameInput);
    onSelectStudent(created);
    onClose();
  };

  const handleSelectExisting = (st: StudentProfile) => {
    audioEngine.playClick();
    StorageService.setCurrentStudentId(st.id);
    onSelectStudent(st);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border-8 border-pink-400 bg-amber-50 p-6 shadow-2xl sm:p-8"
      >
        {!isFirstLaunch && (
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              onClose();
            }}
            className="absolute right-4 top-4 rounded-full bg-rose-500 p-2 text-white shadow-md hover:bg-rose-600 transition-colors"
            title="Đóng"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        <div className="text-center">
          <span className="inline-block rounded-full bg-amber-200 px-3.5 py-1 text-xs font-bold text-amber-900">
            Hồ sơ học sinh
          </span>
          <h2 className="mt-1 text-2xl font-black text-blue-900 sm:text-3xl">
            {isFirstLaunch ? 'Chào mừng bé!' : 'Đổi thông tin học sinh'}
          </h2>
          <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-600">
            Bé hãy nhập tên của mình để lưu giữ các ngôi sao thành tích nhé!
          </p>
        </div>

        {/* Mascot */}
        <div className="my-3 flex justify-center">
          <Mascot character="tiger" state="happy" size="sm" bubbleText="Nhập tên bé vào đây nhé!" />
        </div>

        {/* Input Form for New Student */}
        <form onSubmit={handleAddNew} className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nhập tên bé (ví dụ: Bé Minh An)..."
              maxLength={24}
              className="flex-1 rounded-2xl border-2 border-amber-300 bg-white px-4 py-3 text-base font-bold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-hidden"
            />
            <button
              type="submit"
              disabled={!nameInput.trim()}
              className="flex items-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-3 font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 transition-all active:scale-95"
            >
              <UserPlus className="h-4 w-4" />
              Lưu tên
            </button>
          </div>
        </form>

        {/* List of existing students if any */}
        {allStudents.length > 0 && (
          <div className="mt-5 border-t-2 border-amber-200 pt-4">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
              Hoặc chọn tên đã có trong danh sách:
            </span>
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1">
              {allStudents.map((st) => {
                const totalStars = Object.values(st.stars).reduce((a, b) => a + b, 0);
                const isSelected = st.id === selectedId;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleSelectExisting(st)}
                    className={`w-full flex items-center justify-between rounded-xl p-2.5 text-left transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-xs'
                        : 'bg-white hover:bg-amber-100 text-slate-800 border border-amber-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className={`h-4 w-4 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                      {st.name}
                    </span>
                    <span className={`text-xs ${isSelected ? 'text-blue-100' : 'text-amber-600 font-bold'}`}>
                      ⭐ {totalStars} sao
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
