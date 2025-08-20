import type { DictionaryEntry, UpsertDictionaryEntryDto } from '@/types/dictionary.types'

type CombinedEntry = { key: string; ru: string; tt: string }

const STORAGE_KEY = 'dictionary_entries_v1'

async function loadFromPublic(): Promise<CombinedEntry[]> {
    if (typeof window === 'undefined') return []
    try {
        const res = await fetch('/dictionary.json', { cache: 'no-cache' })
        if (!res.ok) return []
        const json = await res.json()
        return Array.isArray(json?.entries) ? json.entries as CombinedEntry[] : []
    } catch {
        return []
    }
}

function readLocal(): CombinedEntry[] {
    if (typeof window === 'undefined') return []
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed as CombinedEntry[] : []
    } catch {
        return []
    }
}

function writeLocal(entries: CombinedEntry[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}

function toFlat(entries: CombinedEntry[]): DictionaryEntry[] {
    const result: DictionaryEntry[] = []
    let idCounter = 1
    for (const e of entries) {
        result.push({ id: idCounter++, key: e.key, locale: 'ru', value: e.ru })
        result.push({ id: idCounter++, key: e.key, locale: 'tt', value: e.tt })
    }
    return result
}

export const dictionaryService = {
    async getAll(): Promise<DictionaryEntry[]> {
        // Загружаем оба источника и МЕРДЖИМ: public -> base, local -> overrides
        const [publicEntries, localEntries] = await Promise.all([
            loadFromPublic(),
            Promise.resolve(readLocal()),
        ])

        // Если локального нет — используем public и сразу кэшируем
        if (localEntries.length === 0) {
            if (publicEntries.length > 0) writeLocal(publicEntries)
            return toFlat(publicEntries)
        }

        // Мёрдж по ключу: берём все ключи из public, затем дополняем/переопределяем локальными
        const map = new Map<string, CombinedEntry>()
        for (const e of publicEntries) map.set(e.key, { key: e.key, ru: e.ru || '', tt: e.tt || '' })
        for (const e of localEntries) {
            const prev = map.get(e.key) || { key: e.key, ru: '', tt: '' }
            map.set(e.key, { key: e.key, ru: e.ru ?? prev.ru, tt: e.tt ?? prev.tt })
        }

        const merged = Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
        writeLocal(merged)
        return toFlat(merged)
    },

    async getByKey(key: string): Promise<DictionaryEntry[]> {
        const all = await this.getAll()
        return all.filter(e => e.key === key)
    },

    async upsert(payload: UpsertDictionaryEntryDto): Promise<DictionaryEntry> {
        const current = readLocal()
        const idx = current.findIndex(e => e.key === payload.key)
        if (idx === -1) {
            const created: CombinedEntry = { key: payload.key, ru: '', tt: '' }
            if (payload.locale === 'ru') created.ru = payload.value
            if (payload.locale === 'tt') created.tt = payload.value
            current.push(created)
        } else {
            if (payload.locale === 'ru') current[idx].ru = payload.value
            if (payload.locale === 'tt') current[idx].tt = payload.value
        }
        writeLocal(current)
        // Return the just-updated entry in flat form
        const updated = (await this.getByKey(payload.key)).find(e => e.locale === payload.locale)!
        return updated
    },

    async delete(key: string): Promise<void> {
        const current = readLocal()
        const next = current.filter(e => e.key !== key)
        writeLocal(next)
    },
}

export type { DictionaryEntry }


