'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'

// Интерфейс для мечети
interface Mosque {
	id: number;
	name: string;
	logoUrl: string;
	cityId: number;
}

// Интерфейс для города
interface City {
	id: number;
	name: string;
}

const MosquePage = () => {
	const [mosques, setMosques] = useState<Mosque[]>([]);
	const [name, setName] = useState('');
	const [logo, setLogo] = useState<File | null>(null);
	const [cityId, setCityId] = useState('');
	const [userRole, setUserRole] = useState('');
	const [userCityId, setUserCityId] = useState<number | null>(null);
	const [cities, setCities] = useState<City[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [editingMosqueId, setEditingMosqueId] = useState<number | null>(null);

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
		const allMosques = response.data;

		if (userRole === 'CITY_ADMIN' && userCityId !== null) {
			setMosques(allMosques.filter((mosque) => mosque.cityId === userCityId));
		} else {
			setMosques(allMosques);
		}
	};

	const fetchCities = async () => {
		const response = await axios.get<City[]>(`${API_BASE_URL}/api/cities`);
		setCities(response.data);
	};

	const handleCreateMosque = async () => {
		const token = localStorage.getItem('token');
		const formData = new FormData();
		formData.append('name', name);
		if (logo) {
			formData.append('logo', logo);
		}

		const effectiveCityId = userRole === 'CITY_ADMIN' ? userCityId : cityId;
		if (effectiveCityId) {
			formData.append('cityId', effectiveCityId.toString());
		}

		await axios.post(`${API_BASE_URL}/api/mosques`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				Authorization: `Bearer ${token}`,
			},
		});
		fetchMosques();
		resetForm();
	};

	const handleDeleteMosque = async (id: number) => {
		const token = localStorage.getItem('token');
		await axios.delete(`${API_BASE_URL}/api/mosques/${id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		fetchMosques();
	};

	const handleEditMosque = (mosque: Mosque) => {
		setIsEditing(true);
		setEditingMosqueId(mosque.id);
		setName(mosque.name);
		setCityId(mosque.cityId.toString());
		setLogo(null);
	};

	const handleUpdateMosque = async () => {
		const token = localStorage.getItem('token');
		const formData = new FormData();
		formData.append('name', name);
		if (logo) {
			formData.append('logo', logo);
		}
		formData.append('cityId', cityId);

		await axios.put(`${API_BASE_URL}/api/mosques/${editingMosqueId}`, formData, {
			headers: {
				'Content-Type': 'multipart/form-data',
				Authorization: `Bearer ${token}`,
			},
		});
		fetchMosques();
		resetForm();
	};

	const resetForm = () => {
		setName('');
		setLogo(null);
		setCityId('');
		setIsEditing(false);
		setEditingMosqueId(null);
	};

	const handleBack = () => {
		window.location.href = DASHBOARD_PAGES.DASHBOARD;
	};

	useEffect(() => {
		fetchUserRole();
		fetchCities();
	}, []);

	useEffect(() => {
		if (userRole) {
			fetchMosques();
			if (userRole === 'CITY_ADMIN' && userCityId) {
				setCityId(userCityId.toString());
			}
		}
	}, [userRole, userCityId]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
			<div className="w-full max-w-[1000px] p-8 bg-white rounded-lg shadow-md">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl font-bold text-gray-700">Список Мечетей</h2>
					<button onClick={handleBack} className="text-blue-600">
						Назад
					</button>
				</div>
				<ul className="my-4 max-h-64 overflow-y-auto">
					{mosques.map((mosque) => (
						<li key={mosque.id} className="flex items-center border-b py-2">
							<h3 className="font-semibold flex-1 text-bg w-1/2">{mosque.name}</h3>
							<img src={`${API_BASE_URL}/${mosque.logoUrl}`} alt={`${mosque.name} logo`} className="h-16 w-16 mr-2" />
							<button onClick={() => handleEditMosque(mosque)} className="bg-yellow-500 text-white p-2 mr-2">Редактировать</button>
							<button onClick={() => handleDeleteMosque(mosque.id)} className="text-red-500">Удалить</button>
						</li>
					))}
				</ul>
				<h2 className="mt-4 text-lg font-bold text-bg">{isEditing ? 'Редактировать Мечеть' : 'Добавить Мечеть'}</h2>
				<input
					type="text"
					placeholder="Имя мечети"
					value={name}
					onChange={(e) => setName(e.target.value)}
					className="border p-2 w-full mb-2 text-bg"
				/>
				<input
					type="file"
					accept="image/*"
					onChange={(e) => setLogo(e.target.files ? e.target.files[0] : null)}
					className="border p-2 mb-2 text-bg  w-full"
				/>
				{userRole !== 'CITY_ADMIN' && (
					<select
						value={cityId}
						onChange={(e) => setCityId(e.target.value)}
						className="border p-2 mb-2 text-bg w-full"
					>
						<option value="">Выберите город</option>
						{cities.map((city) => (
							<option key={city.id} value={city.id}>{city.name}</option>
						))}
					</select>
				)}
				<button onClick={isEditing ? handleUpdateMosque : handleCreateMosque} className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out mt-2">
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

export default MosquePage;
