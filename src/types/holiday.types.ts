export interface Holiday {
    id: number;
    mosqueId: number;
    nameRu: string;
    nameTatar: string;
    startDate: string; // Формат MM-DD
    endDate: string | null; // Формат MM-DD или null
    isEnabled: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateHolidayDto {
    nameRu: string;
    nameTatar: string;
    startDate: string; // Формат MM-DD
    endDate?: string | null; // Формат MM-DD или null
    isEnabled?: boolean;
}

export interface UpdateHolidayDto {
    nameRu?: string;
    nameTatar?: string;
    startDate?: string; // Формат MM-DD
    endDate?: string | null; // Формат MM-DD или null
    isEnabled?: boolean;
}

