'use client'

import React, { useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { API_BASE_URL } from '@/config/config'

const LoginPage = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');

	const handleLogin = async () => {
		try {
			const response = await axios.post(`${API_BASE_URL}/api/admin/login`, { email, password });
			localStorage.setItem('token', response.data.access_token);
			axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`;
			window.location.href = DASHBOARD_PAGES.DASHBOARD;
		} catch (err) {
			setError('Неверный логин или пароль');
		}
	};

	return (
		<div className="flex items-center justify-center min-h-screen bg-gray-100 overflow-y-auto max-h-screen">
			<div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
				<h2 className="text-2xl font-bold text-center text-gray-700">Вход в админку</h2>
				<input
					type="email"
					placeholder="Email"
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
