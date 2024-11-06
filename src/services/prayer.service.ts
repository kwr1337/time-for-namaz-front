import axios from 'axios';
import { Prayer } from '../types/prayer.types';

const api = axios.create({
    baseURL: 'http://localhost:4400/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getPrayersByCityId = async (cityId: number): Promise<Prayer[]> => {
    const response = await api.get(`/prayers?cityId=${cityId}`);
    return response.data;
};
