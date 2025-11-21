export interface Admin {
    id: number;
    email: string;
    password: string;
    createdAt: Date;
    role: 'SUPER_ADMIN' | 'CITY_ADMIN' | 'MOSQUE_ADMIN';
    cityId?: number;
    mosqueId?: number;
}
