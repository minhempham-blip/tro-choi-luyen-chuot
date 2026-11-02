export type MouseActionType =
  | 'hover'
  | 'click'
  | 'dblclick'
  | 'rightclick'
  | 'drag'
  | 'select'
  | 'wheel';

export type GameGroupKey =
  | 'A_hover'
  | 'B_click'
  | 'C_dblclick'
  | 'D_rightclick'
  | 'E_drag'
  | 'F_special';

export interface GameMetadata {
  id: number;
  title: string;
  groupKey: GameGroupKey;
  groupName: string;
  actionType: MouseActionType;
  actionLabel: string;
  description: string;
  detailedTutorial: string;
  hintTiers: {
    tier1: string; // Auto pointer highlight after 6s
    tier2: string; // Mascot bubble advice
    tier3: string; // Demo ghost cursor guidance
  };
  targetMouseButton: 'left' | 'right' | 'left-double' | 'move' | 'drag' | 'wheel';
}

export interface UserAccount {
  id: string;
  username: string; // e.g. "admin", "hocsinh01"
  displayName: string; // e.g. "Thầy Minh", "Bé Minh Anh"
  password: string; // Plaintext or hashed passcode for student login
  role: 'admin' | 'student';
  isApproved: boolean; // Only true can enter the system!
  createdAt: string;
  lastLoginAt?: string;
}

export interface StudentProfile {
  id: string;
  username?: string;
  name: string;
  stars: Record<number, number>; // gameId -> 0..10 stars
  highScores: Record<number, number>; // gameId -> high score
  lastPlayed: Record<number, string>; // gameId -> ISO date
  totalPlayTimeSeconds: number;
}

export interface AppSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  speechEnabled: boolean;
  sfxVolume: number;
  bgmVolume: number;
  easyMode: boolean; // Bigger targets & relaxed timers for younger learners
  doubleClickThresholdMs: number; // e.g. 550ms
  disabledGames: number[]; // Game IDs toggled off by teacher
  teacherPin: string; // Default: '1234'
  requireLogin: boolean; // Default true: must log in with approved account
  allowSelfRegistration: boolean; // Students can create account and wait for teacher approval
}

export interface GameResult {
  gameId: number;
  level?: 1 | 2 | 3;
  round?: 1 | 2;
  score: number;
  stars: number; // 0..10
  accuracy: number; // 0..100 %
  timeTakenSeconds: number;
  correctCount: number;
  mistakeCount: number;
}

export interface GameComponentProps {
  level: 1 | 2 | 3; // 1: Dễ, 2: Vừa, 3: Khó
  round?: 1 | 2; // 1: Vòng 1, 2: Vòng 2
  isPractice: boolean;
  easyMode: boolean;
  currentHintTier: 0 | 1 | 2 | 3;
  onMistake: () => void;
  onSuccess: () => void;
  onComplete: (result: GameResult) => void;
  onProgress?: (current: number, total: number) => void;
}
