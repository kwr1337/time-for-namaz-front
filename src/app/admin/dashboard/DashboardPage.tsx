'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'

const DashboardPage = () => {
	const [role, setRole] = useState('');
	const [city, setCity] = useState('');

	useEffect(() => {
		const fetchData = async () => {
			try {
				const token = localStorage.getItem('token');

				// Получаем информацию о текущем администраторе
				const adminResponse = await axios.get(`${API_BASE_URL}/api/admin/me`, {
					headers: { Authorization: `Bearer ${token}` }
				});
				setRole(adminResponse.data.role);

				// Если это CITY_ADMIN, получаем город
				if (adminResponse.data.role === 'CITY_ADMIN' && adminResponse.data.cityId) {
					const citiesResponse = await axios.get(`${API_BASE_URL}/api/cities`);
					// @ts-ignore
					const cityData = citiesResponse.data.find(city => city.id === adminResponse.data.cityId);
					setCity(cityData ? cityData.name : 'Неизвестный город');
				}
			} catch (err) {
				console.error('Ошибка при загрузке данных');
			}
		};
		fetchData();
	}, []);

	const handleGoToMosques = () => {
		window.location.href = DASHBOARD_PAGES.MOSQUE;
	};

	const handleGoToPrayer = () => {
		window.location.href = DASHBOARD_PAGES.PRAYER;
	};

	const handleGoToQrCode = () => {
		window.location.href = DASHBOARD_PAGES.QRCODE;
	};

	const handleGoToСity = () => {
		window.location.href = DASHBOARD_PAGES.CITY;
	};

	const handleGoToAdminManagment = () => {
		window.location.href = DASHBOARD_PAGES.ADMINMANAGMENT;
	};

	const handleGoToAuditLogs = () => {
		window.location.href = DASHBOARD_PAGES.AUDIT_LOGS;
	};

<<<<<<< HEAD
	const handleGoToDictionary = () => {
		window.location.href = DASHBOARD_PAGES.DICTIONARY;
	};

=======
>>>>>>> origin/master
	const handleLogout = () => {
		localStorage.removeItem('token');
		window.location.href = '/auth';
	};

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 overflow-y-auto max-h-screen">
			<h2 className="text-3xl font-bold text-gray-800 mb-6">
				{role === 'SUPER_ADMIN' ? 'Панель главного администратора' : `Панель администратора города: ${city}`}
			</h2>

			<div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md space-y-4">
				<button
					onClick={handleGoToMosques}
					className="mt-4 bg-blue-500 w-full text-white p-2 rounded hover:bg-blue-600 transition"
				>
					Перейти к редактирование мечетей
				</button>

				<button
					onClick={handleGoToPrayer}
					className="mt-4 bg-blue-500 w-full text-white p-2 rounded hover:bg-blue-600 transition"
				>
					Перейти к редактирование времени
				</button>

				<button
					onClick={handleGoToQrCode}
					className="mt-4 bg-blue-500 w-full text-white p-2 rounded hover:bg-blue-600 transition"
				>
					Перейти к редактирование qr-кода
				</button>

				<button
					onClick={handleGoToСity}
					className="mt-4 bg-blue-500 w-full text-white p-2 rounded hover:bg-blue-600 transition"
				>
					Перейти к редактирование городов
				</button>

				{role === 'SUPER_ADMIN' && (
					<button
						onClick={handleGoToAdminManagment}
						className="mt-4 bg-blue-500 w-full text-white p-2 rounded hover:bg-blue-600 transition"
					>
						Перейти к редактирование админов
					</button>
				)}

				{role === 'SUPER_ADMIN' && (
					<button
						onClick={handleGoToAuditLogs}
						className="mt-4 bg-blue-500 w-full text-white p-2 rounded hover:bg-blue-600 transition"
					>
						Перейти к логам аудита
					</button>
				)}

<<<<<<< HEAD
				{role === 'SUPER_ADMIN' && (
					<button
						onClick={handleGoToDictionary}
						className="mt-4 bg-blue-500 w-full text-white p-2 rounded hover:bg-blue-600 transition"
					>
						Перейти к словарям (RU/TT)
					</button>
				)}

=======
>>>>>>> origin/master
				<button
					onClick={handleLogout}
					className="mt-4 bg-red-500 w-full text-white p-2 rounded hover:bg-red-600 transition"
				>
					Выйти
				</button>
			</div>
		</div>
	);
};

export default DashboardPage;
