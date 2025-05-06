'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config'

interface QRCode {
	id: number;
	imageUrl: string;
	mosqueId: number;
	isPrimary?: boolean; // Добавляем флаг, является ли QR-код основным
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
	const [isPrimary, setIsPrimary] = useState<boolean>(true); // По умолчанию основной QR-код
	const [mosques, setMosques] = useState<Mosque[]>([]);
	const [isEditing, setIsEditing] = useState(false);
	const [editingQRCodeId, setEditingQRCodeId] = useState<number | null>(null);
	const [userRole, setUserRole] = useState('');
	const [userCityId, setUserCityId] = useState<number | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchUserRole = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const token = localStorage.getItem('token');
			console.log('Токен:', token ? 'Присутствует' : 'Отсутствует');
			
			if (!token) {
				setError('Необходима авторизация. Перенаправление на страницу входа...');
				setTimeout(() => {
					window.location.href = '/admin/login';
				}, 2000);
				return;
			}
			
			const response = await axios.get(`${API_BASE_URL}/api/admin/me`, {
				headers: { Authorization: `Bearer ${token}` },
			});
			
			console.log('Данные пользователя:', response.data);
			setUserRole(response.data.role);
			setUserCityId(response.data.cityId);
		} catch (err: any) {
			console.error('Ошибка при получении роли пользователя:', err);
			setError('Не удалось загрузить данные пользователя. Проверьте соединение и авторизацию.');
			
			if (err.response && err.response.status === 401) {
				console.log('Ошибка авторизации, перенаправление на страницу входа...');
				localStorage.removeItem('token');
				setTimeout(() => {
					window.location.href = '/admin/login';
				}, 2000);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const fetchMosques = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const token = localStorage.getItem('token');
			
			const response = await axios.get<Mosque[]>(`${API_BASE_URL}/api/mosques`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			
			console.log('Загружено мечетей:', response.data.length);
			setMosques(response.data);
		} catch (err: any) {
			console.error('Ошибка при получении списка мечетей:', err);
			setError('Не удалось загрузить список мечетей. Попробуйте обновить страницу.');
		} finally {
			setIsLoading(false);
		}
	};

	const fetchQRCodes = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const token = localStorage.getItem('token');
			
			const response = await axios.get<QRCode[]>(`${API_BASE_URL}/api/qrcodes`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			
			console.log('Загружено QR-кодов:', response.data.length);
			setQRCodes(response.data);
		} catch (err: any) {
			console.error('Ошибка при получении QR-кодов:', err);
			setError('Не удалось загрузить QR-коды. Попробуйте обновить страницу.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateQRCode = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const token = localStorage.getItem('token');
			
			// Проверяем количество QR-кодов для данной мечети
			const mosqueQRCodes = qrcodes.filter(q => q.mosqueId.toString() === mosqueId);
			if (mosqueQRCodes.length >= 2) {
				setError('У мечети уже есть максимально допустимое количество QR-кодов (2). Удалите существующий QR-код, чтобы добавить новый.');
				setIsLoading(false);
				return;
			}
			
			// Формируем данные запроса
			const formData = new FormData();
			if (image) {
				formData.append('image', image);
			}
			formData.append('mosqueId', mosqueId);
			formData.append('isPrimary', isPrimary.toString());

			// Отправляем запрос на создание QR-кода
			const response = await axios.post(`${API_BASE_URL}/api/qrcodes/create`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					Authorization: `Bearer ${token}`,
				},
			});
			
			console.log('QR-код успешно создан');
			console.log('Ответ сервера:', response.data);
			
			// Обновляем список QR-кодов
			fetchQRCodes();
			resetForm();
		} catch (err: any) {
			console.error('Ошибка при создании QR-кода:', err);
			
			// Детализируем сообщение об ошибке
			if (err.response) {
				const status = err.response.status;
				console.log('Статус ошибки:', status);
				console.log('Данные ошибки:', err.response.data);
				
				if (status === 500) {
					setError('Ошибка сервера при создании QR-кода. Возможно, нарушены правила работы с QR-кодами.');
				} else if (status === 400) {
					setError('Некорректные данные. Проверьте параметры запроса.');
				} else if (status === 401) {
					setError('Ошибка авторизации. Попробуйте перезайти в систему.');
				} else {
					setError(`Ошибка при создании QR-кода: ${err.response.data.message || 'Неизвестная ошибка'}`);
				}
			} else {
				setError('Не удалось создать QR-код. Проверьте соединение с сервером.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleDeleteQRCode = async (id: number) => {
		if (!confirm('Вы уверены, что хотите удалить этот QR-код?')) {
			return;
		}
		
		try {
			setIsLoading(true);
			setError(null);
			const token = localStorage.getItem('token');
			
			await axios.delete(`${API_BASE_URL}/api/qrcodes/${id}`, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});
			
			console.log('QR-код успешно удален');
			fetchQRCodes();
		} catch (err: any) {
			console.error('Ошибка при удалении QR-кода:', err);
			setError('Не удалось удалить QR-код. Попробуйте еще раз позже.');
		} finally {
			setIsLoading(false);
		}
	};

	const handleEditQRCode = (qrcode: QRCode) => {
		setIsEditing(true);
		setEditingQRCodeId(qrcode.id);
		setMosqueId(qrcode.mosqueId.toString());
		setIsPrimary(qrcode.isPrimary ?? true);
		setImage(null);
		
		// Прокрутка к форме редактирования
		setTimeout(() => {
			const formElement = document.getElementById('qr-form');
			if (formElement) {
				formElement.scrollIntoView({ behavior: 'smooth' });
			}
		}, 100);
	};

	const handleUpdateQRCode = async () => {
		try {
			setIsLoading(true);
			setError(null);
			const token = localStorage.getItem('token');
			
			// Формируем данные запроса
			const formData = new FormData();
			if (image) {
				formData.append('image', image);
			}
			formData.append('mosqueId', mosqueId);
			formData.append('isPrimary', isPrimary.toString());

			// Отправляем запрос на обновление QR-кода
			const response = await axios.put(`${API_BASE_URL}/api/qrcodes/${editingQRCodeId}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					Authorization: `Bearer ${token}`,
				},
			});
			
			console.log('QR-код успешно обновлен');
			console.log('Ответ сервера:', response.data);
			
			// Обновляем список QR-кодов
			fetchQRCodes();
			resetForm();
		} catch (err: any) {
			console.error('Ошибка при обновлении QR-кода:', err);
			
			// Детализируем сообщение об ошибке
			if (err.response) {
				const status = err.response.status;
				console.log('Статус ошибки:', status);
				console.log('Данные ошибки:', err.response.data);
				
				if (status === 500) {
					setError('Ошибка сервера при обновлении QR-кода. Возможно, нарушены правила работы с QR-кодами.');
				} else if (status === 400) {
					setError('Некорректные данные. Проверьте параметры запроса.');
				} else if (status === 401) {
					setError('Ошибка авторизации. Попробуйте перезайти в систему.');
				} else {
					setError(`Ошибка при обновлении QR-кода: ${err.response.data.message || 'Неизвестная ошибка'}`);
				}
			} else {
				setError('Не удалось обновить QR-код. Проверьте соединение с сервером.');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const resetForm = () => {
		setImage(null);
		setMosqueId('');
		setIsPrimary(true);
		setIsEditing(false);
		setEditingQRCodeId(null);
	};

	const handleBack = () => {
		window.location.href = DASHBOARD_PAGES.DASHBOARD;
	};

	const handleRefresh = () => {
		fetchQRCodes();
	};

	// Оптимизируем функцию переключения типа QR-кода
	const handleToggleQRCodeType = async (qrcode: QRCode) => {
		try {
			setIsLoading(true);
			setError(null);
			const token = localStorage.getItem('token');
			
			// Новое значение isPrimary (противоположное текущему)
			const newIsPrimary = !qrcode.isPrimary;
			
			// Проверяем, не пытаемся ли мы сделать единственный QR-код второстепенным
			if (!newIsPrimary) {
				const mosqueQRCodes = qrcodes.filter(q => q.mosqueId === qrcode.mosqueId);
				if (mosqueQRCodes.length === 1) {
					setError('Нельзя сделать единственный QR-код мечети второстепенным.');
					setIsLoading(false);
					return;
				}
			}
			
			// Формируем данные запроса
			const formData = new FormData();
			formData.append('mosqueId', qrcode.mosqueId.toString());
			formData.append('isPrimary', newIsPrimary.toString());
			
			// Отправляем запрос на обновление типа QR-кода
			const response = await axios.put(`${API_BASE_URL}/api/qrcodes/${qrcode.id}`, formData, {
				headers: {
					'Content-Type': 'multipart/form-data',
					Authorization: `Bearer ${token}`,
				},
			});
			
			console.log(`QR-код успешно изменен на ${newIsPrimary ? 'основной' : 'дополнительный'}`);
			console.log('Ответ сервера:', response.data);
			
			// Обновляем список QR-кодов
			fetchQRCodes();
		} catch (err: any) {
			console.error('Ошибка при изменении типа QR-кода:', err);
			
			// Детализируем сообщение об ошибке
			if (err.response) {
				const status = err.response.status;
				console.log('Статус ошибки:', status);
				console.log('Данные ошибки:', err.response.data);
				
				if (status === 500) {
					setError('Ошибка сервера при обновлении QR-кода. Возможно, нарушены правила работы с QR-кодами.');
				} else if (status === 400) {
					setError('Некорректные данные. Проверьте параметры запроса.');
				} else if (status === 401) {
					setError('Ошибка авторизации. Попробуйте перезайти в систему.');
				} else {
					setError(`Ошибка при изменении типа QR-кода: ${err.response.data.message || 'Неизвестная ошибка'}`);
				}
			} else {
				setError('Не удалось изменить тип QR-кода. Проверьте соединение с сервером.');
			}
		} finally {
			setIsLoading(false);
		}
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

	// Группируем QR-коды по мечетям
	const groupedQRCodes = filteredQRCodes.reduce((acc, qrcode) => {
		const mosque = mosques.find(m => m.id === qrcode.mosqueId);
		const mosqueName = mosque ? mosque.name : 'Неизвестная мечеть';
		
		if (!acc[mosqueName]) {
			acc[mosqueName] = [];
		}
		
		acc[mosqueName].push(qrcode);
		return acc;
	}, {} as Record<string, QRCode[]>);

	return (
		<div className="h-screen w-full overflow-y-auto bg-gray-100 p-4 max-h-screen" style={{ scrollbarWidth: 'auto' }}>
			<div className="container mx-auto py-6 px-4">
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 relative">
						<strong className="font-bold">Ошибка! </strong>
						<span className="block sm:inline">{error}</span>
					</div>
				)}
				
				<div className="bg-white rounded-lg shadow-md p-6 mb-6">
					<div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
						<h2 className="text-2xl font-bold text-gray-700">Список QR-кодов</h2>
						<div className="flex space-x-2">
							<button 
								onClick={handleRefresh} 
								className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors"
								disabled={isLoading}
							>
								{isLoading ? 'Обновление...' : '🔄 Обновить'}
							</button>
							<button 
								onClick={handleBack} 
								className="bg-gray-100 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-200 transition-colors"
							>
								← Назад
							</button>
						</div>
					</div>
				
					{isLoading ? (
						<div className="flex justify-center items-center py-8">
							<div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
							<span className="ml-3 text-gray-600">Загрузка данных...</span>
						</div>
					) : (
						<div>
							{Object.entries(groupedQRCodes).length > 0 ? (
								Object.entries(groupedQRCodes).map(([mosqueName, qrcodes]) => (
									<div key={mosqueName} className="mb-8">
										<h3 className="text-xl font-semibold text-gray-700 mb-3 border-l-4 border-blue-500 pl-3">{mosqueName}</h3>
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											{qrcodes.map((qrcode) => {
												const mosque = mosques.find(m => m.id === qrcode.mosqueId);
												return (
													<div key={qrcode.id} className={`p-5 rounded-lg shadow-sm border ${qrcode.isPrimary ? 'border-green-500 bg-green-50' : 'border-gray-300'}`}>
														<div className="flex flex-col items-center mb-2">
															<div className={`text-sm font-medium mb-2 px-3 py-1 rounded-full ${qrcode.isPrimary ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-700'}`}>
																{qrcode.isPrimary ? 'Основной QR (для пожертвований мечети)' : 'Дополнительный QR (для проекта)'}
															</div>
															<img
																src={qrcode.imageUrl ? `${API_BASE_URL}${qrcode.imageUrl}` : 'https://via.placeholder.com/61x61'}
																alt="QR code"
																className="h-32 w-32 my-2 border p-1"
															/>
															<div className="text-center text-sm text-gray-500 mt-2">
																{qrcode.isPrimary 
																	? 'Отображается справа на экране' 
																	: 'Отображается слева на экране'}
															</div>
														</div>
														{(userRole === 'SUPER_ADMIN' || (userRole === 'CITY_ADMIN' && mosque && mosque.cityId === userCityId)) && (
															<div className="flex flex-col items-center mt-3 space-y-2">
																<button 
																	onClick={() => handleToggleQRCodeType(qrcode)}
																	className={`w-full px-4 py-1 text-white text-sm rounded-md transition-colors ${qrcode.isPrimary ? 'bg-blue-500 hover:bg-blue-600' : 'bg-green-500 hover:bg-green-600'}`}
																	disabled={isLoading}
																>
																	{isLoading ? 'Обработка...' : qrcode.isPrimary 
																		? 'Сделать дополнительным QR' 
																		: 'Сделать основным QR'}
																</button>
																<div className="flex w-full space-x-2">
																	<button 
																		onClick={() => handleEditQRCode(qrcode)}
																		className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-1 rounded-md text-sm"
																		disabled={isLoading}
																	>
																		Редактировать
																	</button>
																	<button 
																		onClick={() => handleDeleteQRCode(qrcode.id)} 
																		className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-1 rounded-md text-sm"
																		disabled={isLoading}
																	>
																		Удалить
																	</button>
																</div>
															</div>
														)}
													</div>
												);
											})}
										</div>
									</div>
								))
							) : (
								<div className="text-center py-10 bg-gray-50 rounded-lg border border-gray-200">
									<div className="text-gray-500 mb-2">QR-коды не найдены</div>
									<p className="text-sm text-gray-400">Добавьте QR-код с помощью формы ниже</p>
								</div>
							)}
						</div>
					)}
				</div>
				
				<div id="qr-form" className="bg-white p-6 rounded-lg shadow-md">
					<h2 className="text-xl font-bold text-gray-700 mb-4 sticky top-0 bg-white pb-3 border-b">
						{isEditing ? 'Редактировать QR-код' : 'Добавить QR-код'}
					</h2>
					
					<div className="mb-4">
						<label className="block text-gray-700 font-medium mb-2">Выберите мечеть:</label>
						<select
							value={mosqueId}
							onChange={(e) => setMosqueId(e.target.value)}
							className="border p-2 mb-2 w-full text-black"
							required
						>
							<option value="">Выберите мечеть</option>
							{filteredMosques.map((mosque) => (
								<option key={mosque.id} value={mosque.id}>{mosque.name}</option>
							))}
						</select>
					</div>
					
					<div className="mb-4">
						<label className="block text-gray-700 font-medium mb-2">Загрузите изображение QR-кода:</label>
						<input
							type="file"
							accept="image/*"
							onChange={(e) => setImage(e.target.files ? e.target.files[0] : null)}
							className="border p-2 mb-2 w-full text-black"
						/>
						{isEditing && (
							<p className="text-sm text-gray-500 mt-1">* Оставьте поле пустым, если не хотите менять изображение</p>
						)}
					</div>
					
					<div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
						<h3 className="font-medium text-gray-800 mb-3">Тип QR-кода:</h3>
						
						<div className="flex flex-col space-y-3">
							<label className={`relative flex items-center p-3 rounded-md cursor-pointer ${isPrimary ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}>
								<input
									type="radio"
									name="qrType"
									checked={isPrimary}
									onChange={() => setIsPrimary(true)}
									className="mr-3 h-5 w-5 accent-green-500"
								/>
								<div>
									<span className="font-medium text-gray-800">Основной QR-код для пожертвований мечети</span>
									<p className="text-sm text-gray-500 mt-1">Будет отображен в правой части экрана</p>
								</div>
							</label>
							
							<label className={`relative flex items-center p-3 rounded-md cursor-pointer ${!isPrimary ? 'bg-blue-50 border border-blue-200' : 'bg-white border border-gray-200'}`}>
								<input
									type="radio"
									name="qrType"
									checked={!isPrimary}
									onChange={() => setIsPrimary(false)}
									className="mr-3 h-5 w-5 accent-blue-500"
								/>
								<div>
									<span className="font-medium text-gray-800">Дополнительный QR-код для проекта</span>
									<p className="text-sm text-gray-500 mt-1">Будет отображен в левой части экрана</p>
								</div>
							</label>
						</div>
					</div>
					
					<div className="flex flex-col space-y-2">
						<button 
							onClick={isEditing ? handleUpdateQRCode : handleCreateQRCode} 
							className="w-full px-4 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out font-medium"
							disabled={!mosqueId || isLoading}
						>
							{isLoading 
								? "Обработка..."
								: isEditing 
									? 'Сохранить изменения' 
									: 'Добавить QR-код'
							}
						</button>
						
						{isEditing && (
							<button 
								onClick={resetForm} 
								className="w-full px-4 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition duration-300 ease-in-out font-medium"
								disabled={isLoading}
							>
								Отмена
							</button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default QRCodePage;