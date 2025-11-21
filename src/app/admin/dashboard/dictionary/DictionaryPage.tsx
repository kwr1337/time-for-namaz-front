'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { dictionaryService } from '@/services/dictionary.service'
import { API_BASE_URL } from '@/config/config'
import { toast } from 'react-hot-toast'
import axios from 'axios'

interface TranslationFull {
    id: number;
    key: string;
    ru: string;
    tt: string;
    createdAt: string;
    updatedAt: string;
}

interface DictionaryKeyGroup {
    key: string;
    values: { ru: string; tt: string };
}

const DictionaryPage: React.FC = () => {
    const [translations, setTranslations] = useState<TranslationFull[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [formValues, setFormValues] = useState<Record<string, string>>({ ru: '', tt: '' })
    const [userRole, setUserRole] = useState('')

    useEffect(() => {
        fetchUserRole()
        fetchTranslations()
    }, [])

    const fetchUserRole = async () => {
        try {
            const token = localStorage.getItem('token')
            const response = await axios.get(`${API_BASE_URL}/api/admin/me`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setUserRole(response.data.role)
        } catch (error) {
            console.error('Ошибка при получении роли:', error)
        }
    }

    const fetchTranslations = async () => {
        setLoading(true)
        try {
            const data = await dictionaryService.getAllFull()
            setTranslations(data)
        } catch (error: any) {
            console.error('Ошибка при загрузке переводов:', error)
            toast.error(error.message || 'Ошибка при загрузке переводов')
        } finally {
            setLoading(false)
        }
    }

    const grouped: DictionaryKeyGroup[] = useMemo(() => {
        const map = new Map<string, DictionaryKeyGroup>()
        for (const t of translations) {
            if (!map.has(t.key)) {
                map.set(t.key, { key: t.key, values: { ru: t.ru, tt: t.tt } })
            }
        }
        let list = Array.from(map.values())
        
        // Сортируем по алфавиту
        list.sort((a, b) => a.key.localeCompare(b.key))
        
        if (search.trim()) {
            const q = search.toLowerCase()
            return list.filter(g => 
                g.key.toLowerCase().includes(q) || 
                g.values.ru.toLowerCase().includes(q) ||
                g.values.tt.toLowerCase().includes(q)
            )
        }
        return list
    }, [translations, search])

    const startEdit = (key: string) => {
        const current = grouped.find(g => g.key === key)
        setEditingKey(key)
        setFormValues({ ru: current?.values.ru || '', tt: current?.values.tt || '' })
    }

    const cancelEdit = () => {
        setEditingKey(null)
        setFormValues({ ru: '', tt: '' })
    }

    const saveTranslation = async () => {
        if (!editingKey) return

        setLoading(true)
        try {
            await dictionaryService.update(editingKey, formValues.ru, formValues.tt)
            toast.success('Перевод успешно обновлен')
            await fetchTranslations()
            cancelEdit()
        } catch (error: any) {
            console.error('Ошибка при обновлении перевода:', error)
            toast.error(error.message || 'Ошибка при обновлении перевода')
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        window.location.href = DASHBOARD_PAGES.DASHBOARD
    }

    // Проверка доступа только для SUPER_ADMIN
    if (userRole && userRole !== 'SUPER_ADMIN') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
                <div className="w-full max-w-[1000px] p-6 bg-white rounded-lg shadow-md">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-gray-700 mb-4">Доступ запрещен</h2>
                        <p className="text-gray-600 mb-4">У вас нет прав для доступа к этой странице.</p>
                        <button onClick={handleBack} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
                            Назад
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 overflow-y-auto max-h-screen">
            <div className="w-full max-w-[1000px] p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-700">Управление переводами (RU / TT)</h2>
                    <button onClick={handleBack} className="text-blue-600 hover:text-blue-800">Назад</button>
                </div>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Поиск по ключу или значению"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border p-2 w-full text-black rounded"
                    />
                </div>

                {loading && !translations.length ? (
                    <div className="text-center py-8">Загрузка...</div>
                ) : (
                    <div className="max-h-[500px] overflow-y-auto">
                        <table className="min-w-full bg-white">
                            <thead className="sticky top-0 bg-white">
                                <tr>
                                    <th className="py-2 px-4 border-b text-black text-left">Ключ</th>
                                    <th className="py-2 px-4 border-b text-black">Русский</th>
                                    <th className="py-2 px-4 border-b text-black">Татарча</th>
                                    <th className="py-2 px-4 border-b text-black">Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grouped.map(row => (
                                    <tr key={row.key} className="align-top hover:bg-gray-50">
                                        <td className="py-2 px-4 border-b text-black text-left w-[25%]">
                                            <div className="font-mono break-words text-sm">{row.key}</div>
                                        </td>
                                        <td className="py-2 px-4 border-b text-black w-[30%]">
                                            {editingKey === row.key ? (
                                                <input
                                                    type="text"
                                                    value={formValues.ru}
                                                    onChange={(e) => setFormValues(prev => ({ ...prev, ru: e.target.value }))}
                                                    className="border p-2 w-full text-black rounded"
                                                />
                                            ) : (
                                                <div className="whitespace-pre-wrap break-words text-left">
                                                    {row.values.ru || <span className="text-gray-400">—</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-4 border-b text-black w-[30%]">
                                            {editingKey === row.key ? (
                                                <input
                                                    type="text"
                                                    value={formValues.tt}
                                                    onChange={(e) => setFormValues(prev => ({ ...prev, tt: e.target.value }))}
                                                    className="border p-2 w-full text-black rounded"
                                                />
                                            ) : (
                                                <div className="whitespace-pre-wrap break-words text-left">
                                                    {row.values.tt || <span className="text-gray-400">—</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-2 px-4 border-b text-black w-[15%]">
                                            {editingKey === row.key ? (
                                                <div className="flex flex-col gap-2">
                                                    <button
                                                        onClick={saveTranslation}
                                                        disabled={loading}
                                                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:bg-gray-400"
                                                    >
                                                        Сохранить
                                                    </button>
                                                    <button
                                                        onClick={cancelEdit}
                                                        className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                                                    >
                                                        Отмена
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEdit(row.key)}
                                                    className="text-yellow-600 hover:text-yellow-800 text-sm"
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
        </div>
    )
}

export default DictionaryPage
