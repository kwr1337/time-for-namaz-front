'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { DASHBOARD_PAGES } from '@/config/pages-url.config'
import { dictionaryService } from '@/services/dictionary.service'
import type { DictionaryEntry, DictionaryKeyGroup } from '@/types/dictionary.types'

const locales = [
    { code: 'ru', label: 'Русский' },
    { code: 'tt', label: 'Татарча' },
] as const

const DictionaryPage: React.FC = () => {
    const [entries, setEntries] = useState<DictionaryEntry[]>([])
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const [editingKey, setEditingKey] = useState<string | null>(null)
    const [formValues, setFormValues] = useState<Record<string, string>>({ ru: '', tt: '' })


    const fetchEntries = async () => {
        setLoading(true)
        try {
            const data = await dictionaryService.getAll()
            setEntries(data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchEntries()
    }, [])

    const grouped: DictionaryKeyGroup[] = useMemo(() => {
        const map = new Map<string, DictionaryKeyGroup>()
        for (const e of entries) {
            if (!map.has(e.key)) map.set(e.key, { key: e.key, values: {} })
            map.get(e.key)!.values[e.locale as 'ru' | 'tt'] = e.value
        }
        let list = Array.from(map.values())
        
        // Сортируем по алфавиту
        list.sort((a, b) => a.key.localeCompare(b.key))
        
        if (search.trim()) {
            const q = search.toLowerCase()
            return list.filter(g => g.key.toLowerCase().includes(q) || Object.values(g.values).some(v => (v || '').toLowerCase().includes(q)))
        }
        return list
    }, [entries, search])

    const startEdit = (key: string) => {
        const current = grouped.find(g => g.key === key)
        setEditingKey(key)
        setFormValues({ ru: current?.values.ru || '', tt: current?.values.tt || '' })
    }

    const cancelEdit = () => {
        setEditingKey(null)
        setFormValues({ ru: '', tt: '' })
    }

    const saveKey = async () => {
        if (!editingKey) return
        setLoading(true)
        try {
            await Promise.all(
                locales.map(l =>
                    dictionaryService.upsert({ key: editingKey, locale: l.code, value: formValues[l.code] || '' }),
                ),
            )
            await fetchEntries()
            cancelEdit()
        } finally {
            setLoading(false)
        }
    }



    const handleBack = () => {
        window.location.href = DASHBOARD_PAGES.DASHBOARD
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4 overflow-y-auto max-h-screen">
            <div className="w-full max-w-[1000px] p-6 bg-white rounded-lg shadow-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-700">Словари (RU / TT)</h2>
                    <button onClick={handleBack} className="text-blue-600">Назад</button>
                </div>

                <div className="mb-4 flex gap-2">
                    <input
                        type="text"
                        placeholder="Поиск по ключу или значению"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="border p-2 w-full text-black"
                    />
                </div>



                <div className="max-h-[500px] overflow-y-auto">
                    <table className="min-w-full bg-white">
                        <thead>
                            <tr>
                                <th className="py-2 px-4 border-b text-black text-left">Ключ</th>
                                <th className="py-2 px-4 border-b text-black">Русский</th>
                                <th className="py-2 px-4 border-b text-black">Татарча</th>
                                <th className="py-2 px-4 border-b text-black">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {grouped.map(row => (
                                <tr key={row.key} className="align-top">
                                    <td className="py-2 px-4 border-b text-black text-left w-[30%]">
                                        <div className="font-mono break-words">{row.key}</div>
                                    </td>
                                    <td className="py-2 px-4 border-b text-black w-[30%]">
                                        {editingKey === row.key ? (
                                            <input
                                                type="text"
                                                value={formValues.ru}
                                                onChange={(e) => setFormValues(prev => ({ ...prev, ru: e.target.value }))}
                                                className="border p-2 w-full text-black"
                                            />
                                        ) : (
                                            <div className="whitespace-pre-wrap break-words text-left">{row.values.ru || <span className="text-gray-400">—</span>}</div>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b text-black w-[30%]">
                                        {editingKey === row.key ? (
                                            <input
                                                type="text"
                                                value={formValues.tt}
                                                onChange={(e) => setFormValues(prev => ({ ...prev, tt: e.target.value }))}
                                                className="border p-2 w-full text-black"
                                            />
                                        ) : (
                                            <div className="whitespace-pre-wrap break-words text-left">{row.values.tt || <span className="text-gray-400">—</span>}</div>
                                        )}
                                    </td>
                                    <td className="py-2 px-4 border-b text-black w-[10%]">
                                        {editingKey === row.key ? (
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={saveKey} className="bg-green-600 text-white px-3 py-1 rounded" disabled={loading}>Сохранить</button>
                                                <button onClick={cancelEdit} className="bg-gray-500 text-white px-3 py-1 rounded">Отмена</button>
                                            </div>
                                        ) : (
                                            <div className="flex gap-2 justify-center">
                                                <button onClick={() => startEdit(row.key)} className="text-yellow-600">Редактировать</button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default DictionaryPage


