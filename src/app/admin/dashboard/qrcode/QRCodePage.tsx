'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'

interface QRCode {
	id: number;
	imageUrl: string;
	mosqueId: number;
}

// Интерфейс для мечети (если еще не создан)
interface Mosque {
	id: number;
	name: string;
	logoUrl: string;
	cityId: number;
}

const QRCodePage = () => {
	const [qrcodes, setQRCodes] = useState<QRCode[]>([]);
	const [image, setImage] = useState<File | null>(null);
	const [mosqueId, setMosqueId] = useState<string>('');
	const [mosques, setMosques] = useState<Mosque[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [editingQRCodeId, setEditingQRCodeId] = useState<number | null>(null);
	const [userRole, setUserRole] = useState('');
	const [userCityId, setUserCityId] = useState<number | null>(null);

	const fetchUserRole = async () => {
		const token = localStorage.getItem('token');
		const response = await axios.get(`${API_BASE_URL}/api/admin/me`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setUserRole(response.data.role);
		setUserCityId(response.data.cityId);
	};

	const fetchMosques = async () => {
		const response = await axios.get<Mosque[]>(`${API_BASE_URL}/api/mosques`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		setMosques(response.data);
	};

	const fetchQRCodes = async () => {
		const response = await axios.get<QRCode[]>(`${API_BASE_URL}/api/qrcodes`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		setQRCodes(response.data);
	};

	const handleCreateQRCode = async () => {
		const formData = new FormData();
		if (image) {
			formData.append('image', image);
		}
		formData.append('mosqueId', mosqueId);

		await axios.post(`${API_BASE_URL}/api/qrcodes/create`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchQRCodes();
		resetForm();
	};

	const handleDeleteQRCode = async (id: number) => {
		await axios.delete(`${API_BASE_URL}/api/qrcodes/${id}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchQRCodes();
	};

	const handleEditQRCode = (qrcode: QRCode) => {
		setIsEditing(true);
		setEditingQRCodeId(qrcode.id);
		setMosqueId(qrcode.mosqueId.toString());
		setImage(null);
	};

	const handleUpdateQRCode = async () => {
		const formData = new FormData();
		if (image) {
			formData.append('image', image);
		}
		formData.append('mosqueId', mosqueId);

		await axios.put(`${API_BASE_URL}/api/qrcodes/${editingQRCodeId}`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchQRCodes();
		resetForm();
	};

	const resetForm = () => {
		setImage(null);
		setMosqueId('');
		setIsEditing(false);
		setEditingQRCodeId(null);
	};

	const handleBack = () => {
		window.location.href = DASHBOARD_PAGES.DASHBOARD;
	};

	useEffect(() => {
		fetchUserRole();
		fetchMosques();
	}, []);

	useEffect(() => {
		if (userRole) {
			fetchQRCodes();
		}
	}, [userRole]);

	// Фильтруем QR-коды для CITY_ADMIN
	const filteredQRCodes = userRole === 'CITY_ADMIN' && userCityId
		? qrcodes.filter(qrcode => mosques.some(mosque => mosque.id === qrcode.mosqueId && mosque.cityId === userCityId))
		: qrcodes;

	// Фильтруем мечети для выбора
	const filteredMosques = userRole === 'CITY_ADMIN' && userCityId
		? mosques.filter(mosque => mosque.cityId === userCityId)
		: mosques;

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
			<div className="w-full max-w-[1000px] p-8 bg-white rounded-lg shadow-md">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl font-bold text-gray-700">Список QR-кодов</h2>
					<button onClick={handleBack} className="text-blue-600">Назад</button>
				</div>
				<ul className="my-4 max-h-64 overflow-y-auto">
					{filteredQRCodes.map((qrcode) => {
						const mosque = mosques.find(m => m.id === qrcode.mosqueId);
						return (
							<li key={qrcode.id} className="flex items-center border-b py-2">
								<img
									src={qrcode.imageUrl ? `${API_BASE_URL}${qrcode.imageUrl}` : 'https://via.placeholder.com/61x61'}
									alt="QR code"
									className="h-16 w-16 mr-2"
								/>
								<div className="flex-1">
									<span className="font-semibold text-bg">{mosque ? mosque.name : 'Неизвестная мечеть'}</span>
								</div>
								{(userRole === 'SUPER_ADMIN' || (userRole === 'CITY_ADMIN' && mosque && mosque.cityId === userCityId)) && (
									<>
										<button onClick={() => handleEditQRCode(qrcode)}
														className=" text-yellow-500 p-2 mr-2">Редактировать
										</button>
										<button onClick={() => handleDeleteQRCode(qrcode.id)} className="text-red-500">Удалить</button>
									</>
								)}
							</li>
						);
					})}
				</ul>
				<h2 className="mt-4 text-lg font-bold text-bg">{isEditing ? 'Редактировать QR-код' : 'Добавить QR-код'}</h2>
				<input
					type="file"
					accept="image/*"
					onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
					className="border p-2 mb-2 text-bg w-full"
				/>
				<select
					value={mosqueId}
					onChange={(e) => setMosqueId(e.target.value)}
					className="border p-2 mb-2 text-bg w-full"
				>
					<option value="">Выберите мечеть</option>
					{filteredMosques.map((mosque) => (
						<option key={mosque.id} value={mosque.id}>{mosque.name}</option>
					))}
				</select>
				<button onClick={isEditing ? handleUpdateQRCode : handleCreateQRCode} className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out mt-2">
					{isEditing ? 'Сохранить изменения' : 'Добавить'}
				</button>
				{isEditing && (
					<button onClick={resetForm} className="w-full px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition duration-300 ease-in-out mt-2">
						Отмена
					</button>
				)}
			</div>
		</div>
	);
};

export default QRCodePage;