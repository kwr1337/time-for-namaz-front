export interface Prayer {
    id: number;
    cityId: number;
    mosqueId?: number;
    date?: string;
    fajr?: string;
    shuruk?: string;
    zuhr?: string;
    asr?: string;
    maghrib?: string;
    isha?: string;
    mechet?: string;
}

export interface FixedMosquePrayerTime {
    id: number;
    mosqueId: number;
    fajr: string;
    shuruk: string;
    zuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    mechet: string;
    fajrActive: boolean;
    shurukActive: boolean;
    zuhrActive: boolean;
    asrActive: boolean;
    maghribActive: boolean;
    ishaActive: boolean;
    mechetActive: boolean;
    fajrIqamaEnabled: boolean;
    fajrIqamaMinutes: number;
    shurukIqamaEnabled: boolean;
    shurukIqamaMinutes: number;
    zuhrIqamaEnabled: boolean;
    zuhrIqamaMinutes: number;
    asrIqamaEnabled: boolean;
    asrIqamaMinutes: number;
    maghribIqamaEnabled: boolean;
    maghribIqamaMinutes: number;
    ishaIqamaEnabled: boolean;
    ishaIqamaMinutes: number;
    mechetIqamaEnabled: boolean;
    mechetIqamaMinutes: number;
    createdAt: string;
    updatedAt: string;
    mosqueName?: string;
    cityName?: string;
}
