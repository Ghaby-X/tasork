import axios from 'axios';

// Replace with your actual API endpoint
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Add request interceptor to include auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const login = async (email: string, password: string) => {
  // For demo purposes, we'll simulate login
  // In production, this would call your actual login endpoint
  return {
    token: 'mock-token',
    user: {
      id: 'USER#2478f4b8-f0d1-7017-4093-9dc54107317c',
      name: 'Admin User',
      email: email,
      role: 'admin'
    }
  };
};

export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

// Tasks API
export const getTasks = async (userId?: string) => {
  try {
    let url = '/tasks';
    if (userId) {
      // Remove USER# prefix if present
      const cleanUserId = userId.startsWith('USER#') ? userId.substring(5) : userId;
      url = `/tasks/user/${cleanUserId}`;
    }
    
    const response = await api.get(url);
    
    // Transform API response to match our UI model
    if (!response.data || !Array.isArray(response.data)) {
      return []
    }
    return response.data.map((item: any) => ({
      id: item.task.sortKey.replace('TASK#', ''),
      title: item.task.tasktitle,
      description: item.task.description || '',
      status: item.task.status,
      assignedTo: item.assignee[0]?.userId.replace('USER#', '') || '',
      assigneeName: item.assignee[0]?.username || 'Unassigned',
      dueDate: item.task.deadline,
      createdAt: item.task.createdAt,
      updatedAt: item.task.updatedAt || item.task.createdAt
    }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

export const getTask = async (taskId: string) => {
  try {
    const response = await api.get(`/tasks/${taskId}/view`);
    const data = response.data;
    
    return {
      id: data.task.sortKey.replace('TASK#', ''),
      title: data.task.tasktitle,
      description: data.task.description || '',
      status: data.task.status,
      assignedTo: data.assignee[0]?.userId.replace('USER#', '') || '',
      assigneeName: data.assignee[0]?.username || 'Unassigned',
      dueDate: data.task.deadline,
      createdAt: data.task.createdAt,
      updatedAt: data.task.updatedAt || data.task.createdAt
    };
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

export const createTask = async (taskData: any) => {
  try {
    // Transform UI model to API model
    const apiTaskData = {
      taskTitle: taskData.taskTitle,
      description: taskData.description,
      status: taskData.status,
      deadline: taskData.deadline,
      createdAt: new Date().toISOString(),
      assignee: taskData.assignee || []
    };
    
    const response = await api.post('/tasks', apiTaskData);
    console.log(response.data);
    
    // Return transformed response
    return {
      id: response.data.task.sortKey.replace('TASK#', ''),
      title: response.data.task.tasktitle,
      description: response.data.task.description || '',
      status: response.data.task.status,
      assignedTo: taskData.assignee?.[0]?.userId,
      assigneeName: taskData.assignee?.[0]?.username || 'Unassigned',
      dueDate: response.data.task.deadline,
      createdAt: response.data.task.createdAt,
      updatedAt: response.data.task.createdAt
    };
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, taskData: any) => {
  try {
    // For status updates, use the history endpoint
    if (taskData.status && Object.keys(taskData).length === 1) {
      const historyData = {
        status: taskData.status,
        updateDescription: `Status changed to ${taskData.status}`,
        updatedAt: new Date().toISOString()
      };
      
      await api.post(`/tasks/${taskId}/history`, historyData);
      
      // Return the updated task data
      return {
        id: taskId,
        status: taskData.status,
        updatedAt: historyData.updatedAt
      };
    } else {
      // For full task updates
      const apiTaskData = {
        taskTitle: taskData.title,
        status: taskData.status,
        deadline: taskData.dueDate,
        assignee: taskData.assignedTo ? [{ userId: `USER#${taskData.assignedTo}` }] : []
      };
      
      const response = await api.post(`/tasks/${taskId}/update`, apiTaskData);
      
      // Return transformed response
      return {
        id: taskId,
        ...taskData,
        updatedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Task History API
export const getTaskHistory = async (taskId: string) => {
  try {
    // This would be a real API call in production
    // For demo purposes, we'll return mock data
    return [
      {
        id: '1',
        taskId: taskId,
        status: 'healthy',
        updateDescription: 'Task created',
        updatedAt: '2023-12-01T10:00:00Z',
        updatedBy: 'Admin User'
      },
      {
        id: '2',
        taskId: taskId,
        status: 'at_risk',
        updateDescription: 'Status changed to at risk',
        updatedAt: '2023-12-05T14:30:00Z',
        updatedBy: 'John Doe'
      },
      {
        id: '3',
        taskId: taskId,
        status: 'healthy',
        updateDescription: 'Status changed to healthy',
        updatedAt: '2023-12-10T09:15:00Z',
        updatedBy: 'Jane Smith'
      }
    ];
  } catch (error) {
    console.error('Error fetching task history:', error);
    return [];
  }
};

// Users API
export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    
    // Transform API response to match our UI model
    return response.data.map((user: any) => ({
      id: user.userId,
      name: user.username,
      email: user.email,
      role: user.role || 'team_member',
      tasksAssigned: user.tasksAssigned || 0
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const inviteUser = async (userData: any) => {
  try {
    const apiUserData = {
      email: userData.email,
      role: userData.role
    };
    
    const response = await api.post('/users/invite', apiUserData);
    
    return {
      id: response.data.userId || `temp-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      tasksAssigned: 0
    };
  } catch (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
};

// Notifications API
export const getNotifications = async () => {
  try {
    // This would be a real API call in production
    // For demo purposes, we'll return mock data
    return [
      {
        id: '1',
        type: 'task_assigned',
        message: 'You have been assigned to a new task: Inspect Site A',
        taskId: '1',
        read: false,
        createdAt: '2023-12-15T08:30:00Z'
      },
      {
        id: '2',
        type: 'task_updated',
        message: 'Task "Maintenance at Site B" has been updated',
        taskId: '2',
        read: false,
        createdAt: '2023-12-14T16:45:00Z'
      },
      {
        id: '3',
        type: 'deadline_approaching',
        message: 'Task "Emergency Repair at Site C" is due tomorrow',
        taskId: '3',
        read: false,
        createdAt: '2023-12-17T09:00:00Z'
      }
    ];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId: string) => {
  try {
    // This would be a real API call in production
    // For demo purposes, we'll just return success
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

export default api;