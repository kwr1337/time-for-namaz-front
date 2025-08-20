export interface Admin {
    id: number;
    email: string;
    password: string;
    createdAt: Date;
    role: 'SUPER_ADMIN' | 'CITY_ADMIN';
    cityId?: number;
}
