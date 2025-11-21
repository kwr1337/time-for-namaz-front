'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { API_BASE_URL } from '@/config/config';
import { toast } from 'react-hot-toast';
import type { NameOfAllah, UpdateNameOfAllahDto } from '@/types/names-of-allah.types';

interface Mosque {
    id: number;
    name: string;
    cityId: number;
}

const NamesOfAllahPage = () => {
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [selectedMosqueId, setSelectedMosqueId] = useState<number | null>(null);
    const [names, setNames] = useState<NameOfAllah[]>([]);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userCityId, setUserCityId] = useState<number | null>(null);
    const [userMosqueId, setUserMosqueId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formValues, setFormValues] = useState<UpdateNameOfAllahDto>({});
    const [search, setSearch] = useState('');

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
            fetchNames();
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

    const fetchNames = async () => {
        if (!selectedMosqueId) return;

        setLoading(true);
        try {
            const response = await axios.get<NameOfAllah[]>(
                `${API_BASE_URL}/api/names-of-allah/mosque/${selectedMosqueId}`
            );
            setNames(response.data);
        } catch (error: any) {
            console.error('Ошибка при загрузке имен Аллаха:', error);
            if (error.response?.status === 404) {
                // Имена не найдены, можно предложить инициализацию
                setNames([]);
            } else {
                toast.error('Ошибка при загрузке имен Аллаха');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleInitialize = async () => {
        if (!selectedMosqueId) return;

        if (!confirm('Инициализировать все 99 имен Аллаха для этой мечети? Это создаст базовые значения для всех имен.')) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                `${API_BASE_URL}/api/names-of-allah/mosque/${selectedMosqueId}/initialize`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );
            toast.success('Имена Аллаха успешно инициализированы');
            await fetchNames();
        } catch (error: any) {
            console.error('Ошибка при инициализации имен:', error);
            if (error.response?.status === 401) {
                toast.error('Не авторизован');
            } else if (error.response?.status === 403) {
                toast.error('Недостаточно прав');
            } else {
                toast.error('Ошибка при инициализации имен');
            }
        } finally {
            setLoading(false);
        }
    };

    const startEdit = (name: NameOfAllah) => {
        setEditingId(name.id);
        setFormValues({
            transcription: name.transcription,
            meaning: name.meaning,
            transcriptionTatar: name.transcriptionTatar || '',
            meaningTatar: name.meaningTatar || ''
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setFormValues({});
    };

    const handleSave = async () => {
        if (!editingId) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `${API_BASE_URL}/api/names-of-allah/${editingId}`,
                formValues,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            toast.success('Имя Аллаха успешно обновлено');
            await fetchNames();
            cancelEdit();
        } catch (error: any) {
            console.error('Ошибка при сохранении имени:', error);
            if (error.response?.status === 401) {
                toast.error('Не авторизован');
            } else if (error.response?.status === 403) {
                toast.error('Недостаточно прав для редактирования');
            } else if (error.response?.status === 404) {
                toast.error('Имя не найдено');
            } else {
                toast.error('Ошибка при сохранении имени');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        window.location.href = DASHBOARD_PAGES.DASHBOARD;
    };

    const filteredNames = names.filter(name => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            name.arabic.toLowerCase().includes(q) ||
            name.transcription.toLowerCase().includes(q) ||
            name.meaning.toLowerCase().includes(q) ||
            (name.transcriptionTatar && name.transcriptionTatar.toLowerCase().includes(q)) ||
            (name.meaningTatar && name.meaningTatar.toLowerCase().includes(q))
        );
    });

    if (loading && !names.length && !selectedMosqueId) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-xl">Загрузка...</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 overflow-y-auto max-h-screen">
            <div className="w-full max-w-[1200px] p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-700">Управление именами Аллаха</h2>
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

                {selectedMosqueId && (
                    <div className="space-y-4">
                        {/* Кнопка инициализации и поиск */}
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Поиск:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Поиск по арабскому, транскрипции или значению..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                                />
                            </div>
                            {names.length === 0 && (
                                <button
                                    onClick={handleInitialize}
                                    disabled={loading}
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    Инициализировать 99 имен
                                </button>
                            )}
                        </div>

                        {/* Список имен */}
                        {loading && names.length === 0 ? (
                            <div className="text-center py-8">Загрузка...</div>
                        ) : filteredNames.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {names.length === 0
                                    ? 'Имена Аллаха не найдены. Нажмите "Инициализировать 99 имен" для создания.'
                                    : 'Ничего не найдено по запросу'}
                            </div>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto border rounded">
                                <table className="min-w-full bg-white">
                                    <thead className="sticky top-0 bg-gray-100">
                                        <tr>
                                            <th className="py-2 px-4 border-b text-black text-right w-[15%]">Арабский</th>
                                            <th className="py-2 px-4 border-b text-black text-left w-[20%]">Транскрипция (RU)</th>
                                            <th className="py-2 px-4 border-b text-black text-left w-[20%]">Транскрипция (TT)</th>
                                            <th className="py-2 px-4 border-b text-black text-left w-[20%]">Значение (RU)</th>
                                            <th className="py-2 px-4 border-b text-black text-left w-[20%]">Значение (TT)</th>
                                            <th className="py-2 px-4 border-b text-black w-[5%]">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredNames.map((name) => (
                                            <tr key={name.id} className="hover:bg-gray-50">
                                                <td className="py-2 px-4 border-b text-black text-right font-arabic text-xl">
                                                    {name.arabic}
                                                </td>
                                                <td className="py-2 px-4 border-b text-black">
                                                    {editingId === name.id ? (
                                                        <input
                                                            type="text"
                                                            value={formValues.transcription || ''}
                                                            onChange={(e) =>
                                                                setFormValues(prev => ({ ...prev, transcription: e.target.value }))
                                                            }
                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-sm"
                                                        />
                                                    ) : (
                                                        <div className="text-sm">{name.transcription}</div>
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 border-b text-black">
                                                    {editingId === name.id ? (
                                                        <input
                                                            type="text"
                                                            value={formValues.transcriptionTatar || ''}
                                                            onChange={(e) =>
                                                                setFormValues(prev => ({ ...prev, transcriptionTatar: e.target.value }))
                                                            }
                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-sm"
                                                        />
                                                    ) : (
                                                        <div className="text-sm">{name.transcriptionTatar || <span className="text-gray-400">—</span>}</div>
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 border-b text-black">
                                                    {editingId === name.id ? (
                                                        <textarea
                                                            value={formValues.meaning || ''}
                                                            onChange={(e) =>
                                                                setFormValues(prev => ({ ...prev, meaning: e.target.value }))
                                                            }
                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-sm"
                                                            rows={2}
                                                        />
                                                    ) : (
                                                        <div className="text-sm">{name.meaning}</div>
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 border-b text-black">
                                                    {editingId === name.id ? (
                                                        <textarea
                                                            value={formValues.meaningTatar || ''}
                                                            onChange={(e) =>
                                                                setFormValues(prev => ({ ...prev, meaningTatar: e.target.value }))
                                                            }
                                                            className="w-full border border-gray-300 rounded px-2 py-1 text-black text-sm"
                                                            rows={2}
                                                        />
                                                    ) : (
                                                        <div className="text-sm">{name.meaningTatar || <span className="text-gray-400">—</span>}</div>
                                                    )}
                                                </td>
                                                <td className="py-2 px-4 border-b text-black">
                                                    {editingId === name.id ? (
                                                        <div className="flex flex-col gap-1">
                                                            <button
                                                                onClick={handleSave}
                                                                disabled={loading}
                                                                className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700 disabled:bg-gray-400"
                                                            >
                                                                Сохранить
                                                            </button>
                                                            <button
                                                                onClick={cancelEdit}
                                                                className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
                                                            >
                                                                Отмена
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => startEdit(name)}
                                                            disabled={editingId !== null}
                                                            className="text-yellow-600 hover:text-yellow-800 text-xs disabled:text-gray-400"
                                                        >
                                                            Редактировать
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {!selectedMosqueId && (
                    <div className="text-center text-gray-500 py-8">
                        {userRole !== 'MOSQUE_ADMIN' ? 'Выберите мечеть для управления именами Аллаха' : 'Загрузка...'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NamesOfAllahPage;

