import axios from 'axios';
import { Mosque } from '../types/mosque.types';
import { API_BASE_URL } from '../config/config';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getAllMosques = async (): Promise<Mosque[]> => {
    const response = await api.get('/mosques');
    return response.data;
};

export const getMosqueById = async (id: number): Promise<Mosque> => {
    const response = await api.get(`/mosques/${id}`);
    return response.data;
};

export const createMosque = async (mosque: Mosque): Promise<Mosque> => {
    const response = await api.post('/mosques', mosque);
    return response.data;
};

export const updateMosque = async (id: number, mosque: Partial<Mosque>): Promise<Mosque> => {
    const response = await api.put(`/mosques/${id}`, mosque);
    return response.data;
};

export const deleteMosque = async (id: number): Promise<void> => {
    await api.delete(`/mosques/${id}`);
};
