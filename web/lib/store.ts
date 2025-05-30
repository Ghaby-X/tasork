import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export interface Task {
  id?: string;
  sortKey?: string;
  partitionKey?: string;
  title?: string;
  tasktitle?: string;
  description?: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'healthy' | 'at_risk' | 'behind';
  assignedTo?: string;
  assigneeName?: string;
  dueDate?: string;
  deadline?: string;
  createdAt?: string;
  createdby?: string;
  updatedAt?: string;
  task?: any;
  assignee?: any[];
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  logout: () => void;
}

interface TaskState {
  tasks: Task[];
  currentTask: Task | null;
  isLoading: boolean;
  error: string | null;
  setTasks: (tasks: Task[]) => void;
  setCurrentTask: (task: Task | null) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updatedTask: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));

// Get user role from local storage or cookie if available
export const getUserRole = (): string => {
  if (typeof window === 'undefined') return '';
  
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      return user.role || '';
    }
    
    // Alternative: check JWT claims if stored in cookies
    return '';
  } catch (e) {
    console.error('Error getting user role:', e);
    return '';
  }
};

export const useTaskStore = create<TaskState>((set) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  setTasks: (tasks) => set({ tasks: Array.isArray(tasks) ? tasks : [] }),
  setCurrentTask: (currentTask) => set({ currentTask }),
  addTask: (task) => set((state) => ({ 
    tasks: [...state.tasks, task] 
  })),
  updateTask: (taskId, updatedTask) => set((state) => ({
    tasks: state.tasks.map((task) =>
      task.id === taskId ? { ...task, ...updatedTask } : task
    ),
    currentTask: state.currentTask?.id === taskId 
      ? { ...state.currentTask, ...updatedTask } 
      : state.currentTask
  })),
  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter((task) => task.id !== taskId)
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));