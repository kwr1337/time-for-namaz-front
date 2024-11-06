'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'

interface City {
	id: number;
	name: string;
	logoUrl?: string;
}

const CityPage = () => {
	const [cities, setCities] = useState<City[]>([]);
	const [name, setName] = useState<string>('');
	const [logo, setLogo] = useState<File | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editingCityId, setEditingCityId] = useState<number | null>(null);
	const [userRole, setUserRole] = useState('');
	const [userCityId, setUserCityId] = useState<number | null>(null);

	const fetchCities = async () => {
		const response = await axios.get<City[]>(`${API_BASE_URL}/api/cities`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		if (userRole === 'CITY_ADMIN' && userCityId) {
			setCities(response.data.filter((city) => city.id === userCityId));
		} else {
			setCities(response.data);
		}
	};

	const fetchUserRole = async () => {
		const token = localStorage.getItem('token');
		const response = await axios.get(`${API_BASE_URL}/api/admin/me`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setUserRole(response.data.role);
		setUserCityId(response.data.cityId);
	};

	const handleCreateCity = async () => {
		const formData = new FormData();
		if (logo) {
			formData.append('file', logo);
		}
		formData.append('name', name);

		await axios.post(`${API_BASE_URL}/api/cities`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchCities();
		resetForm();
	};

	const handleDeleteCity = async (id: number) => {
		await axios.delete(`${API_BASE_URL}/api/cities/${id}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchCities();
	};

	const handleEditCity = (city: City) => {
		if (userRole === 'CITY_ADMIN' && city.id !== userCityId) return;
		setIsEditing(true);
		setEditingCityId(city.id);
		setName(city.name);
		setLogo(null);
	};

	const handleUpdateCity = async () => {
		const formData = new FormData();
		if (logo) {
			formData.append('file', logo);
		}
		formData.append('name', name);

		await axios.put(`${API_BASE_URL}/api/cities/${editingCityId}`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchCities();
		resetForm();
	};

	const resetForm = () => {
		setLogo(null);
		setName('');
		setIsEditing(false);
		setEditingCityId(null);
	};

	const handleBack = () => {
		window.location.href = DASHBOARD_PAGES.DASHBOARD;
	};

	useEffect(() => {
		fetchUserRole();
	}, []);

	useEffect(() => {
		if (userRole) {
			fetchCities();
		}
	}, [userRole, userCityId]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
			<div className="w-full max-w-[1000px] p-8 bg-white rounded-lg shadow-md">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl font-bold text-gray-700">Список городов</h2>
					<button onClick={handleBack} className="text-blue-600">Назад</button>
				</div>
				<ul className="my-4 max-h-64 overflow-y-auto">
					{cities.map((city) => (
						<li key={city.id} className="flex items-center border-b py-2">
							<div className="flex-1">
								<span className="font-semibold text-bg">{city.name}</span>
							</div>
							<div className="flex-1">
								<img
									src={city.logoUrl ? `${API_BASE_URL}${city.logoUrl}` : 'https://via.placeholder.com/61x61'}
									alt="QR code"
									className="h-16 w-16 mr-2"
								/>
							</div>
							{userRole === 'SUPER_ADMIN' && (
								<>
									<button onClick={() => handleEditCity(city)} className="text-yellow-500 p-2 mr-2">Редактировать
									</button>
									<button onClick={() => handleDeleteCity(city.id)} className="text-red-500">Удалить</button>
								</>
							)}
							{userRole === 'CITY_ADMIN' && city.id === userCityId && (
								<button onClick={() => handleEditCity(city)} className="text-yellow-500 p-2">Редактировать</button>
							)}
						</li>
					))}
				</ul>
				{(userRole === 'SUPER_ADMIN' || (userRole === 'CITY_ADMIN' && isEditing)) && (
					<>
						<h2 className="mt-4 text-lg font-bold text-bg">{isEditing ? 'Редактировать город' : 'Добавить город'}</h2>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="Название города"
							className="border p-2 mb-2 w-full"
						/>
						<input
							type="file"
							accept="image/*"
							onChange={(e) => setLogo(e.target.files ? e.target.files[0] : null)}
							className="border p-2 mb-2 text-bg w-full"
						/>
						<button onClick={isEditing ? handleUpdateCity : handleCreateCity} className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out mt-2">
							{isEditing ? 'Сохранить изменения' : 'Добавить'}
						</button>
					</>
				)}
				{isEditing && (
					<button onClick={resetForm} className="w-full px-4 py-2 text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition duration-300 ease-in-out mt-2">
						Отмена
					</button>
				)}
			</div>
		</div>
	);
};

export default CityPage;
