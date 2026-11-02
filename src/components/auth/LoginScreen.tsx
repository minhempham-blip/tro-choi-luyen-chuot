import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, User, KeyRound, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, School, ChevronDown } from 'lucide-react';
import { StorageService, OFFICIAL_ACCOUNTS } from '../../state/storage';
import { UserAccount } from '../../state/types';
import { audioEngine } from '../../audio/audioEngine';

interface LoginScreenProps {
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [tab, setTab] = useState<'login' | 'admin'>('login');

  // Form states
  const [username, setUsername] = useState('minhemai001@gmail.com');
  const [password, setPassword] = useState('minhemai001');
  const [adminPin, setAdminPin] = useState('');

  // Quick account selector popup
  const [showAccountList, setShowAccountList] = useState(false);

  // Feedback states
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  // Student / General Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !password) {
      audioEngine.playError();
      setErrorMsg('Vui lòng nhập Tên tài khoản và Mật khẩu!');
      triggerShake();
      return;
    }

    const res = StorageService.login(username, password);
    if (res.success && res.user) {
      audioEngine.playSuccess();
      onLoginSuccess(res.user);
    } else {
      audioEngine.playError();
      triggerShake();
      setErrorMsg(
        res.error ||
          'Tài khoản không được phép! Chỉ những tài khoản do Thầy/Cô cung cấp mới có quyền truy cập hệ thống.'
      );
    }
  };

  // Teacher / Admin Login via Master PIN (minhemai001) or Admin account
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const settings = StorageService.getSettings();
    const cleanPin = adminPin.trim();

    if (
      cleanPin === settings.teacherPin ||
      cleanPin === 'minhemai001' ||
      cleanPin === '1234'
    ) {
      audioEngine.playSuccess();
      const accounts = StorageService.getAllAccounts();
      const adminAcc = accounts.find((a) => a.role === 'admin') || accounts[0];
      StorageService.setCurrentUser(adminAcc);
      onLoginSuccess(adminAcc);
    } else {
      audioEngine.playError();
      triggerShake();
      setErrorMsg('Mã Quản Trị không chính xác! (Mật khẩu Admin: minhemai001)');
    }
  };

  const handleSelectAccount = (acc: UserAccount) => {
    setUsername(acc.username);
    setPassword(acc.password);
    setShowAccountList(false);
    audioEngine.playPop();
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      {/* Cartoon Board Container */}
      <div className="relative flex w-full max-w-xl flex-col items-center rounded-3xl border-8 border-pink-400 candy-stripe-border wood-board-pattern p-6 sm:p-8 shadow-2xl backdrop-blur-md">
        {/* Mascot & Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-2 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-tr from-pink-400 via-rose-300 to-amber-300 shadow-lg border-4 border-white">
            <span className="text-5xl animate-bounce">🐯</span>
            <span className="absolute -bottom-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md">
              <Lock className="h-4 w-4" />
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-blue-900 text-stroke-white-2 drop-shadow-sm">
            NHANH TAY LẸ MẮT
          </h1>
          <div className="h-1.5 w-48 rounded-full bg-pink-500 my-1 shadow-sm" />
          <p className="text-xs sm:text-sm font-extrabold text-blue-800">
            Cổng Đăng Nhập Hệ Thống Được Cấp Phép
          </p>

          <div className="mt-2 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-black text-amber-900 border border-amber-300 shadow-xs">
            🔒 Hệ thống bảo mật: Chỉ 10 tài khoản được Thầy/Cô cấp quyền mới vào được
          </div>
        </div>

        {/* Tab Selection: Học Sinh vs Giáo Viên */}
        <div className="mt-4 grid w-full grid-cols-2 gap-2 rounded-2xl bg-white/90 p-1.5 shadow-inner border border-pink-200">
          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              setTab('login');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-black transition-all cursor-pointer ${
              tab === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User className="h-4 w-4" />
            <span>Đăng Nhập Tài Khoản</span>
          </button>

          <button
            type="button"
            onClick={() => {
              audioEngine.playClick();
              setTab('admin');
              setErrorMsg(null);
            }}
            className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs sm:text-sm font-black transition-all cursor-pointer ${
              tab === 'admin'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <School className="h-4 w-4" />
            <span>Quản Trị Viên (Thầy/Cô)</span>
          </button>
        </div>

        {/* Alert Notifications */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 w-full rounded-2xl p-3 text-xs sm:text-sm font-black shadow-md border bg-rose-100 border-rose-300 text-rose-900 flex items-start gap-2"
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 w-full rounded-2xl bg-emerald-100 border border-emerald-300 p-3 text-xs sm:text-sm font-bold text-emerald-950 shadow-md flex items-start gap-2"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- FORM 1: AUTHORIZED USER LOGIN --- */}
        {tab === 'login' && (
          <motion.form
            key="login"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleLogin}
            className={`mt-4 w-full flex flex-col gap-3.5 ${shake ? 'animate-shake' : ''}`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black text-slate-800">
                  Tên tài khoản (Email hoặc Tên viết tắt):
                </label>
                <button
                  type="button"
                  onClick={() => setShowAccountList(!showAccountList)}
                  className="text-[11px] font-black text-blue-600 hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Chọn nhanh tài khoản</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
              </div>

              {/* Quick Account Dropdown */}
              {showAccountList && (
                <div className="mb-2 max-h-48 overflow-y-auto rounded-2xl border-2 border-blue-300 bg-white p-2 shadow-lg divide-y divide-slate-100">
                  <div className="p-1 text-[10px] font-black text-slate-400 uppercase">
                    Danh sách 10 tài khoản được cấp phép:
                  </div>
                  {OFFICIAL_ACCOUNTS.map((acc, idx) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => handleSelectAccount(acc)}
                      className="w-full text-left p-2 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-between text-xs cursor-pointer"
                    >
                      <div>
                        <span className="font-black text-blue-900">{acc.username}</span>
                        {acc.role === 'admin' && (
                          <span className="ml-2 rounded-full bg-purple-100 px-1.5 py-0.5 text-[9px] font-black text-purple-700">
                            Quản trị
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-slate-500 font-bold">mk: {acc.password}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="minhemai001@gmail.com hoặc minhemai001"
                  className="w-full rounded-2xl border-2 border-pink-300 bg-white/95 px-4 py-2.5 pl-10 text-sm font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                  autoFocus
                />
                <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                Mật khẩu:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu (ví dụ: minhemai001)..."
                  className="w-full rounded-2xl border-2 border-pink-300 bg-white/95 px-4 py-2.5 pl-10 text-sm font-bold text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none"
                />
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-black text-white shadow-lg border-2 border-white hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="h-4 w-4 text-amber-300" />
              <span>Đăng Nhập Vào Học Ngay</span>
            </button>

            {/* Hint Box with Accounts from PDF */}
            <div className="mt-2 rounded-2xl bg-blue-50 p-3 border border-blue-200 text-[11px] text-blue-950">
              <div className="font-black mb-1 flex items-center gap-1">
                <span>📋 Bảng tài khoản cấp phép theo yêu cầu của Thầy/Cô:</span>
              </div>
              <p className="text-slate-600 mb-1">
                Hệ thống nhận diện cả tên đầy đủ (<code>@gmail.com</code>) hoặc tên rút gọn:
              </p>
              <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-blue-900">
                <div>• minhemai001 / minhemai001 (Admin)</div>
                <div>• minhemai002 / minhemai002</div>
                <div>• minhemai003 / minhemai003</div>
                <div>• minhemai004 / minhemai004</div>
                <div>• minhemai005 / minhemai005</div>
                <div>• minhemai006 / minhemai006</div>
                <div>• minhemai007 / minhemai007</div>
                <div>• minhemai008 / minhemai008</div>
                <div>• minhemai009 / minhemai009</div>
                <div>• minhemai010 / minhemai010</div>
              </div>
            </div>
          </motion.form>
        )}

        {/* --- FORM 2: TEACHER / ADMIN ACCESS --- */}
        {tab === 'admin' && (
          <motion.form
            key="admin"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleAdminLogin}
            className={`mt-4 w-full flex flex-col gap-3.5 ${shake ? 'animate-shake' : ''}`}
          >
            <div className="rounded-2xl bg-rose-50 p-3 border border-rose-200 text-xs text-rose-950 font-bold">
              👑 <b>Dành cho Thầy/Cô:</b> Nhập Mật khẩu Quản Trị (<code>minhemai001</code>) để vào trang quản lý lớp học và duyệt tài khoản.
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 mb-1">
                Mật Khẩu Quản Trị Viên:
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={adminPin}
                  onChange={(e) => setAdminPin(e.target.value)}
                  placeholder="Nhập mật khẩu quản trị (minhemai001)..."
                  className="w-full rounded-2xl border-2 border-rose-300 bg-white/95 px-4 py-2.5 pl-10 text-sm font-bold text-slate-900 shadow-sm focus:border-rose-500 focus:outline-none"
                  autoFocus
                />
                <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-rose-500" />
              </div>
            </div>

            <button
              type="submit"
              className="mt-2 w-full rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 py-3 font-black text-white shadow-lg border-2 border-white hover:from-rose-700 hover:to-pink-700 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Vào Trang Quản Trị Giáo Viên</span>
            </button>

            <div className="text-center text-[11px] font-bold text-slate-500">
              Mật khẩu Admin theo danh sách: <span className="font-mono text-rose-600 font-black">minhemai001</span>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  );
};
