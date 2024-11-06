import axios from 'axios';
import { QRCode } from '../types/qrcode.types';

const api = axios.create({
    baseURL: 'http://localhost:4400/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

export const getQRCodesByMosqueId = async (mosqueId: number): Promise<QRCode[]> => {
    const response = await api.get(`/qrcodes?mosqueId=${mosqueId}`);
    return response.data;
};
