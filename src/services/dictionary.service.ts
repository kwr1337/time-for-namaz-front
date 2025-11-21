import type { DictionaryEntry, UpsertDictionaryEntryDto } from '@/types/dictionary.types'
import { API_BASE_URL } from '@/config/config'
import type { Translation } from '@/types/translation.types'

type CombinedEntry = { key: string; ru: string; tt: string }

function toFlat(entries: CombinedEntry[]): DictionaryEntry[] {
    const result: DictionaryEntry[] = []
    let idCounter = 1
    for (const e of entries) {
        result.push({ id: idCounter++, key: e.key, locale: 'ru', value: e.ru })
        result.push({ id: idCounter++, key: e.key, locale: 'tt', value: e.tt })
    }
    return result
}

function fromFlat(entries: DictionaryEntry[]): CombinedEntry[] {
    const map = new Map<string, CombinedEntry>()
    for (const e of entries) {
        if (!map.has(e.key)) {
            map.set(e.key, { key: e.key, ru: '', tt: '' })
        }
        const entry = map.get(e.key)!
        if (e.locale === 'ru') entry.ru = e.value
        if (e.locale === 'tt') entry.tt = e.value
    }
    return Array.from(map.values())
}

function fromApiTranslations(translations: Translation[]): CombinedEntry[] {
    return translations.map(t => ({ key: t.key, ru: t.ru, tt: t.tt }))
}

interface TranslationFull {
    id: number;
    key: string;
    ru: string;
    tt: string;
    createdAt: string;
    updatedAt: string;
}

export const dictionaryService = {
    // Получить все переводы (для публичного использования)
    async getAll(): Promise<DictionaryEntry[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/translations/entries`)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const data = await response.json()
            const entries = Array.isArray(data?.entries) ? data.entries as Translation[] : []
            return toFlat(fromApiTranslations(entries))
        } catch (error) {
            console.error('Ошибка при загрузке переводов:', error)
            return []
        }
    },

    // Получить все переводы с полной информацией (для админки)
    async getAllFull(): Promise<TranslationFull[]> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/translations`)
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            return await response.json()
        } catch (error) {
            console.error('Ошибка при загрузке переводов:', error)
            throw error
        }
    },

    async getByKey(key: string): Promise<DictionaryEntry[]> {
        const all = await this.getAll()
        return all.filter(e => e.key === key)
    },

    // Создать новый перевод
    async create(key: string, ru: string, tt: string): Promise<TranslationFull> {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Токен авторизации не найден')
            }

            const response = await fetch(`${API_BASE_URL}/api/translations`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ key, ru, tt })
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }))
                throw new Error(error.message || `HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Ошибка при создании перевода:', error)
            throw error
        }
    },

    // Обновить перевод
    async update(key: string, ru?: string, tt?: string): Promise<TranslationFull> {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Токен авторизации не найден')
            }

            const updates: { ru?: string; tt?: string } = {}
            if (ru !== undefined) updates.ru = ru
            if (tt !== undefined) updates.tt = tt

            const response = await fetch(`${API_BASE_URL}/api/translations/${encodeURIComponent(key)}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(updates)
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }))
                throw new Error(error.message || `HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Ошибка при обновлении перевода:', error)
            throw error
        }
    },

    // Удалить перевод
    async delete(key: string): Promise<TranslationFull> {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Токен авторизации не найден')
            }

            const response = await fetch(`${API_BASE_URL}/api/translations/${encodeURIComponent(key)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }))
                throw new Error(error.message || `HTTP error! status: ${response.status}`)
            }

            return await response.json()
        } catch (error) {
            console.error('Ошибка при удалении перевода:', error)
            throw error
        }
    },

    // Старый метод для совместимости (обновляет оба языка сразу)
    async upsert(payload: UpsertDictionaryEntryDto): Promise<DictionaryEntry> {
        try {
            const token = localStorage.getItem('token')
            if (!token) {
                throw new Error('Токен авторизации не найден')
            }

            // Проверяем, существует ли перевод
            const existing = await this.getByKey(payload.key)
            
            if (existing.length > 0) {
                // Обновляем существующий перевод
                const combined = fromFlat(existing)
                const entry = combined[0]
                
                if (payload.locale === 'ru') {
                    await this.update(payload.key, payload.value, undefined)
                } else {
                    await this.update(payload.key, undefined, payload.value)
                }
            } else {
                // Создаем новый перевод (нужно оба языка)
                const all = await this.getAll()
                const combined = fromFlat(all)
                const existingEntry = combined.find(e => e.key === payload.key)
                
                if (existingEntry) {
                    // Обновляем существующий
                    if (payload.locale === 'ru') {
                        await this.update(payload.key, payload.value, existingEntry.tt)
                    } else {
                        await this.update(payload.key, existingEntry.ru, payload.value)
                    }
                } else {
                    // Создаем новый (требуются оба языка, используем пустую строку для отсутствующего)
                    if (payload.locale === 'ru') {
                        await this.create(payload.key, payload.value, '')
                    } else {
                        await this.create(payload.key, '', payload.value)
                    }
                }
            }

            const updated = (await this.getByKey(payload.key)).find(e => e.locale === payload.locale)!
            return updated
        } catch (error) {
            console.error('Ошибка при сохранении перевода:', error)
            throw error
        }
    },
}

export type { DictionaryEntry }


