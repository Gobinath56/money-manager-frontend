import api from './api';

// Stores the token and wires it into every future Axios request
export const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    setAuthHeader(token);             // attach to Axios immediately
    return response.data;
};

export const register = async (email, password) => {
    const response = await api.post('/auth/register', { email, password });
    const { token } = response.data;
    localStorage.setItem('token', token);
    setAuthHeader(token);
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
};

export const getToken = () => localStorage.getItem('token');

// Call this once on app startup to restore a persisted token
export const setAuthHeader = (token) => {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        // Every future api.get/post/put/delete will include this header automatically
    }
};