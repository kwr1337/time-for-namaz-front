import axios from 'axios';
import { Admin } from '../types/admin.types';
import { API_BASE_URL } from '../config/config';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getAllAdmins = async (): Promise<Admin[]> => {
    const response = await api.get('/admins');
    return response.data;
};

export const getAdminById = async (id: number): Promise<Admin> => {
    const response = await api.get(`/admins/${id}`);
    return response.data;
};

export const createAdmin = async (admin: Admin): Promise<Admin> => {
    const response = await api.post('/admins', admin);
    return response.data;
};

export const updateAdmin = async (id: number, admin: Partial<Admin>): Promise<Admin> => {
    const response = await api.put(`/admins/${id}`, admin);
    return response.data;
};

export const deleteAdmin = async (id: number): Promise<void> => {
    await api.delete(`/admins/${id}`);
};
