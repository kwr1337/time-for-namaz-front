'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config';
import type { MosqueLanguageSettings, UpdateMosqueLanguageSettingsDto } from '@/types/translation.types';
import { toast } from 'react-hot-toast';

interface Mosque {
    id: number;
    name: string;
    cityId: number;
}

const LanguageSettingsPage = () => {
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [selectedMosqueId, setSelectedMosqueId] = useState<number | null>(null);
    const [settings, setSettings] = useState<MosqueLanguageSettings | null>(null);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userCityId, setUserCityId] = useState<number | null>(null);
    const [userMosqueId, setUserMosqueId] = useState<number | null>(null);

    useEffect(() => {
        fetchUserRole();
    }, []);

    useEffect(() => {
        if (userRole) {
            fetchMosques();
        }
    }, [userRole, userCityId, userMosqueId]);

    useEffect(() => {
        if (selectedMosqueId) {
            fetchSettings();
        }
    }, [selectedMosqueId]);

    const fetchUserRole = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE_URL}/api/admin/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUserRole(response.data.role);
            setUserCityId(response.data.cityId || null);
            setUserMosqueId(response.data.mosqueId || null);

            // Автоматически выбираем мечеть для MOSQUE_ADMIN
            if (response.data.role === 'MOSQUE_ADMIN' && response.data.mosqueId) {
                setSelectedMosqueId(response.data.mosqueId);
            }
        } catch (error) {
            console.error('Ошибка при получении роли пользователя:', error);
        }
    };

    const fetchMosques = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<Mosque[]>(`${API_BASE_URL}/api/mosques`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            let filteredMosques = response.data;

            // Фильтруем мечети в зависимости от роли
            if (userRole === 'CITY_ADMIN' && userCityId !== null) {
                filteredMosques = response.data.filter(m => m.cityId === userCityId);
            } else if (userRole === 'MOSQUE_ADMIN' && userMosqueId !== null) {
                filteredMosques = response.data.filter(m => m.id === userMosqueId);
            }

            setMosques(filteredMosques);

            // Если только одна мечеть, выбираем её автоматически
            if (filteredMosques.length === 1) {
                setSelectedMosqueId(filteredMosques[0].id);
            }
        } catch (error) {
            console.error('Ошибка при загрузке мечетей:', error);
            toast.error('Ошибка при загрузке мечетей');
        }
    };

    const fetchSettings = async () => {
        if (!selectedMosqueId) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get<MosqueLanguageSettings>(
                `${API_BASE_URL}/api/mosque-language-settings/mosque/${selectedMosqueId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            // Убеждаемся, что fridayZuhrAsJomgaEnabled всегда имеет значение
            const settingsData = {
                ...response.data,
                fridayZuhrAsJomgaEnabled: response.data.fridayZuhrAsJomgaEnabled ?? false
            };
            setSettings(settingsData);
        } catch (error: any) {
            console.error('Ошибка при загрузке настроек:', error);
            if (error.response?.status === 404) {
                // Настройки не найдены, создадим дефолтные
                const defaultSettings: MosqueLanguageSettings = {
                    id: 0,
                    mosqueId: selectedMosqueId,
                    translationsEnabled: true,
                    languageToggleEnabled: false,
                    languageToggleIntervalSeconds: 30,
                    fridayZuhrAsJomgaEnabled: false,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    mosqueName: mosques.find(m => m.id === selectedMosqueId)?.name || '',
                    cityName: ''
                };
                setSettings(defaultSettings);
            } else {
                toast.error('Ошибка при загрузке настроек');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!selectedMosqueId || !settings) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const updateData: UpdateMosqueLanguageSettingsDto = {
                // Если включено переключение языков, автоматически включаем переводы
                translationsEnabled: settings.languageToggleEnabled ? true : settings.translationsEnabled,
                languageToggleEnabled: settings.languageToggleEnabled,
                languageToggleIntervalSeconds: settings.languageToggleIntervalSeconds,
                fridayZuhrAsJomgaEnabled: settings.fridayZuhrAsJomgaEnabled ?? false
            };

            const response = await axios.put(
                `${API_BASE_URL}/api/mosque-language-settings/mosque/${selectedMosqueId}`,
                updateData,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            // Обновляем локальное состояние из ответа сервера, если оно есть
            if (response.data) {
                setSettings({
                    ...settings,
                    ...response.data,
                    fridayZuhrAsJomgaEnabled: response.data.fridayZuhrAsJomgaEnabled ?? updateData.fridayZuhrAsJomgaEnabled ?? false
                });
            }

            toast.success('Настройки успешно сохранены');
            // Перезагружаем настройки для синхронизации с сервером
            await fetchSettings();
        } catch (error: any) {
            console.error('Ошибка при сохранении настроек:', error);
            if (error.response?.status === 401) {
                toast.error('Не авторизован');
            } else if (error.response?.status === 403) {
                toast.error('Недостаточно прав для редактирования этой мечети');
            } else if (error.response?.status === 404) {
                toast.error('Мечеть не найдена');
            } else {
                toast.error('Ошибка при сохранении настроек');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        window.location.href = DASHBOARD_PAGES.DASHBOARD;
    };

    if (loading && !settings) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 overflow-y-auto max-h-screen">
            <div className="w-full max-w-[800px] p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-700">Настройки языков мечети</h2>
                    <button
                        onClick={handleBack}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                    >
                        Назад
                    </button>
                </div>

                {/* Выбор мечети */}
                {userRole !== 'MOSQUE_ADMIN' && (
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Выберите мечеть:
                        </label>
                        <select
                            value={selectedMosqueId || ''}
                            onChange={(e) => setSelectedMosqueId(Number(e.target.value))}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                        >
                            <option value="">-- Выберите мечеть --</option>
                            {mosques.map((mosque) => (
                                <option key={mosque.id} value={mosque.id}>
                                    {mosque.name}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                {selectedMosqueId && settings && (
                    <div className="space-y-6">
                        <div className="border-b pb-4">
                            <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                Мечеть: {settings.mosqueName}
                            </h3>
                            {settings.cityName && (
                                <p className="text-sm text-gray-600">Город: {settings.cityName}</p>
                            )}
                        </div>

                        {/* Включение/выключение автоматического переключения языков */}
                        <div className="flex items-center justify-between p-4 border rounded">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Автоматическое переключение языков
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    Автоматически переключать язык интерфейса через заданный интервал
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.languageToggleEnabled}
                                    onChange={(e) => {
                                        const newToggleEnabled = e.target.checked;
                                        // При включении переключения языков автоматически включаем переводы
                                        setSettings({ 
                                            ...settings, 
                                            languageToggleEnabled: newToggleEnabled,
                                            translationsEnabled: newToggleEnabled ? true : settings.translationsEnabled
                                        });
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Интервал переключения языков */}
                        {settings.languageToggleEnabled && (
                            <div className="p-4 border rounded">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Интервал переключения (секунды)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="3600"
                                    value={settings.languageToggleIntervalSeconds}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            languageToggleIntervalSeconds: Number(e.target.value)
                                        })
                                    }
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Минимальное значение: 1 секунда. Рекомендуется: 5-30 секунд
                                </p>
                            </div>
                        )}

                        {/* Переименование ЗУХР в Жомга по пятницам */}
                        <div className="flex items-center justify-between p-4 border rounded">
                            <div>
                                <label className="text-sm font-medium text-gray-700">
                                    Переименовать ЗУХР в "Жомга" по пятницам
                                </label>
                                <p className="text-xs text-gray-500 mt-1">
                                    В пятницу название намаза ЗУХР будет отображаться как "Жомга"
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.fridayZuhrAsJomgaEnabled ?? false}
                                    onChange={(e) =>
                                        setSettings({
                                            ...settings,
                                            fridayZuhrAsJomgaEnabled: e.target.checked
                                        })
                                    }
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        {/* Кнопка сохранения */}
                        <div className="flex justify-end">
                            <button
                                onClick={handleSaveSettings}
                                disabled={loading}
                                className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Сохранение...' : 'Сохранить'}
                            </button>
                        </div>
                    </div>
                )}

                {!selectedMosqueId && (
                    <div className="text-center text-gray-500 py-8">
                        {userRole !== 'MOSQUE_ADMIN' ? 'Выберите мечеть для настройки' : 'Загрузка...'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default LanguageSettingsPage;

