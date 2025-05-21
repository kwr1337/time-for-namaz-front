'use client'

import React, { useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { API_BASE_URL } from '@/config/config'
import { toast } from 'react-hot-toast';

const LoginPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	const handleLogin = async () => {
		try {
			if (!email || !password) {
				toast.error('Пожалуйста, заполните все поля');
				return;
			}

			const response = await axios.post(`${API_BASE_URL}/api/admin/login`, { 
				email, 
				password 
			});

			if (response.data && response.data.access_token) {
				localStorage.setItem('token', response.data.access_token);
				axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
				toast.success('Успешный вход в систему');
				window.location.href = DASHBOARD_PAGES.DASHBOARD;
			} else {
				toast.error('Ошибка авторизации: неверный ответ сервера');
			}
		} catch (err: any) {
			if (err.response) {
				// Обработка ответа с ошибкой от сервера
				if (err.response.status === 400) {
					toast.error('Неверный email или пароль');
				} else if (err.response.status === 401) {
					toast.error('Нет доступа. Проверьте свои учетные данные');
				} else {
					toast.error(`Ошибка сервера: ${err.response.data.message || 'Неизвестная ошибка'}`);
				}
			} else if (err.request) {
				// Ошибка сети - запрос был сделан, но ответ не получен
				toast.error('Ошибка сети. Проверьте подключение к интернету');
			} else {
				// Что-то случилось при настройке запроса
				toast.error('Ошибка при попытке входа');
			}
			setError('Ошибка при входе в систему');
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100 overflow-y-auto max-h-screen">
			<div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center text-gray-700">Вход в админку</h2>
				<input
					type="login"
					placeholder="Логин"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<input
					type="password"
					placeholder="Пароль"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
				<button
					onClick={handleLogin}
					className="w-full px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out"
				>
					Войти
				</button>
				{error && <p className="mt-4 text-sm text-red-600">{error}</p>}
			</div>
		</div>
	);
};

export default LoginPage;
