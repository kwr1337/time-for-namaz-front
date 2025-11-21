import axios from 'axios';
import { Prayer } from '../types/prayer.types';
import { API_BASE_URL } from '../config/config';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getPrayersByCityId = async (cityId: number): Promise<Prayer[]> => {
    const response = await api.get(`/prayers?cityId=${cityId}`);
    return response.data;
};
