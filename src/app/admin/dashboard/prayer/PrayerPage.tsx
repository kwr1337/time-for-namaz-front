'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'

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

	const handleCityChange = (cityId: string) => {
		setSelectedCityId(cityId);
		fetchPrayers(cityId);
	};

	const handlePrayerShift = async () => {
		if (!selectedCityId || !selectedPrayer) return;

		const finalShiftMinutes = isCustomShift ? parseInt(customShiftMinutes, 10) : shiftMinutes;

		await axios.post(`${API_BASE_URL}/api/prayers/shift`, {
			cityId: parseInt(selectedCityId, 10),
			prayerName: selectedPrayer === 'mosque' ? 'mechet' : selectedPrayer,
			shiftMinutes: finalShiftMinutes,
		}, {
			headers: {
				Authorization: `Bearer ${localStorage.getItem('token')}`,
			},
		});
		fetchPrayers(selectedCityId);
	};

	useEffect(() => {
		fetchCities();
		fetchRole();
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

	return (
		<div className={`min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4 overflow-y-auto max-h-screen ${loading ? 'pointer-events-none opacity-50' : ''}`}>
			{loading && (
				<div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
					<div className="loader">Загрузка...</div>
				</div>
			)}
			<div className="w-full max-w-[1000px] p-8 bg-white rounded-lg shadow-md">
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

				<div className="w-full max-w-full bg-white rounded-lg shadow-md overflow-y-auto mb-4"
						 style={{ maxHeight: '500px' }}>
					<table className="w-full">
						<thead>
						<tr className="bg-gray-200">
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
								<td className="p-2 text-black text-center">{prayer.date}</td>
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

				<div className="mb-4">
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
		</div>
	);
};

export default PrayerPage;
