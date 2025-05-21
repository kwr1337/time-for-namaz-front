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

interface PrayerChange {
	id: number;
	prayerType: string;
	oldTime: string;
	newTime: string;
	shiftMinutes: number;
	changedAt: string;
	user: {
		id: number;
		email: string;
		role: string;
	};
	prayer: {
		id: number;
		date: string;
		city: {
			name: string;
		};
	};
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
		mechet: '',
		shuruk: '',
		zuhr: '',
		asr: '',
		maghrib: '',
		isha: '',
		fajrActive: true,
		mechetActive: true,
		shurukActive: true,
		zuhrActive: true,
		asrActive: true,
		maghribActive: true,
		ishaActive: true,
	});
	const [showScrollToTop, setShowScrollToTop] = useState(false);
	const [prayerChanges, setPrayerChanges] = useState<PrayerChange[]>([]);

	// Стиль для принудительного использования 24-часового формата
	const timeInputStyle = {
		WebkitAppearance: 'none',
		MozAppearance: 'textfield'
	} as React.CSSProperties;

	// Функция для проверки, является ли дата сегодняшней
	const isToday = (dateString: string) => {
		const today = new Date();
		const date = new Date(dateString);
		return date.getDate() === today.getDate() &&
			date.getMonth() === today.getMonth() &&
			date.getFullYear() === today.getFullYear();
	};

	// Функция для фильтрации дат за последний месяц
	const filterPastDates = (prayers: PrayerResponse[]) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		
		// Создаем дату месяц назад
		const monthAgo = new Date(today);
		monthAgo.setMonth(today.getMonth() - 1);
		monthAgo.setHours(0, 0, 0, 0);
		
		return prayers.filter(prayer => {
			const prayerDate = new Date(prayer.date);
			prayerDate.setHours(0, 0, 0, 0);
			return prayerDate >= monthAgo;
		});
	};

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
		const filteredPrayers = filterPastDates(sortedPrayers);
		setPrayers(filteredPrayers);
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
				fajr: fixedTimePrayers.fajr,
				shuruk: fixedTimePrayers.shuruk,
				zuhr: fixedTimePrayers.zuhr,
				asr: fixedTimePrayers.asr,
				maghrib: fixedTimePrayers.maghrib,
				isha: fixedTimePrayers.isha,
				mechet: fixedTimePrayers.mechet,
			};

			await axios.put(`${API_BASE_URL}/api/prayers/fixed-time/city/${selectedCityId}`, payload, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
			});

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
			await axios.put(
				`${API_BASE_URL}/api/prayers/fixed-time/${selectedCityId}/toggle-prayer`,
				{
					prayerType: prayerName,
					isActive: active
				},
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
						'Content-Type': 'application/json'
					},
				}
			);
			fetchFixedPrayerTime(selectedCityId);
			toast.success('Настройки успешно обновлены');
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
		fetchPrayerChanges(cityId);
	};

	const handlePrayerShift = async () => {
		// Валидация выбора города
		if (!selectedCityId) {
			toast.error('Пожалуйста, выберите город');
			return;
		}

		// Валидация выбора намаза
		if (!selectedPrayer) {
			toast.error('Пожалуйста, выберите намаз');
			return;
		}

		// Валидация смещения времени
		const finalShiftMinutes = isCustomShift ? parseInt(customShiftMinutes, 10) : shiftMinutes;
		if (isNaN(finalShiftMinutes)) {
			toast.error('Пожалуйста, введите корректное значение для смещения времени');
			return;
		}

		// Валидация диапазона смещения
		if (finalShiftMinutes < -60 || finalShiftMinutes > 60) {
			toast.error('Смещение времени должно быть в диапазоне от -60 до +60 минут');
			return;
		}

		try {
			setLoading(true);
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
			await fetchPrayerChanges(selectedCityId);
			toast.success('Время намаза успешно изменено');
			
			// Сброс значений после успешного изменения
			setSelectedPrayer('');
			setShiftMinutes(0);
			setCustomShiftMinutes('');
			setIsCustomShift(false);
			
		} catch (error: any) {
			console.error('Ошибка при изменении времени:', error);
			if (error.response?.status === 404) {
				toast.error('Город или намаз не найдены');
			} else if (error.response?.status === 400) {
				toast.error('Некорректные данные для изменения времени');
			} else if (error.response?.status === 403) {
				toast.error('У вас нет прав для изменения времени намаза');
			} else {
				toast.error('Произошла ошибка при изменении времени намаза');
			}
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

	// Функция для прокрутки к сегодняшней дате
	const scrollToToday = () => {
		const todayRow = document.querySelector('tr[data-today="true"]');
		if (todayRow) {
			todayRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
		}
	};

	useEffect(() => {
		if (prayers.length > 0) {
			scrollToToday();
		}
	}, [prayers]);

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

	// Получение истории изменений времени намазов
	const fetchPrayerChanges = async (cityId: string) => {
		try {
			const token = localStorage.getItem('token');
			const response = await axios.get(`${API_BASE_URL}/api/prayers/city/${cityId}/changes`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			setPrayerChanges(response.data);
		} catch (error) {
			setPrayerChanges([]);
		}
	};

	
	// Функция для поиска сдвига по дате и типу намаза
	const getShiftForPrayer = (date: string, prayerType: string) => {
		const change = prayerChanges.find(
			(c) => c.prayerType === prayerType && c.prayer.date === date
		);
		return change ? change.shiftMinutes : 0;
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
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.fajrActive}
													onChange={() => toggleSpecificPrayerTime('fajr', !fixedPrayerTime.fajrActive)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.fajrActive ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className="ml-2 text-xs">{fixedPrayerTime.fajrActive ? 'Активно' : 'Отключено'}</span>
											</label>
										</div>
									</div>

									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Мечеть</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.mechet || '00:00'}</div>
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.mechetActive}
													onChange={() => toggleSpecificPrayerTime('mechet', !fixedPrayerTime.mechetActive)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.mechetActive ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className="ml-2 text-xs">{fixedPrayerTime.mechetActive ? 'Активно' : 'Отключено'}</span>
											</label>
										</div>
									</div>

									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Шурук</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.shuruk || '00:00'}</div>
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.shurukActive}
													onChange={() => toggleSpecificPrayerTime('shuruk', !fixedPrayerTime.shurukActive)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.shurukActive ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className="ml-2 text-xs">{fixedPrayerTime.shurukActive ? 'Активно' : 'Отключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Зухр</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.zuhr || '00:00'}</div>
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.zuhrActive}
													onChange={() => toggleSpecificPrayerTime('zuhr', !fixedPrayerTime.zuhrActive)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.zuhrActive ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className="ml-2 text-xs">{fixedPrayerTime.zuhrActive ? 'Активно' : 'Отключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Аср</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.asr || '00:00'}</div>
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.asrActive}
													onChange={() => toggleSpecificPrayerTime('asr', !fixedPrayerTime.asrActive)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.asrActive ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className="ml-2 text-xs">{fixedPrayerTime.asrActive ? 'Активно' : 'Отключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Магриб</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.maghrib || '00:00'}</div>
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.maghribActive}
													onChange={() => toggleSpecificPrayerTime('maghrib', !fixedPrayerTime.maghribActive)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.maghribActive ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className="ml-2 text-xs">{fixedPrayerTime.maghribActive ? 'Активно' : 'Отключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Иша</div>
										<div className="font-semibold text-gray-800">{fixedPrayerTime.isha || '00:00'}</div>
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.ishaActive}
													onChange={() => toggleSpecificPrayerTime('isha', !fixedPrayerTime.ishaActive)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.ishaActive ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className="ml-2 text-xs">{fixedPrayerTime.ishaActive ? 'Активно' : 'Отключено'}</span>
											</label>
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
											<div className="text-gray-500 text-sm">Мечеть</div>
											<input
												type="time"
												name="mechet"
												value={fixedTimePrayers.mechet}
												onChange={(e) => handleTimeChange('mechet', e.target.value)}
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
							<tr 
								key={prayer.id} 
								className={`border-b ${isToday(prayer.date) ? 'bg-blue-50' : ''}`}
								data-today={isToday(prayer.date)}
							>
								{/* <td className="p-2 text-bg text-center">{prayer.city || '-'}</td> */}
								<td className="p-2 text-black text-center">{prayer.date}</td>
								<td className={`p-2 text-black text-center ${getShiftForPrayer(prayer.date, 'fajr') !== 0 ? 'bg-green-100' : ''}`}>{prayer.fajr}</td>
								<td className={`p-2 text-black text-center ${getShiftForPrayer(prayer.date, 'mechet') !== 0 ? 'bg-green-100' : ''}`}>{prayer.mechet || '-'}</td>
								<td className={`p-2 text-black text-center ${getShiftForPrayer(prayer.date, 'shuruk') !== 0 ? 'bg-green-100' : ''}`}>{prayer.shuruk}</td>
								<td className={`p-2 text-black text-center ${getShiftForPrayer(prayer.date, 'zuhr') !== 0 ? 'bg-green-100' : ''}`}>{prayer.zuhr}</td>
								<td className={`p-2 text-black text-center ${getShiftForPrayer(prayer.date, 'asr') !== 0 ? 'bg-green-100' : ''}`}>{prayer.asr}</td>
								<td className={`p-2 text-black text-center ${getShiftForPrayer(prayer.date, 'maghrib') !== 0 ? 'bg-green-100' : ''}`}>{prayer.maghrib}</td>
								<td className={`p-2 text-black text-center ${getShiftForPrayer(prayer.date, 'isha') !== 0 ? 'bg-green-100' : ''}`}>{prayer.isha}</td>
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
						<option value="fajr">Фаджр{getShiftForPrayer(new Date().toISOString().slice(0,10), 'fajr') !== 0 ? ` (${getShiftForPrayer(new Date().toISOString().slice(0,10), 'fajr') > 0 ? '+' : ''}${getShiftForPrayer(new Date().toISOString().slice(0,10), 'fajr')} мин)` : ''}</option>
						<option value="mosque">Мечеть{getShiftForPrayer(new Date().toISOString().slice(0,10), 'mechet') !== 0 ? ` (${getShiftForPrayer(new Date().toISOString().slice(0,10), 'mechet') > 0 ? '+' : ''}${getShiftForPrayer(new Date().toISOString().slice(0,10), 'mechet')} мин)` : ''}</option>
						<option value="shuruk">Шурук{getShiftForPrayer(new Date().toISOString().slice(0,10), 'shuruk') !== 0 ? ` (${getShiftForPrayer(new Date().toISOString().slice(0,10), 'shuruk') > 0 ? '+' : ''}${getShiftForPrayer(new Date().toISOString().slice(0,10), 'shuruk')} мин)` : ''}</option>
						<option value="zuhr">Зухр{getShiftForPrayer(new Date().toISOString().slice(0,10), 'zuhr') !== 0 ? ` (${getShiftForPrayer(new Date().toISOString().slice(0,10), 'zuhr') > 0 ? '+' : ''}${getShiftForPrayer(new Date().toISOString().slice(0,10), 'zuhr')} мин)` : ''}</option>
						<option value="asr">Аср{getShiftForPrayer(new Date().toISOString().slice(0,10), 'asr') !== 0 ? ` (${getShiftForPrayer(new Date().toISOString().slice(0,10), 'asr') > 0 ? '+' : ''}${getShiftForPrayer(new Date().toISOString().slice(0,10), 'asr')} мин)` : ''}</option>
						<option value="maghrib">Магриб{getShiftForPrayer(new Date().toISOString().slice(0,10), 'maghrib') !== 0 ? ` (${getShiftForPrayer(new Date().toISOString().slice(0,10), 'maghrib') > 0 ? '+' : ''}${getShiftForPrayer(new Date().toISOString().slice(0,10), 'maghrib')} мин)` : ''}</option>
						<option value="isha">Иша{getShiftForPrayer(new Date().toISOString().slice(0,10), 'isha') !== 0 ? ` (${getShiftForPrayer(new Date().toISOString().slice(0,10), 'isha') > 0 ? '+' : ''}${getShiftForPrayer(new Date().toISOString().slice(0,10), 'isha')} мин)` : ''}</option>
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
						onClick={scrollToToday}
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
