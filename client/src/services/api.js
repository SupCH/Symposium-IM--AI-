import axios from 'axios';
import { useAuthStore } from '../store';

const API_BASE = 'http://localhost:3000/api';

// 创建 axios 实例
const api = axios.create({
    baseURL: API_BASE,
    headers: {
        'Content-Type': 'application/json'
    }
});

// 请求拦截器：添加 token
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// 响应拦截器：处理认证错误
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().logout();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// 认证 API
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me')
};

// 用户 API
export const userAPI = {
    search: (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
    getById: (id) => api.get(`/users/${id}`),
    updateProfile: (data) => api.put('/users/profile', data)
};

// 好友 API
export const friendsAPI = {
    list: () => api.get('/friends'),
    requests: () => api.get('/friends/requests'),
    sendRequest: (friendId) => api.post('/friends/request', { friendId }),
    accept: (requestId) => api.post(`/friends/accept/${requestId}`),
    reject: (requestId) => api.post(`/friends/reject/${requestId}`),
    remove: (friendId) => api.delete(`/friends/${friendId}`)
};

// 会话 API
export const conversationsAPI = {
    list: () => api.get('/conversations'),
    create: (participantId) => api.post('/conversations', { type: 'private', participantId }),
    createGroup: (name, memberIds) => api.post('/conversations/group', { name, memberIds }),
    getMessages: (conversationId, params) => api.get(`/conversations/${conversationId}/messages`, { params }),
    getMembers: (conversationId) => api.get(`/conversations/${conversationId}/members`)
};

// 文件 API
export const filesAPI = {
    upload: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/files/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    },
    uploadAvatar: (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        return api.post('/files/avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
    }
};

// AI API
export const aiAPI = {
    getUsers: () => api.get('/ai/users'),
    startChat: (aiUserId) => api.post(`/ai/start-chat/${aiUserId}`)
};

export default api;
