import { AppSettings, StudentProfile, UserAccount } from './types';

const STORAGE_KEYS = {
  SETTINGS: 'nhanh_tay_settings_v2',
  STUDENTS: 'nhanh_tay_students_v2',
  CURRENT_STUDENT_ID: 'nhanh_tay_current_student_id_v2',
  ACCOUNTS: 'nhanh_tay_accounts_v2',
  CURRENT_USER: 'nhanh_tay_current_user_v2',
};

const DEFAULT_SETTINGS: AppSettings = {
  soundEnabled: true,
  musicEnabled: true,
  speechEnabled: false,
  sfxVolume: 0.7,
  bgmVolume: 0.3,
  easyMode: false,
  doubleClickThresholdMs: 550,
  disabledGames: [],
  teacherPin: 'minhemai001',
  requireLogin: true,
  allowSelfRegistration: false, // Strictly only accounts provided by teacher
};

export const OFFICIAL_ACCOUNTS: UserAccount[] = [
  {
    id: 'acc_minhemai001',
    username: 'minhemai001@gmail.com',
    displayName: 'Quản Trị Viên (minhemai001)',
    password: 'minhemai001',
    role: 'admin',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_minhemai002',
    username: 'minhemai002@gmail.com',
    displayName: 'Học sinh minhemai002',
    password: 'minhemai002',
    role: 'student',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_minhemai003',
    username: 'minhemai003@gmail.com',
    displayName: 'Học sinh minhemai003',
    password: 'minhemai003',
    role: 'student',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_minhemai004',
    username: 'minhemai004@gmail.com',
    displayName: 'Học sinh minhemai004',
    password: 'minhemai004',
    role: 'student',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_minhemai005',
    username: 'minhemai005@gmail.com',
    displayName: 'Học sinh minhemai005',
    password: 'minhemai005',
    role: 'student',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_minhemai006',
    username: 'minhemai006@gmail.com',
    displayName: 'Học sinh minhemai006',
    password: 'minhemai006',
    role: 'student',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_minhemai007',
    username: 'minhemai007@gmail.com',
    displayName: 'Học sinh minhemai007',
    password: 'minhemai007',
    role: 'student',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_minhemai008',
    username: 'minhemai008@gmail.com',
    displayName: 'Học sinh minhemai008',
    password: 'minhemai008',
    role: 'student',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_minhemai009',
    username: 'minhemai009@gmail.com',
    displayName: 'Học sinh minhemai009',
    password: 'minhemai009',
    role: 'student',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'acc_minhemai010',
    username: 'minhemai010@gmail.com',
    displayName: 'Học sinh minhemai010',
    password: 'minhemai010',
    role: 'student',
    isApproved: true,
    createdAt: new Date().toISOString(),
  },
];

const DEFAULT_ACCOUNTS = OFFICIAL_ACCOUNTS;

const DEFAULT_STUDENT: StudentProfile = {
  id: 'acc_minhemai002',
  username: 'minhemai002@gmail.com',
  name: 'Học sinh minhemai002',
  stars: {},
  highScores: {},
  lastPlayed: {},
  totalPlayTimeSeconds: 0,
};

