import axios from 'axios';
import { QRCode } from '../types/qrcode.types';
import { API_BASE_URL } from '../config/config';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getQRCodesByMosqueId = async (mosqueId: number): Promise<QRCode[]> => {
    const response = await api.get(`/qrcodes?mosqueId=${mosqueId}`);
    return response.data;
};
