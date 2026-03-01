const API_URL = '/api';

export const api = {
  async request(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Something went wrong');
    }
    return response.json();
  },

  auth: {
    login: (data: any) => api.request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) => api.request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  },

  posts: {
    getAll: () => api.request('/posts'),
    create: (data: any) => api.request('/posts', { method: 'POST', body: JSON.stringify(data) }),
  },

  profile: {
    get: (id: number) => api.request(`/profile/${id}`),
  },

  subjects: {
    getAll: () => api.request('/subjects'),
  },

  resources: {
    getAll: () => api.request('/resources'),
    upload: (data: any) => api.request('/resources', { method: 'POST', body: JSON.stringify(data) }),
    search: (q: string) => api.request(`/resources/search?q=${encodeURIComponent(q)}`),
  },

  studyGroups: {
    getAll: () => api.request('/study-groups'),
    create: (data: any) => api.request('/study-groups', { method: 'POST', body: JSON.stringify(data) }),
    join: (id: number) => api.request(`/study-groups/${id}/join`, { method: 'POST' }),
    getMessages: (id: number) => api.request(`/study-groups/${id}/messages`),
    sendMessage: (id: number, content: string) => api.request(`/study-groups/${id}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
    getResources: (id: number) => api.request(`/study-groups/${id}/resources`),
    addResource: (id: number, resource_id: number) => api.request(`/study-groups/${id}/resources`, { method: 'POST', body: JSON.stringify({ resource_id }) }),
  },

  messages: {
    getChat: (otherId: number) => api.request(`/messages/${otherId}`),
    send: (data: any) => api.request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  },

  teacher: {
    getAnalytics: () => api.request('/teacher/analytics'),
  }
};
