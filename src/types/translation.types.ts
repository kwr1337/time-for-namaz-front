export interface Translation {
    key: string;
    ru: string;
    tt: string;
}

export interface TranslationsResponse {
    entries: Translation[];
    translationsEnabled?: boolean;
}

export interface MosqueLanguageSettings {
    id: number;
    mosqueId: number;
    translationsEnabled: boolean;
    languageToggleEnabled: boolean;
    languageToggleIntervalSeconds: number;
    createdAt: string;
    updatedAt: string;
    mosqueName: string;
    cityName: string;
}

export interface UpdateMosqueLanguageSettingsDto {
    translationsEnabled?: boolean;
    languageToggleEnabled?: boolean;
    languageToggleIntervalSeconds?: number;
}

