import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true
});

// Auth API
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Users API
export const getUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

export const inviteUser = async (email: string, role: string) => {
  try {
    // Make sure we're sending the exact format the API expects
    const response = await api.post('/users/invite', { 
      email: email.trim(), 
      role: role.trim() 
    });
    return response.data;
  } catch (error) {
    console.error('Error inviting user:', error);
    throw error;
  }
};

// Tasks API
export const getTasks = async () => {
  try {
    const response = await api.get('/tasks');
    // Transform the data to match our frontend structure
    console.log(response.data)
    const transformedData = response.data.map((item: any) => {
      const taskData = item.task || {};
      return {
        id: taskData.sortKey?.replace('TASK#', ''),
        sortKey: taskData.sortKey,
        partitionKey: taskData.partitionKey,
        title: taskData.tasktitle,
        description: taskData.description,
        status: taskData.status,
        dueDate: taskData.deadline,
        createdAt: taskData.createdAt,
        createdby: taskData.createdby,
        assignee: item.assignee || [],
        assigneeName: item.assignee && item.assignee.length > 0 ? item.assignee[0].username : 'Unassigned',
        task: taskData
      };
    });
    return transformedData;
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};

export const getTask = async (taskId: string) => {
  try {
    const response = await api.get(`/tasks/${taskId}/view`);
    const data = response.data;
    
    // Transform the data to match our frontend structure
    if (data.task) {
      return {
        id: data.task.sortKey?.replace('TASK#', ''),
        sortKey: data.task.sortKey,
        partitionKey: data.task.partitionKey,
        title: data.task.tasktitle,
        description: data.task.description,
        status: data.task.status,
        dueDate: data.task.deadline,
        createdAt: data.task.createdAt,
        createdby: data.task.createdby,
        assignee: data.assignee || [],
        assigneeName: data.assignee && data.assignee.length > 0 ? data.assignee[0].username : 'Unassigned',
        history: data.history || [],
        task: data.task
      };
    }
    return data;
  } catch (error) {
    console.error('Error fetching task:', error);
    throw error;
  }
};

export const createTask = async (taskData: any) => {
  try {
    // Log the data being sent
    console.log('Creating task with data:', taskData);
    
    // Send data directly without transformation
    const response = await api.post('/tasks', taskData);
    console.log('Task creation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
};

export const updateTask = async (taskId: string, taskData: any) => {
  try {
    const response = await api.post(`/tasks/${taskId}/update`, taskData);
    return response.data;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

export const updateTaskStatus = async (taskId: string, status: string, description: string = '') => {
  try {
    const payload = {
      status,
      updateDescription: description || "Status updated",
      updatedAt: new Date().toISOString().split('T')[0]
    };
    console.log('Updating task status with:', payload);
    const response = await api.post(`/tasks/${taskId}/history`, payload);
    return response.data;
  } catch (error) {
    console.error('Error updating task status:', error);
    throw error;
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Notifications API
export const getNotifications = async () => {
  try {
    const response = await api.post('/users/notification');
    return response.data;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

export default api;