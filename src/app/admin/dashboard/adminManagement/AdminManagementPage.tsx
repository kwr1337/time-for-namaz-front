'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'

interface Admin {
	id: number;
	email: string;
	role: string;
	cityId?: number;
	mosqueId?: number;
}

interface City {
	id: number;
	name: string;
}

interface Mosque {
	id: number;
	name: string;
	cityId: number;
}

const AdminManagementPage = () => {
	const [admins, setAdmins] = useState<Admin[]>([]);
	const [cities, setCities] = useState<City[]>([]);
	const [mosques, setMosques] = useState<Mosque[]>([]);
	const [email, setEmail] = useState<string>('');
	const [password, setPassword] = useState<string>('');
	const [role, setRole] = useState<string>('CITY_ADMIN');
	const [cityId, setCityId] = useState<number | null>(null);
	const [mosqueId, setMosqueId] = useState<number | null>(null);
	const [isEditing, setIsEditing] = useState(false);
	const [editingAdminId, setEditingAdminId] = useState<number | null>(null);
	const [userRole, setUserRole] = useState<string>('');
	const [userCityId, setUserCityId] = useState<number | null>(null);

	const fetchAdmins = async () => {
		const response = await axios.get<Admin[]>(`${API_BASE_URL}/api/admin`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		setAdmins(response.data);
	};

	const fetchRole = async () => {
		const token = localStorage.getItem('token');
		const response = await axios.get(`${API_BASE_URL}/api/admin/me`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setUserRole(response.data.role);
		if (response.data.role === 'CITY_ADMIN') {
			setUserCityId(response.data.cityId);
		}
	};

	const fetchCities = async () => {
		const response = await axios.get<City[]>(`${API_BASE_URL}/api/cities`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		setCities(response.data);
	};

	const fetchMosques = async () => {
		const response = await axios.get<Mosque[]>(`${API_BASE_URL}/api/mosques`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		
		// Фильтрация по роли
		if (userRole === 'CITY_ADMIN' && userCityId) {
			setMosques(response.data.filter(m => m.cityId === userCityId));
		} else {
			setMosques(response.data);
		}
	};

	const handleCreateAdmin = async () => {
		const payload: any = { email, password, role };
		if (role === 'CITY_ADMIN' && cityId) {
			payload.cityId = cityId;
		} else if (role === 'MOSQUE_ADMIN' && mosqueId) {
			payload.mosqueId = mosqueId;
		}
		
		await axios.post(`${API_BASE_URL}/api/admin/register`, payload, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchAdmins();
		resetForm();
	};

	const handleDeleteAdmin = async (id: number) => {
		await axios.delete(`${API_BASE_URL}/api/admin/${id}`, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchAdmins();
	};

	const handleEditAdmin = (admin: Admin) => {
		setIsEditing(true);
		setEditingAdminId(admin.id);
		setEmail(admin.email);
		setRole(admin.role);
		setCityId(admin.cityId || null);
		setMosqueId(admin.mosqueId || null);
		setPassword('');
	};

	const handleUpdateAdmin = async () => {
		const payload: any = { email, password, role };
		if (role === 'CITY_ADMIN' && cityId) {
			payload.cityId = cityId;
		} else if (role === 'MOSQUE_ADMIN' && mosqueId) {
			payload.mosqueId = mosqueId;
		}
		
		await axios.patch(`${API_BASE_URL}/api/admin/${editingAdminId}`, payload, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchAdmins();
		resetForm();
	};

	const resetForm = () => {
		setEmail('');
		setPassword('');
		setRole('CITY_ADMIN');
		setCityId(null);
		setMosqueId(null);
		setIsEditing(false);
		setEditingAdminId(null);
	};

	const handleBack = () => {
		window.location.href = DASHBOARD_PAGES.DASHBOARD;
	};

	useEffect(() => {
		fetchRole();
		fetchAdmins();
		fetchCities();
	}, []);

	useEffect(() => {
		if (userRole) {
			fetchMosques();
		}
	}, [userRole, userCityId]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 overflow-y-auto max-h-screen">
			<div className="w-full max-w-[1000px] p-8 bg-white rounded-lg shadow-md">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl font-bold text-gray-700">Управление администраторами</h2>
					<button onClick={handleBack} className="text-blue-600">Назад</button>
				</div>

				{/* Таблица для отображения администраторов */}
				<div className="max-h-[500px] overflow-y-auto mb-4">
				<table className="min-w-full bg-white">
					<thead>
					<tr>
						<th className="py-2 px-4 border-b text-black">Email</th>
						<th className="py-2 px-4 border-b text-black">Роль</th>
						<th className="py-2 px-4 border-b text-black">Город/Мечеть</th>
						<th className="py-2 px-4 border-b text-black">Действия</th>
					</tr>
					</thead>
					<tbody>
					{admins
						.filter(admin => admin.role !== 'SUPER_ADMIN') // Исключаем SUPER_ADMIN
						.map((admin) => (
							<tr key={admin.id}>
								<td className="py-2 px-4 border-b text-black">{admin.email}</td>
								<td className="py-2 px-4 border-b text-black">{admin.role}</td>
								<td className="py-2 px-4 border-b text-black">
									{admin.role === 'CITY_ADMIN' && admin.cityId 
										? cities.find(city => city.id === admin.cityId)?.name || 'Нет города'
										: admin.role === 'MOSQUE_ADMIN' && admin.mosqueId
										? mosques.find(mosque => mosque.id === admin.mosqueId)?.name || 'Нет мечети'
										: '-'}
								</td>
								<td className="py-2 px-4 border-b text-black">
									<button onClick={() => handleEditAdmin(admin)} className="text-yellow-500 p-2 mr-2">Редактировать</button>
									<button onClick={() => handleDeleteAdmin(admin.id)} className="text-red-500">Удалить</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				</div>

				<h2 className="mt-4 text-lg font-bold text-black">{isEditing ? 'Редактировать администратора' : 'Добавить администратора'}</h2>
				<input
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					placeholder="Email"
					className="border p-2 mb-2 w-full text-black"
				/>
				<input
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					placeholder="Пароль"
					className="border p-2 mb-2 w-full text-black"
				/>
				<select
					value={role}
					onChange={(e) => {
						setRole(e.target.value);
						setCityId(null);
						setMosqueId(null);
					}}
					className="border p-2 mb-2 w-full text-black"
				>
					<option value="SUPER_ADMIN">SUPER_ADMIN</option>
					<option value="CITY_ADMIN">CITY_ADMIN</option>
					<option value="MOSQUE_ADMIN">MOSQUE_ADMIN</option>
				</select>
				{role === 'CITY_ADMIN' && (
					<select
						value={cityId || ''}
						onChange={(e) => setCityId(parseInt(e.target.value))}
						className="border p-2 mb-2 w-full text-black"
					>
						<option value="">Выберите город</option>
						{cities.map((city) => (
							<option key={city.id} value={city.id}>{city.name}</option>
						))}
					</select>
				)}
				{role === 'MOSQUE_ADMIN' && (
					<select
						value={mosqueId || ''}
						onChange={(e) => setMosqueId(parseInt(e.target.value))}
						className="border p-2 mb-2 w-full text-black"
					>
						<option value="">Выберите мечеть</option>
						{mosques.map((mosque) => (
							<option key={mosque.id} value={mosque.id}>{mosque.name}</option>
						))}
					</select>
				)}
				<button onClick={isEditing ? handleUpdateAdmin : handleCreateAdmin} className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out mt-2">
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

export default AdminManagementPage;
