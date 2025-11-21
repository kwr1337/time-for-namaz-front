'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'
import { toast } from 'react-hot-toast';
import { FixedMosquePrayerTime } from '@/types/prayer.types';
import { TimePicker24h } from '@/components/ui/TimePicker24h';

interface PrayerResponse {
	id: number;
	cityId: number;
	mosqueId?: number;
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

interface Mosque {
	id: number;
	name: string;
	cityId: number;
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
		mosque?: {
			name: string;
		};
		city?: {
			name: string;
		};
	};
}

const PrayerPage = () => {
	const [prayers, setPrayers] = useState<PrayerResponse[]>([]);
	const [mosques, setMosques] = useState<Mosque[]>([]);
	const [selectedMosqueId, setSelectedMosqueId] = useState('');
	const [role, setRole] = useState('');
	const [userCityId, setUserCityId] = useState<number | null>(null);
	const [userMosqueId, setUserMosqueId] = useState<number | null>(null);
	const [selectedPrayer, setSelectedPrayer] = useState('');
	const [shiftMinutes, setShiftMinutes] = useState(0);
	const [customShiftMinutes, setCustomShiftMinutes] = useState('');
	const [isCustomShift, setIsCustomShift] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [loading, setLoading] = useState(false);
	const [fixedPrayerTime, setFixedPrayerTime] = useState<FixedMosquePrayerTime | null>(null);
	const [showFixedTimeForm, setShowFixedTimeForm] = useState(false);
	const [showIqamaForm, setShowIqamaForm] = useState(false);
	const [fixedTimePrayers, setFixedTimePrayers] = useState({
		fajr: '',
		mechet: '',
		shuruk: '',
		zuhr: '',
		asr: '',
		maghrib: '',
		isha: '',
		fajrActive: false,
		mechetActive: false,
		shurukActive: false,
		zuhrActive: false,
		asrActive: false,
		maghribActive: false,
		ishaActive: false,
		fajrIqamaEnabled: false,
		fajrIqamaMinutes: 0,
		shurukIqamaEnabled: false,
		shurukIqamaMinutes: 0,
		zuhrIqamaEnabled: false,
		zuhrIqamaMinutes: 0,
		asrIqamaEnabled: false,
		asrIqamaMinutes: 0,
		maghribIqamaEnabled: false,
		maghribIqamaMinutes: 0,
		ishaIqamaEnabled: false,
		ishaIqamaMinutes: 0,
		mechetIqamaEnabled: false,
		mechetIqamaMinutes: 0,
	});
	const [showScrollToTop, setShowScrollToTop] = useState(false);
	const [prayerChanges, setPrayerChanges] = useState<PrayerChange[]>([]);

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
			if (selectedMosqueId) {
				fetchPrayers(selectedMosqueId);
			}
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
		if (response.data.role === 'MOSQUE_ADMIN') {
			setUserMosqueId(response.data.mosqueId);
		}
	};

	const fetchMosques = async () => {
		try {
			const token = localStorage.getItem('token');
			const response = await axios.get<Mosque[]>(`${API_BASE_URL}/api/mosques`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			
			// Фильтрация по роли
			if (role === 'CITY_ADMIN' && userCityId) {
				setMosques(response.data.filter(m => m.cityId === userCityId));
			} else if (role === 'MOSQUE_ADMIN' && userMosqueId) {
				setMosques(response.data.filter(m => m.id === userMosqueId));
			} else {
				setMosques(response.data);
			}
		} catch (error) {
			console.error('Ошибка при получении мечетей:', error);
		}
	};

	const fetchPrayers = async (mosqueId: string) => {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/prayers/all?mosqueId=${mosqueId}`);
			const sortedPrayers = response.data.sort((a: PrayerResponse, b: PrayerResponse) => new Date(a.date).getTime() - new Date(b.date).getTime());
			const filteredPrayers = filterPastDates(sortedPrayers);
			setPrayers(filteredPrayers);
		} catch (error) {
			console.error('Ошибка при получении молитв:', error);
			setPrayers([]);
		}
	};

	const fetchFixedPrayerTime = async (mosqueId: string) => {
		try {
			// Для админ-панели используем авторизацию
			const token = localStorage.getItem('token');
			const response = await axios.get(`${API_BASE_URL}/api/prayers/fixed-time/mosque/${mosqueId}`, {
				headers: token ? {
					Authorization: `Bearer ${token}`
				} : {}
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
					fajrActive: response.data.fajrActive !== undefined ? response.data.fajrActive : false,
					shurukActive: response.data.shurukActive !== undefined ? response.data.shurukActive : false,
					zuhrActive: response.data.zuhrActive !== undefined ? response.data.zuhrActive : false,
					asrActive: response.data.asrActive !== undefined ? response.data.asrActive : false,
					maghribActive: response.data.maghribActive !== undefined ? response.data.maghribActive : false,
					ishaActive: response.data.ishaActive !== undefined ? response.data.ishaActive : false,
					mechetActive: response.data.mechetActive !== undefined ? response.data.mechetActive : false,
					fajrIqamaEnabled: response.data.fajrIqamaEnabled !== undefined ? response.data.fajrIqamaEnabled : false,
					fajrIqamaMinutes: response.data.fajrIqamaMinutes !== undefined ? response.data.fajrIqamaMinutes : 0,
					shurukIqamaEnabled: response.data.shurukIqamaEnabled !== undefined ? response.data.shurukIqamaEnabled : false,
					shurukIqamaMinutes: response.data.shurukIqamaMinutes !== undefined ? response.data.shurukIqamaMinutes : 0,
					zuhrIqamaEnabled: response.data.zuhrIqamaEnabled !== undefined ? response.data.zuhrIqamaEnabled : false,
					zuhrIqamaMinutes: response.data.zuhrIqamaMinutes !== undefined ? response.data.zuhrIqamaMinutes : 0,
					asrIqamaEnabled: response.data.asrIqamaEnabled !== undefined ? response.data.asrIqamaEnabled : false,
					asrIqamaMinutes: response.data.asrIqamaMinutes !== undefined ? response.data.asrIqamaMinutes : 0,
					maghribIqamaEnabled: response.data.maghribIqamaEnabled !== undefined ? response.data.maghribIqamaEnabled : false,
					maghribIqamaMinutes: response.data.maghribIqamaMinutes !== undefined ? response.data.maghribIqamaMinutes : 0,
					ishaIqamaEnabled: response.data.ishaIqamaEnabled !== undefined ? response.data.ishaIqamaEnabled : false,
					ishaIqamaMinutes: response.data.ishaIqamaMinutes !== undefined ? response.data.ishaIqamaMinutes : 0,
					mechetIqamaEnabled: response.data.mechetIqamaEnabled !== undefined ? response.data.mechetIqamaEnabled : false,
					mechetIqamaMinutes: response.data.mechetIqamaMinutes !== undefined ? response.data.mechetIqamaMinutes : 0,
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
					fajrActive: false,
					shurukActive: false,
					zuhrActive: false,
					asrActive: false,
					maghribActive: false,
					ishaActive: false,
					mechetActive: false,
					fajrIqamaEnabled: false,
					fajrIqamaMinutes: 0,
					shurukIqamaEnabled: false,
					shurukIqamaMinutes: 0,
					zuhrIqamaEnabled: false,
					zuhrIqamaMinutes: 0,
					asrIqamaEnabled: false,
					asrIqamaMinutes: 0,
					maghribIqamaEnabled: false,
					maghribIqamaMinutes: 0,
					ishaIqamaEnabled: false,
					ishaIqamaMinutes: 0,
					mechetIqamaEnabled: false,
					mechetIqamaMinutes: 0,
				});
			}
		} catch (error: any) {
			console.error('Ошибка при получении фиксированного времени:', error);
			console.error('Статус ошибки:', error.response?.status);
			console.error('Данные ошибки:', error.response?.data);
			if (error.response?.status === 404) {
				// Мечеть не найдена или фиксированное время не создано - это нормально
				setFixedPrayerTime(null);
				setFixedTimePrayers({
					fajr: '00:00',
					shuruk: '00:00',
					zuhr: '00:00',
					asr: '00:00',
					maghrib: '00:00',
					isha: '00:00',
					mechet: '00:00',
					fajrActive: false,
					shurukActive: false,
					zuhrActive: false,
					asrActive: false,
					maghribActive: false,
					ishaActive: false,
					mechetActive: false,
					fajrIqamaEnabled: false,
					fajrIqamaMinutes: 0,
					shurukIqamaEnabled: false,
					shurukIqamaMinutes: 0,
					zuhrIqamaEnabled: false,
					zuhrIqamaMinutes: 0,
					asrIqamaEnabled: false,
					asrIqamaMinutes: 0,
					maghribIqamaEnabled: false,
					maghribIqamaMinutes: 0,
					ishaIqamaEnabled: false,
					ishaIqamaMinutes: 0,
					mechetIqamaEnabled: false,
					mechetIqamaMinutes: 0,
				});
			} else if (error.response?.status === 500) {
				// Ошибка сервера - возможно, бэкенд еще не поддерживает новые поля икамата
				console.error('Ошибка 500: Возможно, бэкенд еще не поддерживает поля икамата');
				console.error('Детали ошибки:', error.response?.data);
				setFixedPrayerTime(null);
				setFixedTimePrayers({
					fajr: '00:00',
					shuruk: '00:00',
					zuhr: '00:00',
					asr: '00:00',
					maghrib: '00:00',
					isha: '00:00',
					mechet: '00:00',
					fajrActive: false,
					shurukActive: false,
					zuhrActive: false,
					asrActive: false,
					maghribActive: false,
					ishaActive: false,
					mechetActive: false,
					fajrIqamaEnabled: false,
					fajrIqamaMinutes: 0,
					shurukIqamaEnabled: false,
					shurukIqamaMinutes: 0,
					zuhrIqamaEnabled: false,
					zuhrIqamaMinutes: 0,
					asrIqamaEnabled: false,
					asrIqamaMinutes: 0,
					maghribIqamaEnabled: false,
					maghribIqamaMinutes: 0,
					ishaIqamaEnabled: false,
					ishaIqamaMinutes: 0,
					mechetIqamaEnabled: false,
					mechetIqamaMinutes: 0,
				});
				toast.error('Ошибка сервера при загрузке фиксированного времени. Возможно, бэкенд еще не поддерживает поля икамата.');
			} else {
				setFixedPrayerTime(null);
			}
		}
	};

	const handleSaveFixedTime = async () => {
		try {
			setLoading(true);
			const payload: any = {};
			
			// Добавляем только те поля, которые имеют значение
			if (fixedTimePrayers.fajr) payload.fajr = fixedTimePrayers.fajr;
			if (fixedTimePrayers.shuruk) payload.shuruk = fixedTimePrayers.shuruk;
			if (fixedTimePrayers.zuhr) payload.zuhr = fixedTimePrayers.zuhr;
			if (fixedTimePrayers.asr) payload.asr = fixedTimePrayers.asr;
			if (fixedTimePrayers.maghrib) payload.maghrib = fixedTimePrayers.maghrib;
			if (fixedTimePrayers.isha) payload.isha = fixedTimePrayers.isha;
			if (fixedTimePrayers.mechet) payload.mechet = fixedTimePrayers.mechet;

			// Добавляем настройки активности фиксированного времени
			payload.fajrActive = fixedTimePrayers.fajrActive;
			payload.shurukActive = fixedTimePrayers.shurukActive;
			payload.zuhrActive = fixedTimePrayers.zuhrActive;
			payload.asrActive = fixedTimePrayers.asrActive;
			payload.maghribActive = fixedTimePrayers.maghribActive;
			payload.ishaActive = fixedTimePrayers.ishaActive;
			payload.mechetActive = fixedTimePrayers.mechetActive;

			await axios.put(`${API_BASE_URL}/api/prayers/fixed-time/mosque/${selectedMosqueId}`, payload, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
			});

			fetchFixedPrayerTime(selectedMosqueId);
			setShowFixedTimeForm(false);
			toast.success('Фиксированное время намаза успешно сохранено');
		} catch (error: any) {
			console.error('Ошибка при сохранении фиксированного времени:', error);
			if (error.response?.status === 400) {
				const errorMessage = error.response?.data?.message || 'Некорректные данные';
				toast.error(errorMessage);
			} else if (error.response?.status === 401) {
				toast.error('Пользователь не авторизован');
			} else if (error.response?.status === 403) {
				const errorMessage = error.response?.data?.message || 'У вас нет прав для управления фиксированным временем этой мечети';
				toast.error(errorMessage);
			} else if (error.response?.status === 404) {
				const errorMessage = error.response?.data?.message || 'Мечеть не найдена';
				toast.error(errorMessage);
			} else {
				toast.error('Ошибка при сохранении фиксированного времени');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleSaveIqama = async () => {
		try {
			setLoading(true);
			const payload: any = {};
			
			// Используем текущие значения enabled из fixedPrayerTime (устанавливаются через переключатели)
			// и обновленные значения minutes из формы
			if (fixedPrayerTime) {
				payload.fajrIqamaEnabled = fixedPrayerTime.fajrIqamaEnabled;
				payload.fajrIqamaMinutes = fixedTimePrayers.fajrIqamaMinutes;
				payload.shurukIqamaEnabled = fixedPrayerTime.shurukIqamaEnabled;
				payload.shurukIqamaMinutes = fixedTimePrayers.shurukIqamaMinutes;
				payload.zuhrIqamaEnabled = fixedPrayerTime.zuhrIqamaEnabled;
				payload.zuhrIqamaMinutes = fixedTimePrayers.zuhrIqamaMinutes;
				payload.asrIqamaEnabled = fixedPrayerTime.asrIqamaEnabled;
				payload.asrIqamaMinutes = fixedTimePrayers.asrIqamaMinutes;
				payload.maghribIqamaEnabled = fixedPrayerTime.maghribIqamaEnabled;
				payload.maghribIqamaMinutes = fixedTimePrayers.maghribIqamaMinutes;
				payload.ishaIqamaEnabled = fixedPrayerTime.ishaIqamaEnabled;
				payload.ishaIqamaMinutes = fixedTimePrayers.ishaIqamaMinutes;
				payload.mechetIqamaEnabled = fixedPrayerTime.mechetIqamaEnabled;
				payload.mechetIqamaMinutes = fixedTimePrayers.mechetIqamaMinutes;
			}

			await axios.put(`${API_BASE_URL}/api/prayers/fixed-time/mosque/${selectedMosqueId}`, payload, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
			});

			fetchFixedPrayerTime(selectedMosqueId);
			setShowIqamaForm(false);
			toast.success('Настройки икамата успешно сохранены');
		} catch (error: any) {
			console.error('Ошибка при сохранении настроек икамата:', error);
			if (error.response?.status === 400) {
				const errorMessage = error.response?.data?.message || 'Некорректные данные';
				toast.error(errorMessage);
			} else if (error.response?.status === 401) {
				toast.error('Пользователь не авторизован');
			} else if (error.response?.status === 403) {
				const errorMessage = error.response?.data?.message || 'У вас нет прав для управления настройками икамата этой мечети';
				toast.error(errorMessage);
			} else if (error.response?.status === 404) {
				const errorMessage = error.response?.data?.message || 'Мечеть не найдена';
				toast.error(errorMessage);
			} else {
				toast.error('Ошибка при сохранении настроек икамата');
			}
		} finally {
			setLoading(false);
		}
	};

	const toggleSpecificPrayerTime = async (prayerName: string, active: boolean) => {
		try {
			setLoading(true);
			await axios.put(
				`${API_BASE_URL}/api/prayers/fixed-time/mosque/${selectedMosqueId}/toggle-prayer`,
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
			fetchFixedPrayerTime(selectedMosqueId);
			toast.success('Настройки успешно обновлены');
		} catch (error: any) {
			console.error('Ошибка при обновлении намаза:', error);
			if (error.response?.status === 400) {
				const errorMessage = error.response?.data?.message || 'Некорректные данные';
				toast.error(errorMessage);
			} else if (error.response?.status === 401) {
				toast.error('Пользователь не авторизован');
			} else if (error.response?.status === 403) {
				const errorMessage = error.response?.data?.message || 'У вас нет прав для управления фиксированным временем этой мечети';
				toast.error(errorMessage);
			} else if (error.response?.status === 404) {
				const errorMessage = error.response?.data?.message || 'Мечеть не найдена';
				toast.error(errorMessage);
			} else {
				toast.error('Ошибка при обновлении настроек');
			}
		} finally {
			setLoading(false);
		}
	};

	const toggleIqama = async (prayerName: string, enabled: boolean) => {
		try {
			setLoading(true);
			const payload: any = {};
			payload[`${prayerName}IqamaEnabled`] = enabled;
			if (!enabled) {
				payload[`${prayerName}IqamaMinutes`] = 0;
			}

			await axios.put(`${API_BASE_URL}/api/prayers/fixed-time/mosque/${selectedMosqueId}`, payload, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
					'Content-Type': 'application/json'
				},
			});

			fetchFixedPrayerTime(selectedMosqueId);
			toast.success('Настройки икамата успешно обновлены');
		} catch (error: any) {
			console.error('Ошибка при обновлении икамата:', error);
			if (error.response?.status === 400) {
				const errorMessage = error.response?.data?.message || 'Некорректные данные';
				toast.error(errorMessage);
			} else if (error.response?.status === 401) {
				toast.error('Пользователь не авторизован');
			} else if (error.response?.status === 403) {
				const errorMessage = error.response?.data?.message || 'У вас нет прав для управления настройками икамата этой мечети';
				toast.error(errorMessage);
			} else if (error.response?.status === 404) {
				const errorMessage = error.response?.data?.message || 'Мечеть не найдена';
				toast.error(errorMessage);
			} else {
				toast.error('Ошибка при обновлении настроек икамата');
			}
		} finally {
			setLoading(false);
		}
	};

	const handleMosqueChange = (mosqueId: string) => {
		setSelectedMosqueId(mosqueId);
		if (mosqueId) {
			fetchPrayers(mosqueId);
			fetchFixedPrayerTime(mosqueId);
			fetchPrayerChanges(mosqueId);
		} else {
			setPrayers([]);
			setFixedPrayerTime(null);
			setPrayerChanges([]);
		}
	};

	const handlePrayerShift = async () => {
		// Валидация выбора мечети
		if (!selectedMosqueId) {
			toast.error('Пожалуйста, выберите мечеть');
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
			
			const payload = {
				mosqueId: parseInt(selectedMosqueId, 10),
				prayerName: selectedPrayer === 'mosque' ? 'mechet' : selectedPrayer,
				shiftMinutes: finalShiftMinutes,
			};
			
			// Логирование для отладки
			console.log('Отправка запроса на сдвиг времени:', payload);
			
			const response = await axios.post(
				`${API_BASE_URL}/api/prayers/shift`,
				payload,
				{
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
						'Content-Type': 'application/json',
					},
				}
			);
			
			console.log('Ответ сервера:', response.data);

			await fetchPrayers(selectedMosqueId);
			await fetchPrayerChanges(selectedMosqueId);
			toast.success('Время намаза успешно изменено');
			
			// Сброс значений после успешного изменения
			setSelectedPrayer('');
			setShiftMinutes(0);
			setCustomShiftMinutes('');
			setIsCustomShift(false);
			
		} catch (error: any) {
			console.error('Ошибка при изменении времени:', error);
			console.error('Статус ошибки:', error.response?.status);
			console.error('Данные ошибки:', error.response?.data);
			console.error('Заголовки запроса:', error.config?.headers);
			console.error('Тело запроса:', error.config?.data);
			
			if (error.response?.status === 404) {
				const errorMessage = error.response?.data?.message || 'Мечеть или намаз не найдены';
				toast.error(errorMessage);
			} else if (error.response?.status === 400) {
				const errorMessage = error.response?.data?.message || 'Некорректные данные для изменения времени';
				toast.error(errorMessage);
			} else if (error.response?.status === 403) {
				const errorMessage = error.response?.data?.message || 'У вас нет прав для изменения времени намаза';
				toast.error(errorMessage);
			} else if (error.response?.status === 500) {
				const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Ошибка сервера';
				toast.error(`Ошибка сервера: ${errorMessage}`);
			} else if (error.response?.status === 401) {
				const errorMessage = error.response?.data?.message || 'Пользователь не авторизован';
				toast.error(errorMessage);
			} else {
				toast.error('Произошла ошибка при изменении времени намаза');
			}
		} finally {
			setLoading(false);
		}
	};

	// Вспомогательная функция для форматирования времени в 24-часовой формат
	const formatTimeTo24Hour = (value: string): string => {
		if (!value) return value;
		
		// Если время пришло в формате 12 часов с AM/PM, конвертируем в 24 часа
		const timeMatch12 = value.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
		if (timeMatch12) {
			let hours = parseInt(timeMatch12[1], 10);
			const minutes = timeMatch12[2];
			const ampm = timeMatch12[3].toUpperCase();
			
			if (ampm === 'PM' && hours !== 12) {
				hours += 12;
			} else if (ampm === 'AM' && hours === 12) {
				hours = 0;
			}
			
			return `${hours.toString().padStart(2, '0')}:${minutes}`;
		}
		
		// Если время уже в формате HH:mm, проверяем корректность
		const timeMatch24 = value.match(/(\d{1,2}):(\d{2})/);
		if (timeMatch24) {
			let hours = parseInt(timeMatch24[1], 10);
			const minutes = timeMatch24[2];
			
			// Ограничиваем часы до 23
			if (hours >= 24) {
				hours = 23;
			}
			
			return `${hours.toString().padStart(2, '0')}:${minutes}`;
		}
		
		return value;
	};

	const handleTimeChange = (prayer: string, value: string) => {
		const formattedValue = formatTimeTo24Hour(value);
		
		setFixedTimePrayers(prev => ({
			...prev,
			[prayer]: formattedValue
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
		fetchRole();
	}, []);

	useEffect(() => {
		if (role) {
			fetchMosques();
		}
	}, [role, userCityId, userMosqueId]);

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

	// Автоматическая установка мечети для MOSQUE_ADMIN
	useEffect(() => {
		if (role === 'MOSQUE_ADMIN' && userMosqueId) {
			setSelectedMosqueId(userMosqueId.toString());
			handleMosqueChange(userMosqueId.toString());
		}
	}, [role, userMosqueId]);

	// Принудительное форматирование времени в 24-часовой формат
	useEffect(() => {
		// Находим все input type="time" и принудительно устанавливаем формат 24 часов
		const timeInputs = document.querySelectorAll('input[type="time"]');
		timeInputs.forEach((input: any) => {
			// Устанавливаем атрибут lang для принудительного использования 24-часового формата
			if (!input.hasAttribute('lang')) {
				input.setAttribute('lang', 'en');
			}
			
			// Если значение есть, убеждаемся, что оно в формате 24 часов
			if (input.value) {
				const timeValue = input.value;
				// Проверяем формат и конвертируем при необходимости
				const timeMatch = timeValue.match(/(\d{1,2}):(\d{2})/);
				if (timeMatch) {
					let hours = parseInt(timeMatch[1], 10);
					const minutes = timeMatch[2];
					
					// Если часы больше 12, значит уже 24-часовой формат
					// Если нет, оставляем как есть (input type="time" должен автоматически использовать 24-часовой формат)
					if (hours < 24) {
						input.value = `${hours.toString().padStart(2, '0')}:${minutes}`;
					}
				}
			}
		});
	}, [fixedTimePrayers, showFixedTimeForm]);

	// Получение истории изменений времени намазов
	const fetchPrayerChanges = async (mosqueId: string) => {
		try {
			const token = localStorage.getItem('token');
			const response = await axios.get(`${API_BASE_URL}/api/prayers/mosque/${mosqueId}/changes`, {
				headers: {
					Authorization: `Bearer ${token}`
				}
			});
			setPrayerChanges(response.data);
		} catch (error) {
			console.error('Ошибка при получении истории изменений:', error);
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

	const currentMosque = mosques.find(m => m.id.toString() === selectedMosqueId);

	return (
		<div className="h-screen w-full overflow-y-auto bg-gray-100 p-4 max-h-screen" style={{ scrollbarWidth: 'auto' }} lang="en">
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

				{/* Выбор мечети */}
				{role === 'MOSQUE_ADMIN' && currentMosque ? (
					<div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
						<p className="text-gray-700 font-semibold">Мечеть: {currentMosque.name}</p>
					</div>
				) : role !== 'MOSQUE_ADMIN' && (
					<select 
						value={selectedMosqueId} 
						onChange={(e) => handleMosqueChange(e.target.value)}
						className="mb-4 border p-2 w-full text-black"
					>
						<option value="">Выберите мечеть</option>
						{mosques.map(mosque => (
							<option key={mosque.id} value={mosque.id}>{mosque.name}</option>
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

					{selectedMosqueId && (
						<div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
							<div className="flex justify-between items-center mb-2">
								<h3 className="text-lg font-semibold text-gray-700">Фиксированное время намаза</h3>
								{showFixedTimeForm ? (
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
								) : (
									<button 
										onClick={() => setShowFixedTimeForm(true)} 
										className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
									>
										{fixedPrayerTime ? 'Изменить' : 'Добавить'}
									</button>
								)}
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
												<span className={`ml-2 text-xs ${fixedPrayerTime.fajrActive ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.fajrActive ? 'Включено' : 'Выключено'}</span>
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
												<span className={`ml-2 text-xs ${fixedPrayerTime.mechetActive ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.mechetActive ? 'Включено' : 'Выключено'}</span>
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
												<span className={`ml-2 text-xs ${fixedPrayerTime.shurukActive ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.shurukActive ? 'Включено' : 'Выключено'}</span>
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
												<span className={`ml-2 text-xs ${fixedPrayerTime.zuhrActive ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.zuhrActive ? 'Включено' : 'Выключено'}</span>
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
												<span className={`ml-2 text-xs ${fixedPrayerTime.asrActive ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.asrActive ? 'Включено' : 'Выключено'}</span>
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
												<span className={`ml-2 text-xs ${fixedPrayerTime.maghribActive ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.maghribActive ? 'Включено' : 'Выключено'}</span>
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
												<span className={`ml-2 text-xs ${fixedPrayerTime.ishaActive ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.ishaActive ? 'Включено' : 'Выключено'}</span>
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
								<div className="grid grid-cols-4 gap-4 mb-4">
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm mb-2">Фаджр</div>
										<TimePicker24h
											value={fixedTimePrayers.fajr || '00:00'}
											onChange={(value) => handleTimeChange('fajr', value)}
											name="fajr"
											className="w-full"
										/>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm mb-2">Мечеть</div>
										<TimePicker24h
											value={fixedTimePrayers.mechet || '00:00'}
											onChange={(value) => handleTimeChange('mechet', value)}
											name="mechet"
											className="w-full"
										/>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm mb-2">Шурук</div>
										<TimePicker24h
											value={fixedTimePrayers.shuruk || '00:00'}
											onChange={(value) => handleTimeChange('shuruk', value)}
											name="shuruk"
											className="w-full"
										/>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm mb-2">Зухр</div>
										<TimePicker24h
											value={fixedTimePrayers.zuhr || '00:00'}
											onChange={(value) => handleTimeChange('zuhr', value)}
											name="zuhr"
											className="w-full"
										/>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm mb-2">Аср</div>
										<TimePicker24h
											value={fixedTimePrayers.asr || '00:00'}
											onChange={(value) => handleTimeChange('asr', value)}
											name="asr"
											className="w-full"
										/>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm mb-2">Магриб</div>
										<TimePicker24h
											value={fixedTimePrayers.maghrib || '00:00'}
											onChange={(value) => handleTimeChange('maghrib', value)}
											name="maghrib"
											className="w-full"
										/>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm mb-2">Иша</div>
										<TimePicker24h
											value={fixedTimePrayers.isha || '00:00'}
											onChange={(value) => handleTimeChange('isha', value)}
											name="isha"
											className="w-full"
										/>
									</div>
								</div>
							)}
						</div>
					)}

					{/* Отдельная секция для настройки икамата */}
					{selectedMosqueId && (
						<div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
							<div className="flex justify-between items-center mb-2">
								<h3 className="text-lg font-semibold text-gray-700">Настройки икамата</h3>
								{showIqamaForm ? (
									<div className="flex space-x-2">
										<button 
											onClick={handleSaveIqama} 
											className="bg-green-500 text-white px-3 py-1 rounded text-sm"
										>
											Сохранить
										</button>
										<button 
											onClick={() => setShowIqamaForm(false)} 
											className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
										>
											Отмена
										</button>
									</div>
								) : (
									<button 
										onClick={() => setShowIqamaForm(true)} 
										className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
									>
										{fixedPrayerTime ? 'Изменить' : 'Настроить'}
									</button>
								)}
							</div>
							
							{fixedPrayerTime && !showIqamaForm && (
								<div className="grid grid-cols-4 gap-4 mb-4">
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Фаджр</div>
										{fixedPrayerTime.fajrIqamaEnabled ? (
											<div className="font-semibold text-gray-800">{fixedPrayerTime.fajrIqamaMinutes} мин</div>
										) : (
											<div className="font-semibold text-gray-400">Выключено</div>
										)}
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.fajrIqamaEnabled}
													onChange={() => toggleIqama('fajr', !fixedPrayerTime.fajrIqamaEnabled)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.fajrIqamaEnabled ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className={`ml-2 text-xs ${fixedPrayerTime.fajrIqamaEnabled ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.fajrIqamaEnabled ? 'Включено' : 'Выключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Мечеть</div>
										{fixedPrayerTime.mechetIqamaEnabled ? (
											<div className="font-semibold text-gray-800">{fixedPrayerTime.mechetIqamaMinutes} мин</div>
										) : (
											<div className="font-semibold text-gray-400">Выключено</div>
										)}
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.mechetIqamaEnabled}
													onChange={() => toggleIqama('mechet', !fixedPrayerTime.mechetIqamaEnabled)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.mechetIqamaEnabled ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className={`ml-2 text-xs ${fixedPrayerTime.mechetIqamaEnabled ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.mechetIqamaEnabled ? 'Включено' : 'Выключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Шурук</div>
										{fixedPrayerTime.shurukIqamaEnabled ? (
											<div className="font-semibold text-gray-800">{fixedPrayerTime.shurukIqamaMinutes} мин</div>
										) : (
											<div className="font-semibold text-gray-400">Выключено</div>
										)}
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.shurukIqamaEnabled}
													onChange={() => toggleIqama('shuruk', !fixedPrayerTime.shurukIqamaEnabled)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.shurukIqamaEnabled ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className={`ml-2 text-xs ${fixedPrayerTime.shurukIqamaEnabled ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.shurukIqamaEnabled ? 'Включено' : 'Выключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Зухр</div>
										{fixedPrayerTime.zuhrIqamaEnabled ? (
											<div className="font-semibold text-gray-800">{fixedPrayerTime.zuhrIqamaMinutes} мин</div>
										) : (
											<div className="font-semibold text-gray-400">Выключено</div>
										)}
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.zuhrIqamaEnabled}
													onChange={() => toggleIqama('zuhr', !fixedPrayerTime.zuhrIqamaEnabled)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.zuhrIqamaEnabled ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className={`ml-2 text-xs ${fixedPrayerTime.zuhrIqamaEnabled ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.zuhrIqamaEnabled ? 'Включено' : 'Выключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Аср</div>
										{fixedPrayerTime.asrIqamaEnabled ? (
											<div className="font-semibold text-gray-800">{fixedPrayerTime.asrIqamaMinutes} мин</div>
										) : (
											<div className="font-semibold text-gray-400">Выключено</div>
										)}
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.asrIqamaEnabled}
													onChange={() => toggleIqama('asr', !fixedPrayerTime.asrIqamaEnabled)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.asrIqamaEnabled ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className={`ml-2 text-xs ${fixedPrayerTime.asrIqamaEnabled ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.asrIqamaEnabled ? 'Включено' : 'Выключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Магриб</div>
										{fixedPrayerTime.maghribIqamaEnabled ? (
											<div className="font-semibold text-gray-800">{fixedPrayerTime.maghribIqamaMinutes} мин</div>
										) : (
											<div className="font-semibold text-gray-400">Выключено</div>
										)}
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.maghribIqamaEnabled}
													onChange={() => toggleIqama('maghrib', !fixedPrayerTime.maghribIqamaEnabled)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.maghribIqamaEnabled ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className={`ml-2 text-xs ${fixedPrayerTime.maghribIqamaEnabled ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.maghribIqamaEnabled ? 'Включено' : 'Выключено'}</span>
											</label>
										</div>
									</div>
									<div className="p-2 bg-white rounded shadow">
										<div className="text-gray-500 text-sm">Иша</div>
										{fixedPrayerTime.ishaIqamaEnabled ? (
											<div className="font-semibold text-gray-800">{fixedPrayerTime.ishaIqamaMinutes} мин</div>
										) : (
											<div className="font-semibold text-gray-400">Выключено</div>
										)}
										<div className="flex items-center mt-1">
											<label className="flex items-center cursor-pointer">
												<input
													type="checkbox"
													checked={fixedPrayerTime.ishaIqamaEnabled}
													onChange={() => toggleIqama('isha', !fixedPrayerTime.ishaIqamaEnabled)}
													className="sr-only peer"
												/>
												<div className="w-10 h-5 bg-gray-200 rounded-full peer-checked:bg-green-400 transition-colors relative">
													<div className={`absolute left-1 top-1 w-3 h-3 bg-white rounded-full shadow transition-transform ${fixedPrayerTime.ishaIqamaEnabled ? 'translate-x-5' : ''}`}></div>
												</div>
												<span className={`ml-2 text-xs ${fixedPrayerTime.ishaIqamaEnabled ? 'text-green-600' : 'text-red-600'}`}>{fixedPrayerTime.ishaIqamaEnabled ? 'Включено' : 'Выключено'}</span>
											</label>
										</div>
									</div>
								</div>
							)}
							
							{showIqamaForm && (
								<>
									{!fixedPrayerTime || (!fixedPrayerTime.fajrIqamaEnabled && !fixedPrayerTime.mechetIqamaEnabled && !fixedPrayerTime.shurukIqamaEnabled && !fixedPrayerTime.zuhrIqamaEnabled && !fixedPrayerTime.asrIqamaEnabled && !fixedPrayerTime.maghribIqamaEnabled && !fixedPrayerTime.ishaIqamaEnabled) ? (
										<div className="p-4 bg-yellow-50 border border-yellow-200 rounded mb-4">
											<p className="text-yellow-800 text-sm">Для редактирования минут икамата сначала включите икамат для нужного намаза через переключатель выше.</p>
										</div>
									) : (
										<div className="grid grid-cols-4 gap-4 mb-4">
											{fixedPrayerTime?.fajrIqamaEnabled && (
												<div className="p-2 bg-white rounded shadow">
													<div className="text-gray-500 text-sm mb-2">Фаджр</div>
													<div className="flex items-center">
														<input
															type="number"
															min="0"
															max="60"
															value={fixedTimePrayers.fajrIqamaMinutes}
															onChange={(e) => setFixedTimePrayers(prev => ({ ...prev, fajrIqamaMinutes: parseInt(e.target.value) || 0 }))}
															className="w-20 p-1 border rounded text-sm text-black"
															placeholder="мин"
														/>
														<span className="ml-1 text-xs text-gray-600">мин</span>
													</div>
												</div>
											)}
											{fixedPrayerTime?.mechetIqamaEnabled && (
												<div className="p-2 bg-white rounded shadow">
													<div className="text-gray-500 text-sm mb-2">Мечеть</div>
													<div className="flex items-center">
														<input
															type="number"
															min="0"
															max="60"
															value={fixedTimePrayers.mechetIqamaMinutes}
															onChange={(e) => setFixedTimePrayers(prev => ({ ...prev, mechetIqamaMinutes: parseInt(e.target.value) || 0 }))}
															className="w-20 p-1 border rounded text-sm text-black"
															placeholder="мин"
														/>
														<span className="ml-1 text-xs text-gray-600">мин</span>
													</div>
												</div>
											)}
											{fixedPrayerTime?.shurukIqamaEnabled && (
												<div className="p-2 bg-white rounded shadow">
													<div className="text-gray-500 text-sm mb-2">Шурук</div>
													<div className="flex items-center">
														<input
															type="number"
															min="0"
															max="60"
															value={fixedTimePrayers.shurukIqamaMinutes}
															onChange={(e) => setFixedTimePrayers(prev => ({ ...prev, shurukIqamaMinutes: parseInt(e.target.value) || 0 }))}
															className="w-20 p-1 border rounded text-sm text-black"
															placeholder="мин"
														/>
														<span className="ml-1 text-xs text-gray-600">мин</span>
													</div>
												</div>
											)}
											{fixedPrayerTime?.zuhrIqamaEnabled && (
												<div className="p-2 bg-white rounded shadow">
													<div className="text-gray-500 text-sm mb-2">Зухр</div>
													<div className="flex items-center">
														<input
															type="number"
															min="0"
															max="60"
															value={fixedTimePrayers.zuhrIqamaMinutes}
															onChange={(e) => setFixedTimePrayers(prev => ({ ...prev, zuhrIqamaMinutes: parseInt(e.target.value) || 0 }))}
															className="w-20 p-1 border rounded text-sm text-black"
															placeholder="мин"
														/>
														<span className="ml-1 text-xs text-gray-600">мин</span>
													</div>
												</div>
											)}
											{fixedPrayerTime?.asrIqamaEnabled && (
												<div className="p-2 bg-white rounded shadow">
													<div className="text-gray-500 text-sm mb-2">Аср</div>
													<div className="flex items-center">
														<input
															type="number"
															min="0"
															max="60"
															value={fixedTimePrayers.asrIqamaMinutes}
															onChange={(e) => setFixedTimePrayers(prev => ({ ...prev, asrIqamaMinutes: parseInt(e.target.value) || 0 }))}
															className="w-20 p-1 border rounded text-sm text-black"
															placeholder="мин"
														/>
														<span className="ml-1 text-xs text-gray-600">мин</span>
													</div>
												</div>
											)}
											{fixedPrayerTime?.maghribIqamaEnabled && (
												<div className="p-2 bg-white rounded shadow">
													<div className="text-gray-500 text-sm mb-2">Магриб</div>
													<div className="flex items-center">
														<input
															type="number"
															min="0"
															max="60"
															value={fixedTimePrayers.maghribIqamaMinutes}
															onChange={(e) => setFixedTimePrayers(prev => ({ ...prev, maghribIqamaMinutes: parseInt(e.target.value) || 0 }))}
															className="w-20 p-1 border rounded text-sm text-black"
															placeholder="мин"
														/>
														<span className="ml-1 text-xs text-gray-600">мин</span>
													</div>
												</div>
											)}
											{fixedPrayerTime?.ishaIqamaEnabled && (
												<div className="p-2 bg-white rounded shadow">
													<div className="text-gray-500 text-sm mb-2">Иша</div>
													<div className="flex items-center">
														<input
															type="number"
															min="0"
															max="60"
															value={fixedTimePrayers.ishaIqamaMinutes}
															onChange={(e) => setFixedTimePrayers(prev => ({ ...prev, ishaIqamaMinutes: parseInt(e.target.value) || 0 }))}
															className="w-20 p-1 border rounded text-sm text-black"
															placeholder="мин"
														/>
														<span className="ml-1 text-xs text-gray-600">мин</span>
													</div>
												</div>
											)}
										</div>
									)}
								</>
							)}
						</div>
					)}

					<div className="w-full max-w-full bg-white rounded-lg shadow-md mb-4">
						<div className="overflow-y-auto" style={{ maxHeight: '50vh', overflowX: 'auto' }}>
							<table className="w-full border-collapse">
								<thead className="sticky top-0 bg-gray-200">
								<tr>
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
