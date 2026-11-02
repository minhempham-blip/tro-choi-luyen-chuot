import React, { useState, useEffect } from 'react';
import { GameMetadata, StudentProfile, AppSettings, UserAccount } from './state/types';
import { StorageService } from './state/storage';
import { GAME_LIST } from './data/gameList';
import { CartoonBackground } from './components/common/CartoonBackground';
import { MenuScreen } from './components/layout/MenuScreen';
import { GameShell } from './components/layout/GameShell';
import { TeacherModal } from './components/common/TeacherModal';
import { StudentProfileModal } from './components/common/StudentProfileModal';
import { LoginScreen } from './components/auth/LoginScreen';
import { audioEngine } from './audio/audioEngine';
import { speechService } from './audio/speech';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => StorageService.getCurrentUser());
  const [student, setStudent] = useState<StudentProfile>(() => StorageService.getCurrentStudent());
  const [allStudents, setAllStudents] = useState<StudentProfile[]>(() => StorageService.getAllStudents());
  const [settings, setSettings] = useState<AppSettings>(() => StorageService.getSettings());
  const [selectedGame, setSelectedGame] = useState<GameMetadata | null>(null);

  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    const currStudent = StorageService.getCurrentStudent();
    setStudent(currStudent);
    setAllStudents(StorageService.getAllStudents());
    if (user.role === 'admin') {
      setShowTeacherModal(true);
    }
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setSelectedGame(null);
    setShowTeacherModal(false);
    setShowStudentModal(false);
  };

  // Initialize audio on first click anywhere
  const handleFirstInteraction = () => {
    if (!hasInteracted) {
      setHasInteracted(true);
      audioEngine.enableAudioOnUserGesture();
    }
  };

  // Keyboard shortcuts (Escape to return to menu or close modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showTeacherModal) setShowTeacherModal(false);
        else if (showStudentModal) setShowStudentModal(false);
        else if (selectedGame) setSelectedGame(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showTeacherModal, showStudentModal, selectedGame]);

  // Fullscreen handler
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleToggleSound = () => {
    const nextVal = audioEngine.toggleSound();
    const updated = { ...settings, soundEnabled: nextVal };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleToggleMusic = () => {
    const nextVal = audioEngine.toggleMusic();
    const updated = { ...settings, musicEnabled: nextVal };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleToggleSpeech = () => {
    const nextVal = !settings.speechEnabled;
    speechService.setEnabled(nextVal);
    const updated = { ...settings, speechEnabled: nextVal };
    setSettings(updated);
    StorageService.saveSettings(updated);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    StorageService.saveSettings(newSettings);
    audioEngine.toggleSound(newSettings.soundEnabled);
    audioEngine.toggleMusic(newSettings.musicEnabled);
    speechService.setEnabled(newSettings.speechEnabled);
  };

  const handleNextGame = () => {
    if (!selectedGame) return;
    const nextIndex = GAME_LIST.findIndex((g) => g.id === selectedGame.id) + 1;
    if (nextIndex < GAME_LIST.length) {
      setSelectedGame(GAME_LIST[nextIndex]);
    } else {
      setSelectedGame(null);
    }
  };

  return (
    <div
      onClick={handleFirstInteraction}
      className="relative min-h-screen w-full select-none"
    >
      <CartoonBackground>
        {/* If Login is required and user is not logged in: show LoginScreen */}
        {settings.requireLogin && !currentUser ? (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        ) : selectedGame ? (
          <GameShell
            game={selectedGame}
            student={student}
            settings={settings}
            onBackToMenu={() => setSelectedGame(null)}
            onNextGame={handleNextGame}
            onUpdateStudent={(st) => {
              setStudent(st);
              setAllStudents(StorageService.getAllStudents());
            }}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onToggleSpeech={handleToggleSpeech}
          />
        ) : (
          <MenuScreen
            student={student}
            settings={settings}
            currentUser={currentUser}
            onLogout={handleLogout}
            onSelectGame={(gm) => setSelectedGame(gm)}
            onOpenTeacherModal={() => setShowTeacherModal(true)}
            onOpenStudentModal={() => setShowStudentModal(true)}
            onToggleSound={handleToggleSound}
            onToggleMusic={handleToggleMusic}
            onToggleFullscreen={handleToggleFullscreen}
            isFullscreen={isFullscreen}
          />
        )}

        {/* Teacher Admin Modal */}
        {showTeacherModal && (
          <TeacherModal
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onClose={() => setShowTeacherModal(false)}
          />
        )}

        {/* Student Profile Switcher Modal */}
        {showStudentModal && (
          <StudentProfileModal
            currentStudent={student}
            allStudents={allStudents}
            onSelectStudent={(st) => {
              setStudent(st);
              setAllStudents(StorageService.getAllStudents());
            }}
            onClose={() => setShowStudentModal(false)}
          />
        )}
      </CartoonBackground>
    </div>
  );
}
