import React, { useState } from 'react';
import { X, Lock, Download, RotateCcw, Check, ToggleLeft, ToggleRight, Settings, ShieldCheck, UserCheck, UserX, UserPlus, Upload, Trash2, KeyRound } from 'lucide-react';
import { motion } from 'motion/react';
import { AppSettings, StudentProfile, UserAccount } from '../../state/types';
import { StorageService } from '../../state/storage';
import { GAME_LIST } from '../../data/gameList';
import { audioEngine } from '../../audio/audioEngine';

interface TeacherModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

export const TeacherModal: React.FC<TeacherModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [students, setStudents] = useState<StudentProfile[]>(() => StorageService.getAllStudents());
  const [accounts, setAccounts] = useState<UserAccount[]>(() => StorageService.getAllAccounts());
  const [activeTab, setActiveTab] = useState<'accounts' | 'students' | 'games' | 'settings'>('accounts');
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [successMessage, setSuccessMessage] = useState('');

  // Add Account form state
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newPassword, setNewPassword] = useState('123');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === localSettings.teacherPin) {
      audioEngine.playSuccess();
      setIsUnlocked(true);
      setPinError(false);
    } else {
      audioEngine.playError();
      setPinError(true);
    }
  };

  const handleExportCSV = () => {
    audioEngine.playClick();
    const csvContent = StorageService.exportClassCSV();
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `bao_cao_nhanh_tay_le_mat_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMessage('Đã tải xuống tệp danh sách điểm CSV thành công!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleResetStudent = (id: string, name: string) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn đặt lại toàn bộ sao và điểm của em "${name}" không?`)) {
      audioEngine.playClick();
      StorageService.resetStudentProgress(id);
      setStudents(StorageService.getAllStudents());
      setSuccessMessage(`Đã đặt lại tiến độ cho em ${name}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleToggleGame = (gameId: number) => {
    audioEngine.playPop();
    const isCurrentlyDisabled = localSettings.disabledGames.includes(gameId);
    let newDisabled: number[];
    if (isCurrentlyDisabled) {
      newDisabled = localSettings.disabledGames.filter((id) => id !== gameId);
    } else {
      newDisabled = [...localSettings.disabledGames, gameId];
    }
    const updated = { ...localSettings, disabledGames: newDisabled };
    setLocalSettings(updated);
    onSaveSettings(updated);
  };

  const handleAddAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;

    const res = StorageService.addAccountByAdmin(
      newUsername.trim(),
      newDisplayName.trim() || newUsername.trim(),
      newPassword || '123',
      'student',
      true // Approved immediately by teacher!
    );

    if (res.success) {
      audioEngine.playSuccess();
      setAccounts(StorageService.getAllAccounts());
      setStudents(StorageService.getAllStudents());
      setNewUsername('');
      setNewDisplayName('');
      setNewPassword('123');
      setSuccessMessage('Đã thêm và cấp phép thành công cho tài khoản mới!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } else {
      audioEngine.playError();
      setSuccessMessage(res.error || 'Không thể tạo tài khoản!');
    }
  };

  const handleToggleApproval = (accId: string) => {
    audioEngine.playClick();
    const newStatus = StorageService.toggleAccountApproval(accId);
    setAccounts(StorageService.getAllAccounts());
    setSuccessMessage(newStatus ? 'Đã CẤP PHÉP tài khoản vào hệ thống!' : 'Đã TẠM KHÓA quyền truy cập của tài khoản!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDeleteAccount = (accId: string, name: string) => {
    if (window.confirm(`Thầy/Cô có chắc chắn muốn xóa tài khoản "${name}" không?`)) {
      audioEngine.playClick();
      StorageService.deleteAccount(accId);
      setAccounts(StorageService.getAllAccounts());
      setSuccessMessage(`Đã xóa tài khoản "${name}"`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleResetPassword = (accId: string, name: string) => {
    const newPass = window.prompt(`Nhập mật khẩu mới cho tài khoản "${name}":`, '123');
    if (newPass && newPass.trim()) {
      audioEngine.playSuccess();
      StorageService.updateAccountPassword(accId, newPass.trim());
      setAccounts(StorageService.getAllAccounts());
      setSuccessMessage(`Đã đổi mật khẩu cho "${name}" thành: ${newPass.trim()}`);
      setTimeout(() => setSuccessMessage(''), 3000);
    }
  };

  const handleExportAccounts = () => {
    audioEngine.playClick();
    const jsonStr = StorageService.exportAccountsJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `danh_sach_tai_khoan_cap_phep_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setSuccessMessage('Đã xuất danh sách tài khoản cấp phép (.json) thành công!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleImportAccounts = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = StorageService.importAccountsJSON(content);
      if (ok) {
        audioEngine.playSuccess();
        setAccounts(StorageService.getAllAccounts());
        setSuccessMessage('Đã nạp và đồng bộ danh sách tài khoản thành công!');
      } else {
        audioEngine.playError();
        setSuccessMessage('Tệp không đúng định dạng JSON tài khoản!');
      }
      setTimeout(() => setSuccessMessage(''), 3000);
    };
    reader.readAsText(file);
  };

  const handleSaveConfig = () => {
    audioEngine.playClick();
    onSaveSettings(localSettings);
    setSuccessMessage('Đã lưu cấu hình của giáo viên!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-3xl border-8 border-pink-400 bg-amber-50 p-6 shadow-2xl"
      >
        {/* Close Button */}
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

        {/* Modal Header */}
        <div className="mb-4 text-center">
          <span className="rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold text-blue-700">
            Dành cho Thầy / Cô giáo
          </span>
          <h2 className="mt-1 text-2xl font-black text-blue-900 sm:text-3xl">
            Quản trị Lớp học & Cài đặt
          </h2>
        </div>

        {/* PIN Authentication Screen */}
        {!isUnlocked ? (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border-2 border-amber-300 bg-white p-6 shadow-md text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                <Lock className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">Nhập mã PIN Giáo viên</h3>
              <p className="mt-1 text-xs text-slate-500">Mã PIN mặc định là: 1234</p>

              <form onSubmit={handleUnlock} className="mt-4 space-y-3">
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Nhập 4 số PIN..."
                  autoFocus
                  className="w-full rounded-xl border-2 border-slate-300 px-4 py-2.5 text-center text-xl font-bold tracking-widest text-slate-900 focus:border-blue-500 focus:outline-hidden"
                />
                {pinError && (
                  <p className="text-xs font-bold text-rose-500">
                    Mã PIN chưa chính xác, xin vui lòng thử lại!
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md hover:bg-blue-700 transition-transform active:scale-95"
                >
                  Mở khóa trang Giáo viên
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Unlocked Teacher Dashboard */
          <div className="flex flex-1 flex-col overflow-hidden">
            {/* Tabs */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b-2 border-amber-200 pb-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('accounts')}
                  className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-black transition-colors ${
                    activeTab === 'accounts'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>Duyệt & Cấp Quyền Tài Khoản ({accounts.filter((a) => a.isApproved).length}/{accounts.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('students')}
                  className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors ${
                    activeTab === 'students'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Bảng Điểm Học Sinh ({students.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('games')}
                  className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors ${
                    activeTab === 'games'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Bật / Tắt Bài Tập
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  className={`rounded-xl px-3.5 py-2 text-xs sm:text-sm font-bold transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  Cài Đặt Hệ Thống
                </button>
              </div>

              {activeTab === 'students' && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
                >
                  <Download className="h-4 w-4" />
                  Xuất Tệp Excel / CSV
                </button>
              )}

              {activeTab === 'accounts' && (
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 border border-slate-300 hover:bg-slate-200 cursor-pointer">
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    <span>Nạp Danh Sách (.json)</span>
                    <input type="file" accept=".json" onChange={handleImportAccounts} className="hidden" />
                  </label>
                  <button
                    type="button"
                    onClick={handleExportAccounts}
                    className="flex items-center gap-1 rounded-xl bg-purple-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-purple-700"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Xuất DS (.json)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Notification message */}
            {successMessage && (
              <div className="mb-3 rounded-xl bg-emerald-100 p-2 text-center text-xs font-bold text-emerald-800">
                {successMessage}
              </div>
            )}

            {/* Content for Tabs */}
            <div className="flex-1 overflow-y-auto rounded-2xl bg-white p-4 border border-amber-200">
              {/* TAB 0: Account Approval & Access Control */}
              {activeTab === 'accounts' && (
                <div className="space-y-4">
                  {/* Top Info Banner */}
                  <div className="rounded-2xl bg-rose-50 p-3.5 border border-rose-200 text-xs text-rose-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="font-black text-rose-900 text-sm flex items-center gap-1.5">
                        <ShieldCheck className="h-4 w-4 text-rose-600" />
                        <span>Chính Sách Cấp Phép Truy Cập Hệ Thống</span>
                      </div>
                      <p className="mt-0.5 text-slate-600">
                        Chỉ những tài khoản có trạng thái <b>"ĐÃ CẤP PHÉP"</b> (màu xanh) mới có thể đăng nhập vào luyện chuột. Tài khoản "Chờ Duyệt" hoặc "Tạm Khóa" sẽ bị chặn ngay ngoài cổng.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-black text-emerald-800 border border-emerald-300">
                        {accounts.filter((a) => a.isApproved).length} Đã Cấp Phép
                      </span>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-black text-amber-800 border border-amber-300">
                        {accounts.filter((a) => !a.isApproved).length} Chờ Duyệt / Khóa
                      </span>
                    </div>
                  </div>

                  {/* Add New Account Form */}
                  <form onSubmit={handleAddAccount} className="rounded-2xl bg-slate-50 p-3.5 border border-slate-200">
                    <div className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                      <UserPlus className="h-4 w-4 text-blue-600" />
                      <span>Thêm Tài Khoản Học Sinh Mới & Cấp Phép Ngay:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="Tên đăng nhập (vd: hocsinh03)"
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                      />
                      <input
                        type="text"
                        value={newDisplayName}
                        onChange={(e) => setNewDisplayName(e.target.value)}
                        placeholder="Họ và tên (vd: Bé Lê Gia Huy)"
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                      />
                      <input
                        type="text"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Mật khẩu (mặc định: 123)"
                        className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-bold text-slate-800"
                      />
                      <button
                        type="submit"
                        className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-black text-white shadow-sm hover:bg-blue-700 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <UserCheck className="h-3.5 w-3.5" />
                        <span>Thêm & Cấp Phép</span>
                      </button>
                    </div>
                  </form>

                  {/* Accounts Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                        <tr>
                          <th className="p-2.5">STT</th>
                          <th className="p-2.5">Tên Đăng Nhập</th>
                          <th className="p-2.5">Họ và Tên</th>
                          <th className="p-2.5">Mật Khẩu</th>
                          <th className="p-2.5">Vai Trò</th>
                          <th className="p-2.5 text-center">Trạng Thái Cấp Phép</th>
                          <th className="p-2.5 text-center">Hành Động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {accounts.map((acc, idx) => {
                          const isAdmin = acc.role === 'admin';
                          return (
                            <tr key={acc.id} className="hover:bg-slate-50 transition-colors">
                              <td className="p-2.5 font-bold text-slate-400">{idx + 1}</td>
                              <td className="p-2.5 font-black text-blue-900 font-mono">{acc.username}</td>
                              <td className="p-2.5 font-bold text-slate-800">{acc.displayName}</td>
                              <td className="p-2.5 font-mono text-slate-600">{acc.password}</td>
                              <td className="p-2.5">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                                  isAdmin ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700'
                                }`}>
                                  {isAdmin ? 'Quản Trị Viên' : 'Học Sinh'}
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleToggleApproval(acc.id)}
                                  disabled={isAdmin}
                                  className={`rounded-full px-3 py-1 text-[11px] font-black transition-all shadow-xs cursor-pointer ${
                                    acc.isApproved
                                      ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                                      : 'bg-amber-400 text-amber-950 hover:bg-amber-500'
                                  } ${isAdmin ? 'opacity-70 cursor-not-allowed' : ''}`}
                                  title={acc.isApproved ? 'Nhấp để tạm khóa quyền' : 'Nhấp để cấp phép vào học'}
                                >
                                  {acc.isApproved ? '✓ ĐÃ CẤP PHÉP' : '⏳ CHỜ DUYỆT'}
                                </button>
                              </td>
                              <td className="p-2.5 text-center">
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleResetPassword(acc.id, acc.displayName)}
                                    className="rounded-lg bg-slate-100 p-1.5 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                                    title="Đổi mật khẩu"
                                  >
                                    <KeyRound className="h-3.5 w-3.5" />
                                  </button>
                                  {!isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteAccount(acc.id, acc.displayName)}
                                      className="rounded-lg bg-rose-50 p-1.5 text-rose-500 hover:bg-rose-100 hover:text-rose-700"
                                      title="Xóa tài khoản"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* TAB 1: Student List & Summary */}
              {activeTab === 'students' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b-2 border-slate-200 text-slate-600">
                        <th className="py-2 px-3">STT</th>
                        <th className="py-2 px-3">Họ và Tên</th>
                        <th className="py-2 px-3 text-center">Tổng Sao (max 200)</th>
                        <th className="py-2 px-3 text-center">Số bài đã xong</th>
                        <th className="py-2 px-3 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {students.map((st, idx) => {
                        const totalStars = Object.values(st.stars).reduce((a, b) => a + b, 0);
                        const completedCount = Object.values(st.stars).filter((v) => v > 0).length;
                        return (
                          <tr key={st.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-semibold text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">{st.name}</td>
                            <td className="py-2.5 px-3 text-center font-black text-amber-600">
                              ⭐ {totalStars} / 200
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-blue-600">
                              {completedCount} / 20 bài
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleResetStudent(st.id, st.name)}
                                className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 transition-colors"
                                title="Đặt lại điểm bài tập"
                              >
                                <RotateCcw className="h-3 w-3" />
                                Đặt lại
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: Game toggles */}
              {activeTab === 'games' && (
                <div>
                  <p className="mb-3 text-xs text-slate-500 font-medium">
                    Thầy/Cô có thể tắt những bài tập chưa dạy tới để học sinh tập trung vào bài học hiện tại:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {GAME_LIST.map((gm) => {
                      const isDisabled = localSettings.disabledGames.includes(gm.id);
                      return (
                        <div
                          key={gm.id}
                          className={`flex items-center justify-between rounded-xl p-3 border ${
                            isDisabled ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-blue-50/50 border-blue-200'
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-500">{gm.groupName}</div>
                            <div className="text-sm font-bold text-slate-800">
                              Bài {gm.id}: {gm.title}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleGame(gm.id)}
                            className="p-1 text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            {isDisabled ? (
                              <ToggleLeft className="h-7 w-7 text-slate-400" />
                            ) : (
                              <ToggleRight className="h-7 w-7 text-emerald-600" />
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: App Settings */}
              {activeTab === 'settings' && (
                <div className="space-y-4 max-w-md mx-auto py-2">
                  {/* Strict Login Gate Toggle */}
                  <div className="flex items-center justify-between rounded-xl p-3 bg-rose-50 border border-rose-200">
                    <div>
                      <div className="text-sm font-black text-rose-900">Bắt buộc Đăng nhập Tài khoản Đã duyệt</div>
                      <div className="text-xs text-slate-600">
                        Chỉ cho phép tài khoản Thầy/Cô đã phê duyệt mới được vào hệ thống (Chặn người lạ)
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, requireLogin: !localSettings.requireLogin })}
                      className="p-1 cursor-pointer"
                    >
                      {localSettings.requireLogin ? (
                        <ToggleRight className="h-7 w-7 text-rose-600" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl p-3 bg-slate-50 border border-slate-200">
                    <div>
                      <div className="text-sm font-bold text-slate-800">Chế độ Hỗ trợ (Dễ hơn)</div>
                      <div className="text-xs text-slate-500">Mục tiêu to hơn 25%, thời gian thong thả cho học sinh lớp 1</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, easyMode: !localSettings.easyMode })}
                      className="p-1"
                    >
                      {localSettings.easyMode ? (
                        <ToggleRight className="h-7 w-7 text-emerald-600" />
                      ) : (
                        <ToggleLeft className="h-7 w-7 text-slate-400" />
                      )}
                    </button>
                  </div>

                  <div className="rounded-xl p-3 bg-slate-50 border border-slate-200">
                    <label className="text-sm font-bold text-slate-800 block mb-1">
                      Độ trễ Nháy Đúp Chuột ({localSettings.doubleClickThresholdMs} ms)
                    </label>
                    <p className="text-xs text-slate-500 mb-2">
                      Thời gian giữa 2 nháy để tính là nháy đúp (học sinh nhỏ tuổi nên để khoảng 550ms - 650ms).
                    </p>
                    <input
                      type="range"
                      min={350}
                      max={800}
                      step={50}
                      value={localSettings.doubleClickThresholdMs}
                      onChange={(e) =>
                        setLocalSettings({ ...localSettings, doubleClickThresholdMs: Number(e.target.value) })
                      }
                      className="w-full accent-blue-600"
                    />
                  </div>

                  <div className="rounded-xl p-3 bg-slate-50 border border-slate-200">
                    <label className="text-sm font-bold text-slate-800 block mb-1">
                      Đổi mã PIN Giáo viên
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={localSettings.teacherPin}
                      onChange={(e) => setLocalSettings({ ...localSettings, teacherPin: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
                  >
                    Lưu các thay đổi
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
