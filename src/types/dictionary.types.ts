export type LocaleCode = 'ru' | 'tt'

export interface DictionaryEntry {
    id: number
    key: string
    locale: LocaleCode
    value: string
    updatedAt?: string
    createdAt?: string
}

export interface UpsertDictionaryEntryDto {
    key: string
    locale: LocaleCode
    value: string
}

export interface DictionaryKeyGroup {
    key: string
    values: Partial<Record<LocaleCode, string>>
}


