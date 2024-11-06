import axios from 'axios';
import { Admin } from '../types/admin.types';

const api = axios.create({
    baseURL: 'http://localhost:4400/api',
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
