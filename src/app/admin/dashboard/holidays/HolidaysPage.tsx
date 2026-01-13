'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';
import { toast } from 'react-hot-toast';
import type { Holiday, CreateHolidayDto, UpdateHolidayDto } from '@/types/holiday.types';

interface Mosque {
    id: number;
    name: string;
    cityId: number;
}

const HolidaysPage = () => {
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [selectedMosqueId, setSelectedMosqueId] = useState<number | null>(null);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(false);
    const [userRole, setUserRole] = useState('');
    const [userCityId, setUserCityId] = useState<number | null>(null);
    const [userMosqueId, setUserMosqueId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formValues, setFormValues] = useState<CreateHolidayDto>({
        nameRu: '',
        nameTatar: '',
        startDate: '',
        endDate: null,
        isEnabled: true
    });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'enabled' | 'disabled'>('all');

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
            fetchHolidays();
        }
    }, [selectedMosqueId]);

    const fetchUserRole = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/admin/me`, {
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
            const response = await axios.get<Mosque[]>(`/api/mosques`, {
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

    const fetchHolidays = async () => {
        if (!selectedMosqueId) return;

        setLoading(true);
        try {
            const response = await axios.get<Holiday[]>(
                `/api/mosques/${selectedMosqueId}/holidays`
            );
            setHolidays(response.data);
        } catch (error: any) {
            console.error('Ошибка при загрузке праздников:', error);
            if (error.response?.status === 404) {
                setHolidays([]);
            } else {
                toast.error('Ошибка при загрузке праздников');
            }
        } finally {
            setLoading(false);
        }
    };

    const validateDate = (date: string): boolean => {
        if (!date || date.length !== 5) return false;
        const [month, day] = date.split('-');
        const monthNum = parseInt(month, 10);
        const dayNum = parseInt(day, 10);
        
        if (isNaN(monthNum) || isNaN(dayNum)) return false;
        if (monthNum < 1 || monthNum > 12) return false;
        if (dayNum < 1 || dayNum > 31) return false;
        
        // Проверка количества дней в месяце
        const daysInMonth = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (dayNum > daysInMonth[monthNum - 1]) return false;
        
        return true;
    };

    const handleCreate = () => {
        setFormValues({
            nameRu: '',
            nameTatar: '',
            startDate: '',
            endDate: null,
            isEnabled: true
        });
        setIsCreating(true);
        setEditingId(null);
    };

    const handleEdit = (holiday: Holiday) => {
        setFormValues({
            nameRu: holiday.nameRu,
            nameTatar: holiday.nameTatar,
            startDate: holiday.startDate,
            endDate: holiday.endDate,
            isEnabled: holiday.isEnabled
        });
        setEditingId(holiday.id);
        setIsCreating(false);
    };

    const handleCancel = () => {
        setIsCreating(false);
        setEditingId(null);
        setFormValues({
            nameRu: '',
            nameTatar: '',
            startDate: '',
            endDate: null,
            isEnabled: true
        });
    };

    const handleSave = async () => {
        if (!selectedMosqueId) return;

        // Валидация
        if (!formValues.nameRu.trim()) {
            toast.error('Введите название на русском');
            return;
        }
        if (!formValues.nameTatar.trim()) {
            toast.error('Введите название на татарском');
            return;
        }
        if (!formValues.startDate || !validateDate(formValues.startDate)) {
            toast.error('Введите корректную дату начала в формате MM-DD (например, 03-01)');
            return;
        }
        if (formValues.endDate && formValues.endDate.trim() && !validateDate(formValues.endDate)) {
            toast.error('Введите корректную дату окончания в формате MM-DD (например, 03-30)');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            
            if (isCreating) {
                // Создание
                const createData: CreateHolidayDto = {
                    nameRu: formValues.nameRu.trim(),
                    nameTatar: formValues.nameTatar.trim(),
                    startDate: formValues.startDate,
                    endDate: formValues.endDate && formValues.endDate.trim() ? formValues.endDate : null,
                    isEnabled: formValues.isEnabled ?? true
                };

                await axios.post(
                    `/api/mosques/${selectedMosqueId}/holidays`,
                    createData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                toast.success('Праздник успешно создан');
            } else if (editingId) {
                // Обновление
                const updateData: UpdateHolidayDto = {
                    nameRu: formValues.nameRu.trim(),
                    nameTatar: formValues.nameTatar.trim(),
                    startDate: formValues.startDate,
                    endDate: formValues.endDate && formValues.endDate.trim() ? formValues.endDate : null,
                    isEnabled: formValues.isEnabled
                };

                await axios.patch(
                    `/api/mosques/${selectedMosqueId}/holidays/${editingId}`,
                    updateData,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        }
                    }
                );
                toast.success('Праздник успешно обновлен');
            }

            await fetchHolidays();
            handleCancel();
        } catch (error: any) {
            console.error('Ошибка при сохранении праздника:', error);
            if (error.response?.status === 401) {
                toast.error('Не авторизован');
            } else if (error.response?.status === 403) {
                toast.error('Недостаточно прав');
            } else if (error.response?.status === 404) {
                toast.error('Праздник не найден');
            } else {
                toast.error('Ошибка при сохранении праздника');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!selectedMosqueId) return;

        if (!confirm('Вы уверены, что хотите удалить этот праздник?')) {
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `/api/mosques/${selectedMosqueId}/holidays/${id}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            toast.success('Праздник успешно удален');
            await fetchHolidays();
        } catch (error: any) {
            console.error('Ошибка при удалении праздника:', error);
            if (error.response?.status === 401) {
                toast.error('Не авторизован');
            } else if (error.response?.status === 403) {
                toast.error('Недостаточно прав');
            } else if (error.response?.status === 404) {
                toast.error('Праздник не найден');
            } else {
                toast.error('Ошибка при удалении праздника');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEnabled = async (id: number, currentStatus: boolean) => {
        if (!selectedMosqueId) return;

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.patch(
                `/api/mosques/${selectedMosqueId}/holidays/${id}`,
                { isEnabled: !currentStatus },
                {
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                }
            );
            toast.success(`Праздник ${!currentStatus ? 'включен' : 'выключен'}`);
            await fetchHolidays();
        } catch (error: any) {
            console.error('Ошибка при переключении статуса:', error);
            if (error.response?.status === 401) {
                toast.error('Не авторизован');
            } else if (error.response?.status === 403) {
                toast.error('Недостаточно прав');
            } else if (error.response?.status === 404) {
                toast.error('Праздник не найден');
            } else {
                toast.error('Ошибка при переключении статуса');
            }
            await fetchHolidays();
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        window.location.href = DASHBOARD_PAGES.DASHBOARD;
    };

    const filteredHolidays = holidays.filter(holiday => {
        // Фильтр по статусу
        if (statusFilter === 'enabled' && !holiday.isEnabled) {
            return false;
        }
        if (statusFilter === 'disabled' && holiday.isEnabled) {
            return false;
        }

        // Фильтр по поисковому запросу
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (
            holiday.nameRu.toLowerCase().includes(q) ||
            holiday.nameTatar.toLowerCase().includes(q)
        );
    });

    if (loading && !holidays.length && !selectedMosqueId) {
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
                    <h2 className="text-2xl font-bold text-gray-700">Управление праздниками мечети</h2>
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
                        {/* Кнопка добавления и фильтры */}
                        <div className="flex gap-4 items-end flex-wrap">
                            <div className="flex-1 min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Поиск:
                                </label>
                                <input
                                    type="text"
                                    placeholder="Поиск по названию..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                                />
                            </div>
                            <div className="min-w-[150px]">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Фильтр по статусу:
                                </label>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as 'all' | 'enabled' | 'disabled')}
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                                >
                                    <option value="all">Все</option>
                                    <option value="enabled">Включенные</option>
                                    <option value="disabled">Выключенные</option>
                                </select>
                            </div>
                            <div>
                                <button
                                    onClick={handleCreate}
                                    disabled={loading || isCreating || editingId !== null}
                                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                                >
                                    + Добавить праздник
                                </button>
                            </div>
                        </div>

                        {/* Форма создания/редактирования */}
                        {(isCreating || editingId !== null) && (
                            <div className="p-4 border rounded bg-gray-50">
                                <h3 className="text-lg font-semibold mb-4">
                                    {isCreating ? 'Создание праздника' : 'Редактирование праздника'}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Название (RU) *
                                        </label>
                                        <input
                                            type="text"
                                            value={formValues.nameRu}
                                            onChange={(e) => setFormValues({ ...formValues, nameRu: e.target.value })}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                                            placeholder="Например: Рамадан"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Название (TT) *
                                        </label>
                                        <input
                                            type="text"
                                            value={formValues.nameTatar}
                                            onChange={(e) => setFormValues({ ...formValues, nameTatar: e.target.value })}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                                            placeholder="Например: Рамазан"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Дата начала (MM-DD) *
                                        </label>
                                        <input
                                            type="text"
                                            value={formValues.startDate}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9-]/g, '');
                                                if (value.length <= 5) {
                                                    setFormValues({ ...formValues, startDate: value });
                                                }
                                            }}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                                            placeholder="03-01"
                                            maxLength={5}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Формат: MM-DD (например: 03-01)</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Дата окончания (MM-DD)
                                        </label>
                                        <input
                                            type="text"
                                            value={formValues.endDate || ''}
                                            onChange={(e) => {
                                                const value = e.target.value.replace(/[^0-9-]/g, '');
                                                if (value.length <= 5) {
                                                    setFormValues({ ...formValues, endDate: value || null });
                                                }
                                            }}
                                            className="w-full border border-gray-300 rounded px-3 py-2 text-black"
                                            placeholder="03-30 (необязательно)"
                                            maxLength={5}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Оставьте пустым для однодневного праздника</p>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={formValues.isEnabled ?? true}
                                            onChange={(e) => setFormValues({ ...formValues, isEnabled: e.target.checked })}
                                            className="w-5 h-5 cursor-pointer"
                                            id="isEnabled"
                                        />
                                        <label htmlFor="isEnabled" className="ml-2 text-sm font-medium text-gray-700 cursor-pointer">
                                            Включено
                                        </label>
                                    </div>
                                </div>
                                <div className="flex gap-2 mt-4">
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {loading ? 'Сохранение...' : 'Сохранить'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Список праздников */}
                        {loading && holidays.length === 0 ? (
                            <div className="text-center py-8">Загрузка...</div>
                        ) : filteredHolidays.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                {holidays.length === 0
                                    ? 'Праздники не найдены. Создайте первый праздник.'
                                    : 'Ничего не найдено по запросу'}
                            </div>
                        ) : (
                            <div className="max-h-[600px] overflow-y-auto border rounded">
                                <table className="min-w-full bg-white">
                                    <thead className="sticky top-0 bg-gray-100">
                                        <tr>
                                            <th className="py-2 px-4 border-b text-black text-left w-[20%]">Название (RU)</th>
                                            <th className="py-2 px-4 border-b text-black text-left w-[20%]">Название (TT)</th>
                                            <th className="py-2 px-4 border-b text-black text-center w-[15%]">Дата начала</th>
                                            <th className="py-2 px-4 border-b text-black text-center w-[15%]">Дата окончания</th>
                                            <th className="py-2 px-4 border-b text-black text-center w-[10%]">Включено</th>
                                            <th className="py-2 px-4 border-b text-black w-[20%]">Действия</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredHolidays.map((holiday) => (
                                            <tr key={holiday.id} className="hover:bg-gray-50">
                                                <td className="py-2 px-4 border-b text-black">
                                                    {holiday.nameRu}
                                                </td>
                                                <td className="py-2 px-4 border-b text-black">
                                                    {holiday.nameTatar}
                                                </td>
                                                <td className="py-2 px-4 border-b text-black text-center">
                                                    {holiday.startDate}
                                                </td>
                                                <td className="py-2 px-4 border-b text-black text-center">
                                                    {holiday.endDate || <span className="text-gray-400">—</span>}
                                                </td>
                                                <td className="py-2 px-4 border-b text-black text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={holiday.isEnabled}
                                                        onChange={() => handleToggleEnabled(holiday.id, holiday.isEnabled)}
                                                        disabled={loading || editingId !== null || isCreating}
                                                        className="w-5 h-5 cursor-pointer disabled:cursor-not-allowed"
                                                    />
                                                </td>
                                                <td className="py-2 px-4 border-b text-black">
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleEdit(holiday)}
                                                            disabled={loading || editingId !== null || isCreating}
                                                            className="text-yellow-600 hover:text-yellow-800 text-xs disabled:text-gray-400 disabled:cursor-not-allowed"
                                                        >
                                                            Редактировать
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(holiday.id)}
                                                            disabled={loading || editingId !== null || isCreating}
                                                            className="text-red-600 hover:text-red-800 text-xs disabled:text-gray-400 disabled:cursor-not-allowed"
                                                        >
                                                            Удалить
                                                        </button>
                                                    </div>
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
                        {userRole !== 'MOSQUE_ADMIN' ? 'Выберите мечеть для управления праздниками' : 'Загрузка...'}
                    </div>
                )}
            </div>
        </div>
    );
};

export default HolidaysPage;
