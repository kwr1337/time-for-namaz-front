'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'
import { toast } from 'react-hot-toast';

interface FixedPrayerTime {
	id: number;
	cityId: number;
	fajr: string;
	shuruk: string;
	zuhr: string;
	asr: string;
	maghrib: string;
	isha: string;
	mechet: string | null;
	fajrActive: boolean;    // Флаг активности времени Фаджр
	shurukActive: boolean;  // Флаг активности времени Шурук
	zuhrActive: boolean;    // Флаг активности времени Зухр
	asrActive: boolean;     // Флаг активности времени Аср
	maghribActive: boolean; // Флаг активности времени Магриб
	ishaActive: boolean;    // Флаг активности времени Иша
	mechetActive: boolean;  // Флаг активности времени в мечети
	createdAt: string;
	updatedAt: string;
	cityName: string;
}

interface PrayerResponse {
	id: number;
	cityId: number;
	date: string;
	city?: string;
	fajr: string;
	mechet?: string;
	shuruk: string;
	zuhr: string;
	asr: string;
	maghrib: string;
	isha: string;
}

interface City {
	id: string;
	name: string;
}

const PrayerPage = () => {
	const [prayers, setPrayers] = useState<PrayerResponse[]>([]);
	const [cities, setCities] = useState<City[]>([]);
	const [selectedCityId, setSelectedCityId] = useState('');
	const [role, setRole] = useState('');
	const [userCityId, setUserCityId] = useState<number | null>(null);
	const [selectedPrayer, setSelectedPrayer] = useState('');
	const [shiftMinutes, setShiftMinutes] = useState(0);
	const [customShiftMinutes, setCustomShiftMinutes] = useState('');
	const [isCustomShift, setIsCustomShift] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [fixedPrayerTime, setFixedPrayerTime] = useState<FixedPrayerTime | null>(null);
	const [showFixedTimeForm, setShowFixedTimeForm] = useState(false);
	const [fixedTimePrayers, setFixedTimePrayers] = useState({
		fajr: '',
		shuruk: '',
		zuhr: '',
		asr: '',
		maghrib: '',
		isha: '',
		mechet: '',
		fajrActive: true,
		shurukActive: true,
		zuhrActive: true,
		asrActive: true,
		maghribActive: true,
		ishaActive: true,
		mechetActive: true
	});
	const [showScrollToTop, setShowScrollToTop] = useState(false);

	// Стиль для принудительного использования 24-часового формата
	const timeInputStyle = {
		WebkitAppearance: 'none',
		MozAppearance: 'textfield'
	} as React.CSSProperties;

	const handleFileUpload = async () => {
		if (!file) return;

		const formData = new FormData();
		formData.append('file', file);
		setLoading(true);

		try {
			await axios.post(`${API_BASE_URL}/api/prayers/import`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			fetchPrayers(selectedCityId);
		} catch (error) {
			console.error('Ошибка загрузки файла:', error);
		} finally {
			setLoading(false);
		}
	};

	const fetchRole = async () => {
		const token = localStorage.getItem('token');
		const response = await axios.get(`${API_BASE_URL}/api/admin/me`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		setRole(response.data.role);
		if (response.data.role === 'CITY_ADMIN') {
			setUserCityId(response.data.cityId);
		}
	};

	const fetchCities = async () => {
		const response = await axios.get(`${API_BASE_URL}/api/cities`);
		setCities(response.data);
	};

	const fetchPrayers = async (cityId: string) => {
		const response = await axios.get(`${API_BASE_URL}/api/prayers/all?cityId=${cityId}`);
		const sortedPrayers = response.data.sort((a: PrayerResponse, b: PrayerResponse) => new Date(a.date).getTime() - new Date(b.date).getTime());
		setPrayers(sortedPrayers);
	};

	const fetchFixedPrayerTime = async (cityId: string) => {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/prayers/fixed-time/city/${cityId}`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			if (response.data) {
				setFixedPrayerTime(response.data);
				setFixedTimePrayers({
					fajr: response.data.fajr || '00:00',
					shuruk: response.data.shuruk || '00:00',
					zuhr: response.data.zuhr || '00:00',
					asr: response.data.asr || '00:00',
					maghrib: response.data.maghrib || '00:00',
					isha: response.data.isha || '00:00',
					mechet: response.data.mechet || '00:00',
					fajrActive: response.data.fajrActive !== undefined ? response.data.fajrActive : true,
					shurukActive: response.data.shurukActive !== undefined ? response.data.shurukActive : true,
					zuhrActive: response.data.zuhrActive !== undefined ? response.data.zuhrActive : true,
					asrActive: response.data.asrActive !== undefined ? response.data.asrActive : true,
					maghribActive: response.data.maghribActive !== undefined ? response.data.maghribActive : true,
					ishaActive: response.data.ishaActive !== undefined ? response.data.ishaActive : true,
					mechetActive: response.data.mechetActive !== undefined ? response.data.mechetActive : true
				});
			} else {
				setFixedPrayerTime(null);
				setFixedTimePrayers({
					fajr: '00:00',
					shuruk: '00:00',
					zuhr: '00:00',
					asr: '00:00',
					maghrib: '00:00',
					isha: '00:00',
					mechet: '00:00',
					fajrActive: true,
					shurukActive: true,
					zuhrActive: true,
					asrActive: true,
					maghribActive: true,
					ishaActive: true,
					mechetActive: true
				});
			}
		} catch (error) {
			console.error('Ошибка при получении фиксированного времени:', error);
			setFixedPrayerTime(null);
		}
	};

	const handleSaveFixedTime = async (event: React.FormEvent) => {
		event.preventDefault();
		try {
			setLoading(true);
			const payload = {
				...fixedTimePrayers,
				cityId: parseInt(selectedCityId, 10)
			};

			if (fixedPrayerTime) {
				await axios.put(`${API_BASE_URL}/api/prayers/fixed-time/city/${selectedCityId}`, payload, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});
			} else {
				await axios.post(`${API_BASE_URL}/api/prayers/fixed-time`, payload, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});
			}
			
			fetchFixedPrayerTime(selectedCityId);
			setShowFixedTimeForm(false);
			toast.success('Фиксированное время намаза успешно сохранено');
		} catch (error) {
			console.error('Ошибка при сохранении фиксированного времени:', error);
			toast.error('Ошибка при сохранении фиксированного времени');
		} finally {
			setLoading(false);
		}
	};

	const handleDeleteFixedTime = async () => {
		if (!fixedPrayerTime) return;
		
		if (window.confirm('Вы уверены, что хотите удалить фиксированное время для этого города?')) {
			try {
				setLoading(true);
				await axios.delete(`${API_BASE_URL}/api/prayers/fixed-time/${selectedCityId}`, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});
				
				setFixedPrayerTime(null);
				setFixedTimePrayers({
					fajr: '',
					shuruk: '',
					zuhr: '',
					asr: '',
					maghrib: '',
					isha: '',
					mechet: '',
					fajrActive: true,
					shurukActive: true,
					zuhrActive: true,
					asrActive: true,
					maghribActive: true,
					ishaActive: true,
					mechetActive: true
				});
				
				toast.success('Фиксированное время намаза успешно удалено');
			} catch (error) {
				console.error('Ошибка при удалении фиксированного времени:', error);
				toast.error('Ошибка при удалении фиксированного времени');
			} finally {
				setLoading(false);
			}
		}
	};

	const toggleFixedPrayerTime = async () => {
		if (!fixedPrayerTime) return;
		
		try {
			setLoading(true);
			
			// Определяем текущее состояние (все активно или нет)
			const allActive = Object.keys(fixedPrayerTime)
				.filter(key => key.endsWith('Active'))
				.every(key => fixedPrayerTime[key as keyof typeof fixedPrayerTime]);
			
			// Инвертируем состояние
			const newValue = !allActive;
			
			await axios.put(`${API_BASE_URL}/api/prayers/fixed-time/${selectedCityId}/toggle`, 
				{ isActive: newValue }, 
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				}
			);
			
			// Обновляем данные после переключения
			fetchFixedPrayerTime(selectedCityId);
			
			toast.success(allActive 
				? 'Все фиксированные времена намаза отключены' 
				: 'Все фиксированные времена намаза включены');
		} catch (error) {
			console.error('Ошибка при переключении активности фиксированного времени:', error);
			toast.error('Не удалось изменить активность фиксированного времени');
		} finally {
			setLoading(false);
		}
	};

	const toggleSpecificPrayerTime = async (prayerName: string, active: boolean) => {
		try {
			setLoading(true);
			
			// Создаем обновленный объект с изменениями только для указанного намаза
			const updatedData = {
				...fixedPrayerTime,
				[`${prayerName}Active`]: active
			};
			
			const response = await axios.put(
				`${API_BASE_URL}/api/prayers/fixed-time/city/${selectedCityId}`,
				updatedData,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				}
			);
			
			if (response.status === 200) {
				// Обновляем состояние только после успешного запроса
				setFixedPrayerTime((prev) => prev ? {
					...prev,
					[`${prayerName}Active`]: active
				} : null);
				
				toast.success('Настройки успешно обновлены');
			} else {
				toast.error('Ошибка при обновлении настроек');
			}
		} catch (error) {
			console.error('Ошибка при обновлении намаза:', error);
			toast.error('Ошибка при обновлении настроек');
		} finally {
			setLoading(false);
		}
	};

	const handleCityChange = (cityId: string) => {
		setSelectedCityId(cityId);
		fetchPrayers(cityId);
		fetchFixedPrayerTime(cityId);
	};

	const handlePrayerShift = async () => {
		if (!selectedCityId || !selectedPrayer) {
			toast.error('Пожалуйста, выберите город и намаз');
			return;
		}

		try {
			setLoading(true);
			const finalShiftMinutes = isCustomShift ? parseInt(customShiftMinutes, 10) : shiftMinutes;

			if (isNaN(finalShiftMinutes)) {
				toast.error('Пожалуйста, введите корректное значение для смещения времени');
				return;
			}

			await axios.post(
				`${API_BASE_URL}/api/prayers/shift`,
				{
					cityId: parseInt(selectedCityId, 10),
					prayerName: selectedPrayer === 'mosque' ? 'mechet' : selectedPrayer,
					shiftMinutes: finalShiftMinutes,
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				}
			);

			await fetchPrayers(selectedCityId);
			toast.success('Время намаза успешно изменено');
			
			// Сброс значений после успешного изменения
			setSelectedPrayer('');
			setShiftMinutes(0);
			setCustomShiftMinutes('');
			
		} catch (error: any) {
			console.error('Ошибка при изменении времени:', error);
			toast.error(error.response?.data?.message || 'Ошибка при изменении времени намаза');
		} finally {
			setLoading(false);
		}
	};

	const handleTimeChange = (prayer: string, value: string) => {
		setFixedTimePrayers(prev => ({
			...prev,
			[prayer]: value
		}));
	};

	const handleIsActiveChange = (prayerType: string, checked: boolean) => {
		setFixedTimePrayers(prev => ({
			...prev,
			[`${prayerType}Active`]: checked
		}));
	};

	// Обработчик для кнопки прокрутки вверх
	const scrollToTop = () => {
		window.scrollTo({
			top: 0,
			behavior: 'smooth'
		});
	};

	// Отслеживание прокрутки страницы
	useEffect(() => {
		fetchCities();
		fetchRole();
	}, []);

	useEffect(() => {
		const handleScroll = () => {
			if (window.scrollY > 300) {
				setShowScrollToTop(true);
			} else {
				setShowScrollToTop(false);
			}
		};

		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, []);

	const handleBack = () => {
		window.location.href = DASHBOARD_PAGES.DASHBOARD;
	};

	useEffect(() => {
		if (role === 'CITY_ADMIN' && userCityId) {
			handleCityChange(userCityId.toString());
			setSelectedCityId(userCityId.toString());
		}
	}, [role, userCityId]);

	// Добавим функцию форматирования даты
	const formatDate = (dateString: string): string => {
		try {
			const date = new Date(dateString);
			const day = date.getDate().toString().padStart(2, '0');
			const month = (date.getMonth() + 1).toString().padStart(2, '0');
			const year = date.getFullYear();
			return `${day}.${month}.${year}`;
		} catch (error) {
			console.error('Ошибка форматирования даты:', error, dateString);
			return dateString; // Вернем исходную строку, если не удалось отформатировать
		}
	};

	return (
		<div className="h-screen w-full overflow-y-auto bg-gray-100 p-4 max-h-screen" style={{ scrollbarWidth: 'auto' }}>
			{loading && (
				<div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
					<div className="loader">Загрузка...</div>
				</div>
			)}
			
			<div className="flex flex-col items-center p-4 w-full">
				<div className={`w-full max-w-[1000px] p-8 bg-white rounded-lg shadow-md ${loading ? 'opacity-50' : ''}`}>
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-2xl font-bold text-gray-700">Управление намазами</h2>
					<button onClick={handleBack} className="text-blue-600">Назад</button>
				</div>
				{role !== 'CITY_ADMIN' && (
					<select value={selectedCityId} onChange={(e) => handleCityChange(e.target.value)}
										className="mb-4 border p-2 w-full text-black">
						<option value="">Выберите город</option>
						{cities.map(city => (
							<option key={city.id} value={city.id}>{city.name}</option>
						))}
					</select>
				)}

				{role === 'SUPER_ADMIN' && (
					<div className="mb-4 ">
						<input type="file" accept=".xlsx,.xls" onChange={(e) => setFile(e.target.files![0])}
									 className="border p-2 w-[750px]" />
						<button onClick={handleFileUpload} className="bg-green-500 text-white px-4 py-2 rounded ml-2">Загрузить
							файл
						</button>
					</div>
				)}

					{selectedCityId && (
						<div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
							<div className="flex justify-between items-center mb-2">
								<h3 className="text-lg font-semibold text-gray-700">Фиксированное время намаза для города</h3>
								<div>
									{!showFixedTimeForm ? (
										<button 
											onClick={() => setShowFixedTimeForm(true)} 
											className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
										>
											{fixedPrayerTime ? 'Изменить' : 'Добавить'}
										</button>
									) : (
										<div className="flex space-x-2">
											<button 
												onClick={handleSaveFixedTime} 
												className="bg-green-500 text-white px-3 py-1 rounded text-sm"
											>
												Сохранить
											</button>
											<button 
												onClick={() => setShowFixedTimeForm(false)} 
												className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
											>
												Отмена
											</button>
										</div>
									)}
									{fixedPrayerTime && !showFixedTimeForm && (
										<>
											<button 
												onClick={toggleFixedPrayerTime} 
												className="bg-blue-500 text-white px-3 py-1 rounded text-sm ml-2"
											>
												{Object.keys(fixedPrayerTime)
													.filter(key => key.endsWith('Active'))
													.every(key => fixedPrayerTime[key as keyof typeof fixedPrayerTime]) 
													? "Отключить все" : "Включить все"}
											</button>
										</>
									)}
								</div>
							</div>
							
							{fixedPrayerTime && !showFixedTimeForm && (
								<div className="grid grid-cols-4 gap-4 mb-4">
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Фаджр</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.fajr || '00:00'}</div>
										<div className="flex items-center mt-1">
											<span className={`text-xs px-2 py-0.5 rounded mr-2 ${fixedPrayerTime.fajrActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
												{fixedPrayerTime.fajrActive ? 'Активно' : 'Отключено'}
											</span>
											<button
												onClick={() => toggleSpecificPrayerTime('fajr', !fixedPrayerTime.fajrActive)}
												className={`text-xs px-2 py-0.5 rounded ${fixedPrayerTime.fajrActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
											>
												{fixedPrayerTime.fajrActive ? 'Отключить' : 'Включить'}
											</button>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Шурук</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.shuruk || '00:00'}</div>
										<div className="flex items-center mt-1">
											<span className={`text-xs px-2 py-0.5 rounded mr-2 ${fixedPrayerTime.shurukActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
												{fixedPrayerTime.shurukActive ? 'Активно' : 'Отключено'}
											</span>
											<button
												onClick={() => toggleSpecificPrayerTime('shuruk', !fixedPrayerTime.shurukActive)}
												className={`text-xs px-2 py-0.5 rounded ${fixedPrayerTime.shurukActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
											>
												{fixedPrayerTime.shurukActive ? 'Отключить' : 'Включить'}
											</button>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Зухр</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.zuhr || '00:00'}</div>
										<div className="flex items-center mt-1">
											<span className={`text-xs px-2 py-0.5 rounded mr-2 ${fixedPrayerTime.zuhrActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
												{fixedPrayerTime.zuhrActive ? 'Активно' : 'Отключено'}
											</span>
											<button
												onClick={() => toggleSpecificPrayerTime('zuhr', !fixedPrayerTime.zuhrActive)}
												className={`text-xs px-2 py-0.5 rounded ${fixedPrayerTime.zuhrActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
											>
												{fixedPrayerTime.zuhrActive ? 'Отключить' : 'Включить'}
											</button>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Аср</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.asr || '00:00'}</div>
										<div className="flex items-center mt-1">
											<span className={`text-xs px-2 py-0.5 rounded mr-2 ${fixedPrayerTime.asrActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
												{fixedPrayerTime.asrActive ? 'Активно' : 'Отключено'}
											</span>
											<button
												onClick={() => toggleSpecificPrayerTime('asr', !fixedPrayerTime.asrActive)}
												className={`text-xs px-2 py-0.5 rounded ${fixedPrayerTime.asrActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
											>
												{fixedPrayerTime.asrActive ? 'Отключить' : 'Включить'}
											</button>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Магриб</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.maghrib || '00:00'}</div>
										<div className="flex items-center mt-1">
											<span className={`text-xs px-2 py-0.5 rounded mr-2 ${fixedPrayerTime.maghribActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
												{fixedPrayerTime.maghribActive ? 'Активно' : 'Отключено'}
											</span>
											<button
												onClick={() => toggleSpecificPrayerTime('maghrib', !fixedPrayerTime.maghribActive)}
												className={`text-xs px-2 py-0.5 rounded ${fixedPrayerTime.maghribActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
											>
												{fixedPrayerTime.maghribActive ? 'Отключить' : 'Включить'}
											</button>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Иша</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.isha || '00:00'}</div>
										<div className="flex items-center mt-1">
											<span className={`text-xs px-2 py-0.5 rounded mr-2 ${fixedPrayerTime.ishaActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
												{fixedPrayerTime.ishaActive ? 'Активно' : 'Отключено'}
											</span>
											<button
												onClick={() => toggleSpecificPrayerTime('isha', !fixedPrayerTime.ishaActive)}
												className={`text-xs px-2 py-0.5 rounded ${fixedPrayerTime.ishaActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
											>
												{fixedPrayerTime.ishaActive ? 'Отключить' : 'Включить'}
											</button>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Мечеть</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.mechet || '00:00'}</div>
										<div className="flex items-center mt-1">
											<span className={`text-xs px-2 py-0.5 rounded mr-2 ${fixedPrayerTime.mechetActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
												{fixedPrayerTime.mechetActive ? 'Активно' : 'Отключено'}
											</span>
											<button
												onClick={() => toggleSpecificPrayerTime('mechet', !fixedPrayerTime.mechetActive)}
												className={`text-xs px-2 py-0.5 rounded ${fixedPrayerTime.mechetActive ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
											>
												{fixedPrayerTime.mechetActive ? 'Отключить' : 'Включить'}
											</button>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Последнее обновление</div>
										<div className="font-semibold text-sm text-gray-800">{new Date(fixedPrayerTime.updatedAt).toLocaleString()}</div>
									</div>
								</div>
							)}
							
							{fixedPrayerTime && showFixedTimeForm && (
								<form onSubmit={handleSaveFixedTime} className="bg-white p-6 rounded shadow mb-4">
									<div className="grid grid-cols-4 gap-4 mb-4">
										<div className="p-2 bg-white rounded shadow">
											<div className="text-gray-500 text-sm">Фаджр</div>
											<input
												type="time"
												name="fajr"
												value={fixedTimePrayers.fajr}
												onChange={(e) => handleTimeChange('fajr', e.target.value)}
												className="font-semibold text-gray-800 border rounded px-2 py-1 w-full"
											/>
									
										</div>
										<div className="p-2 bg-white rounded shadow">
											<div className="text-gray-500 text-sm">Шурук</div>
											<input
												type="time"
												name="shuruk"
												value={fixedTimePrayers.shuruk}
												onChange={(e) => handleTimeChange('shuruk', e.target.value)}
												className="font-semibold text-gray-800 border rounded px-2 py-1 w-full"
											/>
											
										</div>
										<div className="p-2 bg-white rounded shadow">
											<div className="text-gray-500 text-sm">Зухр</div>
											<input
												type="time"
												name="zuhr"
												value={fixedTimePrayers.zuhr}
												onChange={(e) => handleTimeChange('zuhr', e.target.value)}
												className="font-semibold text-gray-800 border rounded px-2 py-1 w-full"
											/>
											
										</div>
										<div className="p-2 bg-white rounded shadow">
											<div className="text-gray-500 text-sm">Аср</div>
											<input
												type="time"
												name="asr"
												value={fixedTimePrayers.asr}
												onChange={(e) => handleTimeChange('asr', e.target.value)}
												className="font-semibold text-gray-800 border rounded px-2 py-1 w-full"
											/>
											
										</div>
										<div className="p-2 bg-white rounded shadow">
											<div className="text-gray-500 text-sm">Магриб</div>
											<input
												type="time"
												name="maghrib"
												value={fixedTimePrayers.maghrib}
												onChange={(e) => handleTimeChange('maghrib', e.target.value)}
												className="font-semibold text-gray-800 border rounded px-2 py-1 w-full"
											/>
											
										</div>
										<div className="p-2 bg-white rounded shadow">
											<div className="text-gray-500 text-sm">Иша</div>
											<input
												type="time"
												name="isha"
												value={fixedTimePrayers.isha}
												onChange={(e) => handleTimeChange('isha', e.target.value)}
												className="font-semibold text-gray-800 border rounded px-2 py-1 w-full"
											/>
											
										</div>
										<div className="p-2 bg-white rounded shadow">
											<div className="text-gray-500 text-sm">Мечеть</div>
											<input
												type="time"
												name="mechet"
												value={fixedTimePrayers.mechet}
												onChange={(e) => handleTimeChange('mechet', e.target.value)}
												className="font-semibold text-gray-800 border rounded px-2 py-1 w-full"
											/>
											
										</div>
									</div>
									
								</form>
							)}
						</div>
					)}

					<div className="w-full max-w-full bg-white rounded-lg shadow-md mb-4">
						<div className="overflow-y-auto" style={{ maxHeight: '50vh', overflowX: 'auto' }}>
							<table className="w-full border-collapse">
								<thead className="sticky top-0 bg-gray-200">
								<tr>
									{/* <th className="p-2 text-bg text-center">Город</th> */}
									<th className="p-2 text-black text-center">Дата</th>
									<th className="p-2 text-black text-center">Фаджр</th>
									<th className="p-2 text-black text-center">Мечеть</th>
									<th className="p-2 text-black text-center">Шурук</th>
									<th className="p-2 text-black text-center">Зухр</th>
									<th className="p-2 text-black text-center">Аср</th>
									<th className="p-2 text-black text-center">Магриб</th>
									<th className="p-2 text-black text-center">Иша</th>
						</tr>
						</thead>
						<tbody>
						{prayers.map((prayer: PrayerResponse) => (
							<tr key={prayer.id} className="border-b">
										{/* <td className="p-2 text-bg text-center">{prayer.city || '-'}</td> */}
										<td className="p-2 text-black text-center">{formatDate(prayer.date)}</td>
										<td className="p-2 text-black text-center">{prayer.fajr}</td>
										<td className="p-2 text-black text-center">{prayer.mechet || '-'}</td>
										<td className="p-2 text-black text-center">{prayer.shuruk}</td>
										<td className="p-2 text-black text-center">{prayer.zuhr}</td>
										<td className="p-2 text-black text-center">{prayer.asr}</td>
										<td className="p-2 text-black text-center">{prayer.maghrib}</td>
										<td className="p-2 text-black text-center">{prayer.isha}</td>
							</tr>
						))}
						</tbody>
					</table>
						</div>
				</div>

					<div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
						<h3 className="text-lg font-semibold text-gray-700 mb-2">Смещение времени намаза</h3>
					<select value={selectedPrayer} onChange={(e) => setSelectedPrayer(e.target.value)}
										className="mb-2 border p-2 w-full text-black">
						<option value="">Выберите намаз</option>
						<option value="fajr">Фаджр</option>
						<option value="shuruk">Шурук</option>
						<option value="zuhr">Зухр</option>
						<option value="asr">Аср</option>
						<option value="maghrib">Магриб</option>
						<option value="isha">Иша</option>
							<option value="mosque">Мечеть</option>
					</select>
						
						<div className="flex items-center mb-2">
							<input 
								type="checkbox" 
								id="customShift" 
								checked={isCustomShift} 
								onChange={() => setIsCustomShift(!isCustomShift)} 
								className="mr-2"
							/>
							<label htmlFor="customShift" className="text-black">Произвольное значение</label>
						</div>
						
						{isCustomShift ? (
							<input 
								type="number" 
								value={customShiftMinutes} 
								onChange={(e) => setCustomShiftMinutes(e.target.value)}
								placeholder="Введите количество минут (положительное или отрицательное)" 
								className="mb-2 border p-2 w-full text-black"
							/>
						) : (
					<select value={shiftMinutes} onChange={(e) => setShiftMinutes(Number(e.target.value))}
											className="mb-2 border p-2 w-full text-black">
						<option value="0">0 минут</option>
						<option value="-5">-5 минут</option>
						<option value="-10">-10 минут</option>
						<option value="5">5 минут</option>
						<option value="10">10 минут</option>
					</select>
						)}
						
					<button onClick={handlePrayerShift} className="bg-blue-500 text-white px-4 py-2 rounded">Изменить время
					</button>
				</div>
				</div>

				{/* Кнопка прокрутки вверх */}
				{showScrollToTop && (
					<button
						onClick={scrollToTop}
						className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg z-50 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
						aria-label="Наверх"
					>
						<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
						</svg>
					</button>
				)}
			</div>
		</div>
	);
};

export default PrayerPage;