export class StorageService {
  public static getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_SETTINGS;
  }

  public static saveSettings(settings: AppSettings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }

  public static getAllStudents(): StudentProfile[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return [DEFAULT_STUDENT];
  }

  public static saveAllStudents(students: StudentProfile[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
    } catch {
      // Ignore
    }
  }

  public static getCurrentStudent(): StudentProfile {
    const students = this.getAllStudents();
    const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_STUDENT_ID);
    const found = students.find((s) => s.id === currentId);
    if (found) return found;
    return students[0] || DEFAULT_STUDENT;
  }

  public static setCurrentStudentId(studentId: string) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STUDENT_ID, studentId);
  }

  public static updateStudentProgress(
    studentId: string,
    gameId: number,
    stars: number,
    score: number
  ): StudentProfile {
    const students = this.getAllStudents();
    let updatedStudent: StudentProfile | null = null;

    const newStudents = students.map((s) => {
      if (s.id === studentId) {
        const currentStars = s.stars[gameId] || 0;
        const currentHighScore = s.highScores[gameId] || 0;
        updatedStudent = {
          ...s,
          stars: {
            ...s.stars,
            [gameId]: Math.max(currentStars, Math.min(10, stars)),
          },
          highScores: {
            ...s.highScores,
            [gameId]: Math.max(currentHighScore, score),
          },
          lastPlayed: {
            ...s.lastPlayed,
            [gameId]: new Date().toISOString(),
          },
        };
        return updatedStudent;
      }
      return s;
    });

    this.saveAllStudents(newStudents);
    return updatedStudent || this.getCurrentStudent();
  }

  public static addStudent(name: string): StudentProfile {
    const students = this.getAllStudents();
    const newStudent: StudentProfile = {
      id: 'student_' + Date.now(),
      name: name.trim() || 'Học Sinh Mới',
      stars: {},
      highScores: {},
      lastPlayed: {},
      totalPlayTimeSeconds: 0,
    };
    students.push(newStudent);
    this.saveAllStudents(students);
    this.setCurrentStudentId(newStudent.id);
    return newStudent;
  }

  public static renameStudent(studentId: string, newName: string): StudentProfile[] {
    const students = this.getAllStudents().map((s) => {
      if (s.id === studentId) {
        return { ...s, name: newName.trim() || s.name };
      }
      return s;
    });
    this.saveAllStudents(students);
    return students;
  }

  public static resetStudentProgress(studentId: string) {
    const students = this.getAllStudents().map((s) => {
      if (s.id === studentId) {
        return {
          ...s,
          stars: {},
          highScores: {},
          lastPlayed: {},
          totalPlayTimeSeconds: 0,
        };
      }
      return s;
    });
    this.saveAllStudents(students);
  }

  public static deleteStudent(studentId: string) {
    const students = this.getAllStudents().filter((s) => s.id !== studentId);
    if (students.length === 0) {
      students.push(DEFAULT_STUDENT);
    }
    this.saveAllStudents(students);
    this.setCurrentStudentId(students[0].id);
  }

  public static exportClassCSV(): string {
    const students = this.getAllStudents();
    const header = [
      'Mã Học Sinh',
      'Họ và Tên',
      'Tổng Sao (tối đa 200)',
      ...Array.from({ length: 20 }, (_, i) => `Bài ${i + 1} (sao)`),
      ...Array.from({ length: 20 }, (_, i) => `Bài ${i + 1} (điểm)`),
    ].join(',');

    const rows = students.map((s) => {
      const totalStars = Object.values(s.stars).reduce((a, b) => a + b, 0);
      const starCols = Array.from({ length: 20 }, (_, i) => s.stars[i + 1] || 0);
      const scoreCols = Array.from({ length: 20 }, (_, i) => s.highScores[i + 1] || 0);
      return [
        `"${s.id}"`,
        `"${s.name}"`,
        totalStars,
        ...starCols,
        ...scoreCols,
      ].join(',');
    });

    return [header, ...rows].join('\n');
  }

  // ---------------- USER ACCOUNTS & ACCESS APPROVAL SYSTEM ----------------

  public static getAllAccounts(): UserAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    // Initialize default accounts
    this.saveAllAccounts(DEFAULT_ACCOUNTS);
    return DEFAULT_ACCOUNTS;
  }

  public static saveAllAccounts(accounts: UserAccount[]) {
    try {
      localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch {
      // Ignore
    }
  }

  public static getCurrentUser(): UserAccount | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // Fallback
    }
    return null;
  }

  public static setCurrentUser(user: UserAccount | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  public static login(username: string, password: string): { success: boolean; user?: UserAccount; error?: string } {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedPass = password.trim();
    const accounts = this.getAllAccounts();
    // Support matching both full email (minhemai001@gmail.com) and username prefix (minhemai001)
    const account = accounts.find((a) => {
      const full = a.username.toLowerCase();
      const prefix = full.split('@')[0];
      return full === trimmedUser || prefix === trimmedUser;
    });

    if (!account) {
      return {
        success: false,
        error: 'Tài khoản không được phép! Chỉ những tài khoản do Thầy/Cô cung cấp mới có quyền truy cập hệ thống.',
      };
    }

    if (account.password !== trimmedPass) {
      return { success: false, error: 'Mật khẩu không chính xác! Vui lòng nhập đúng mật khẩu đã được cấp.' };
    }

    // Check approval status: only approved accounts or admin can enter!
    if (!account.isApproved && account.role !== 'admin') {
      return {
        success: false,
        error: 'Tài khoản của bạn CHƯA ĐƯỢC DUYỆT! Vui lòng liên hệ Thầy/Cô để được cấp phép vào hệ thống nhé.',
      };
    }

    // Update lastLoginAt
    const updated = accounts.map((a) => (a.id === account.id ? { ...a, lastLoginAt: new Date().toISOString() } : a));
    this.saveAllAccounts(updated);

    const loggedInUser = { ...account, lastLoginAt: new Date().toISOString() };
    this.setCurrentUser(loggedInUser);

    // If student, link/ensure StudentProfile
    if (loggedInUser.role === 'student') {
      const students = this.getAllStudents();
      let student = students.find((s) => s.id === loggedInUser.id || s.username === loggedInUser.username);
      if (!student) {
        student = {
          id: loggedInUser.id,
          username: loggedInUser.username,
          name: loggedInUser.displayName,
          stars: {},
          highScores: {},
          lastPlayed: {},
          totalPlayTimeSeconds: 0,
        };
        students.push(student);
        this.saveAllStudents(students);
      }
      this.setCurrentStudentId(student.id);
    }

    return { success: true, user: loggedInUser };
  }

  public static registerStudent(
    username: string,
    displayName: string,
    password: string
  ): { success: boolean; user?: UserAccount; error?: string } {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedName = displayName.trim() || trimmedUser;

    if (!trimmedUser || trimmedUser.length < 3) {
      return { success: false, error: 'Tên đăng nhập phải có ít nhất 3 ký tự!' };
    }

    if (!password || password.length < 2) {
      return { success: false, error: 'Mật khẩu phải có ít nhất 2 ký tự!' };
    }

    const accounts = this.getAllAccounts();
    if (accounts.some((a) => a.username.toLowerCase() === trimmedUser)) {
      return { success: false, error: 'Tên đăng nhập này đã có người sử dụng. Vui lòng chọn tên khác!' };
    }

    const newAccount: UserAccount = {
      id: `acc_${Date.now()}`,
      username: trimmedUser,
      displayName: trimmedName,
      password,
      role: 'student',
      isApproved: false, // Must be approved by teacher!
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    this.saveAllAccounts(accounts);

    return { success: true, user: newAccount };
  }

  public static addAccountByAdmin(
    username: string,
    displayName: string,
    password: string,
    role: 'admin' | 'student',
    isApproved: boolean = true
  ): { success: boolean; error?: string } {
    const trimmedUser = username.trim().toLowerCase();
    const trimmedName = displayName.trim() || trimmedUser;

    if (!trimmedUser || trimmedUser.length < 2) {
      return { success: false, error: 'Tên đăng nhập không được để trống!' };
    }

    const accounts = this.getAllAccounts();
    if (accounts.some((a) => a.username.toLowerCase() === trimmedUser)) {
      return { success: false, error: 'Tên đăng nhập này đã tồn tại!' };
    }

    const newAccount: UserAccount = {
      id: `acc_${Date.now()}`,
      username: trimmedUser,
      displayName: trimmedName,
      password: password || '123',
      role,
      isApproved,
      createdAt: new Date().toISOString(),
    };

    accounts.push(newAccount);
    this.saveAllAccounts(accounts);

    // If student, initialize profile
    if (role === 'student') {
      const students = this.getAllStudents();
      students.push({
        id: newAccount.id,
        username: newAccount.username,
        name: newAccount.displayName,
        stars: {},
        highScores: {},
        lastPlayed: {},
        totalPlayTimeSeconds: 0,
      });
      this.saveAllStudents(students);
    }

    return { success: true };
  }

  public static toggleAccountApproval(accountId: string): boolean {
    const accounts = this.getAllAccounts();
    let nextStatus = false;
    const updated = accounts.map((a) => {
      if (a.id === accountId) {
        nextStatus = !a.isApproved;
        return { ...a, isApproved: nextStatus };
      }
      return a;
    });
    this.saveAllAccounts(updated);
    return nextStatus;
  }

  public static deleteAccount(accountId: string) {
    const accounts = this.getAllAccounts().filter((a) => a.id !== accountId);
    this.saveAllAccounts(accounts);
  }

  public static updateAccountPassword(accountId: string, newPass: string) {
    const accounts = this.getAllAccounts().map((a) => (a.id === accountId ? { ...a, password: newPass } : a));
    this.saveAllAccounts(accounts);
  }

  public static exportAccountsJSON(): string {
    const accounts = this.getAllAccounts();
    return JSON.stringify(accounts, null, 2);
  }

  public static importAccountsJSON(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0) {
        this.saveAllAccounts(parsed);
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  }
}
