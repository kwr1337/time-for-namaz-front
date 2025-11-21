'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'
import { toast } from 'react-hot-toast';

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
	const [loading, setLoading] = useState(false);

	const fetchCities = async () => {
		try {
			setLoading(true);
			const response = await axios.get<City[]>(`${API_BASE_URL}/api/cities`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			// Сортируем города по алфавиту
			const sortedCities = response.data.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
			
			if (userRole === 'CITY_ADMIN' && userCityId) {
				setCities(sortedCities.filter((city) => city.id === userCityId));
			} else {
				setCities(sortedCities);
			}
		} catch (error) {
			console.error('Ошибка при загрузке городов:', error);
			toast.error('Не удалось загрузить список городов');
		} finally {
			setLoading(false);
		}
	};

	const fetchUserRole = async () => {
		try {
			setLoading(true);
			const token = localStorage.getItem('token');
			const response = await axios.get(`${API_BASE_URL}/api/admin/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			setUserRole(response.data.role);
			setUserCityId(response.data.cityId);
		} catch (error) {
			console.error('Ошибка при получении информации о пользователе:', error);
			toast.error('Не удалось получить информацию о пользователе');
		} finally {
			setLoading(false);
		}
	};

	const handleCreateCity = async () => {
		if (!name.trim()) {
			toast.error('Введите название города');
			return;
		}

		try {
			setLoading(true);
			const formData = new FormData();
			
			if (logo) {
				console.log('Загружаемый логотип:', logo.name, logo.type, logo.size);
				formData.append('file', logo);
			} else {
				console.log('Логотип не выбран');
			}
			
			formData.append('name', name);

			// Логируем FormData (совместимая версия)
			console.log('FormData - name:', formData.get('name'));
			console.log('FormData - file:', formData.get('file') ? 'Файл присутствует' : 'Файл отсутствует');

			const response = await axios.post(`${API_BASE_URL}/api/cities`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			
			console.log('Ответ сервера при создании города:', response.data);
			toast.success('Город успешно добавлен');
			fetchCities();
			resetForm();
		} catch (error: any) {
			console.error('Ошибка при создании города:', error);
			if (error.response) {
				console.error('Ответ сервера:', error.response.status, error.response.data);
				toast.error(`Ошибка: ${error.response.data.message || error.response.statusText}`);
			} else if (error.request) {
				toast.error('Сервер не отвечает, проверьте соединение');
			} else {
				toast.error('Ошибка при создании города');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteCity = async (id: number, cityName: string) => {
		if (window.confirm(`Вы действительно хотите удалить город "${cityName}"? Это действие нельзя отменить.`)) {
			try {
				setLoading(true);
				await axios.delete(`${API_BASE_URL}/api/cities/${id}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});
				toast.success(`Город "${cityName}" успешно удален`);
				fetchCities();
			} catch (error: any) {
				console.error('Ошибка при удалении города:', error);
				toast.error(error.response?.data?.message || 'Ошибка при удалении города');
			} finally {
				setLoading(false);
			}
		}
	};

	const handleEditCity = (city: City) => {
		// MOSQUE_ADMIN не может редактировать города
		if (userRole === 'MOSQUE_ADMIN') return;
		if (userRole === 'CITY_ADMIN' && city.id !== userCityId) return;
		setIsEditing(true);
		setEditingCityId(city.id);
		setName(city.name);
		setLogo(null);
	};

	const handleUpdateCity = async () => {
		try {
			setLoading(true);
			const formData = new FormData();
			
			if (logo) {
				console.log('Загружаемый логотип:', logo.name, logo.type, logo.size);
				formData.append('file', logo);
				
				// Логируем FormData (совместимая версия)
				console.log('FormData - file:', formData.get('file') ? 'Файл присутствует' : 'Файл отсутствует');

				// В API /cities/{id}/logo используем PUT для обновления только логотипа
				const response = await axios.post(`${API_BASE_URL}/api/cities/${editingCityId}/logo`, formData, {
					headers: {
						'Content-Type': 'multipart/form-data',
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});
				
				console.log('Ответ сервера при обновлении логотипа:', response.data);
				toast.success('Логотип успешно обновлен');
				fetchCities();
				resetForm();
			} else {
				toast.error('Выберите файл логотипа');
			}
		} catch (error: any) {
			console.error('Ошибка при обновлении логотипа:', error);
			if (error.response) {
				console.error('Ответ сервера:', error.response.status, error.response.data);
				toast.error(`Ошибка: ${error.response.data.message || error.response.statusText}`);
			} else if (error.request) {
				toast.error('Сервер не отвечает, проверьте соединение');
			} else {
				toast.error('Ошибка при обновлении логотипа');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteLogo = async (cityId: number, cityName: string) => {
		if (window.confirm(`Вы действительно хотите удалить логотип города "${cityName}"?`)) {
			try {
				setLoading(true);
				await axios.delete(`${API_BASE_URL}/api/cities/${cityId}/logo`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});
				toast.success('Логотип успешно удален');
				fetchCities();
			} catch (error: any) {
				console.error('Ошибка при удалении логотипа:', error);
				toast.error(error.response?.data?.message || 'Ошибка при удалении логотипа');
			} finally {
				setLoading(false);
			}
		}
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

	const renderLogo = (city: City) => {
		if (!city.logoUrl) {
			return <span className="text-gray-500">Нет логотипа</span>;
		}
		
		const logoUrl = `${API_BASE_URL}${city.logoUrl}`;
		console.log('Отображение логотипа:', city.name, logoUrl);
		
		return (
			<div className="flex items-center">
				<img
					src={logoUrl}
					alt={`Логотип ${city.name}`}
					className="h-12 w-12 object-cover rounded"
					onError={(e) => {
						console.error('Ошибка загрузки изображения:', logoUrl);
						(e.target as HTMLImageElement).src = 'https://via.placeholder.com/48x48?text=Ошибка';
					}}
				/>
				{/* {(userRole === 'SUPER_ADMIN' || (userRole === 'CITY_ADMIN' && city.id === userCityId)) && (
					<button 
						onClick={() => handleDeleteLogo(city.id, city.name)} 
						className="ml-2 text-red-500 hover:text-red-700"
						title="Удалить логотип"
					>
						×
					</button>
				)} */}
			</div>
		);
	};

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 overflow-y-auto max-h-screen">
			{loading && (
				<div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
					<div className="loader">Загрузка...</div>
				</div>
			)}
			
			<div className="w-full max-w-[1000px] p-6 bg-white rounded-lg shadow-md">
				<div className="flex justify-between items-center mb-3">
					<h2 className="text-xl font-bold text-gray-700">Список городов</h2>
					<button onClick={handleBack} className="text-blue-600 hover:underline">Назад</button>
				</div>
				
				<div className="mb-4">
					{/* Таблица с фиксированной высотой и скроллом */}
					<div className="border border-gray-200 rounded-lg overflow-hidden">
						<div className="bg-gray-50 py-2 px-4 border-b border-gray-200">
							<div className="grid grid-cols-12 gap-2">
								<div className="col-span-4 font-semibold text-gray-600">Название</div>
								<div className="col-span-4 font-semibold text-gray-600">Логотип</div>
								<div className="col-span-4 font-semibold text-gray-600 text-center">Действия</div>
							</div>
						</div>
						
						<div className="overflow-y-auto" style={{ maxHeight: '300px', scrollbarWidth: 'thin' }}>
							{cities.length === 0 ? (
								<div className="py-4 px-4 text-center text-gray-500">
									Нет доступных городов
								</div>
							) : (
								cities.map((city) => (
									<div key={city.id} className="py-2 px-4 border-b border-gray-100 hover:bg-gray-50">
										<div className="grid grid-cols-12 gap-2 items-center">
											<div className="col-span-4 text-gray-800">{city.name}</div>
											
											<div className="col-span-4">
												{renderLogo(city)}
											</div>
											
											<div className="col-span-4 flex justify-center space-x-2">
												{userRole === 'SUPER_ADMIN' && (
													<>
														<button 
															onClick={() => handleEditCity(city)} 
															className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded text-sm transition duration-200"
														>
															Редактировать
														</button>
														<button 
															onClick={() => handleDeleteCity(city.id, city.name)} 
															className="bg-red-500 hover:bg-red-600 text-white py-1 px-2 rounded text-sm transition duration-200"
														>
															Удалить
														</button>
													</>
												)}
												{userRole === 'CITY_ADMIN' && city.id === userCityId && (
													<button 
														onClick={() => handleEditCity(city)} 
														className="bg-yellow-500 hover:bg-yellow-600 text-white py-1 px-2 rounded text-sm transition duration-200"
													>
														Редактировать
													</button>
												)}
												{/* MOSQUE_ADMIN не может редактировать города */}
											</div>
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				{(userRole === 'SUPER_ADMIN' || (userRole === 'CITY_ADMIN' && isEditing)) && (
					<div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
						<h2 className="text-lg font-bold text-gray-700 mb-3">
							{isEditing ? 'Редактировать логотип города' : 'Добавить город'}
						</h2>
						<div className="space-y-3">
							<div>
								<label className="block text-gray-700 mb-1 text-sm" htmlFor="city-name">Название города</label>
								<input
									id="city-name"
									type="text"
									value={name}
									onChange={(e) => setName(e.target.value)}
									placeholder="Введите название города"
									className="w-full p-2 border border-gray-300 text-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
									readOnly={isEditing}
								/>
							</div>
							
							<div>
								<label className="block text-gray-700 mb-1 text-sm" htmlFor="city-logo">Логотип города</label>
								<input
									id="city-logo"
									type="file"
									accept="image/*"
									onChange={(e) => setLogo(e.target.files ? e.target.files[0] : null)}
									className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
								/>
								<p className="text-xs text-gray-500 mt-1">
									{isEditing 
										? 'Выберите новый логотип для города' 
										: 'Загрузите логотип города (необязательно)'}
								</p>
							</div>
							
							<div className="flex space-x-2 pt-2">
								<button 
									onClick={isEditing ? handleUpdateCity : handleCreateCity} 
									className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
								>
									{isEditing ? 'Обновить логотип' : 'Добавить город'}
								</button>
								
								{isEditing && (
									<button 
										onClick={resetForm} 
										className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-200"
									>
										Отмена
									</button>
								)}
							</div>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default CityPage;
