'use client';

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import asr from '../pic/asr-1.png';
import asr2 from '../pic/asr-2.png';
import fadjr from '../pic/fadjr-1.png';
import phoneIcon from '../pic/phoneIcon.png';
import fadjr2 from '../pic/fadjr-2.png';
import isha from '../pic/isha-1.png';
import isha2 from '../pic/isha-2.png';
import magrib from '../pic/magrib-1.png';
import magrib2 from '../pic/magrib-2.png';
import mosque from '../pic/mosque.png';
import shuruk from '../pic/shuruk-1.png';
import shuruk2 from '../pic/shuruk-2.png';
import zuhr from '../pic/zuhr-1.png';
import zuhr1 from '../pic/zuhr-2.png';
import Image, { StaticImageData } from 'next/image';
import zuhr2 from "@/pic/zuhr-2.png";
import axios from "axios";
import moment from 'moment-hijri';
import namesOfAllah from "@/namesOfAllah/namesOfAllah";
import { API_BASE_URL } from '@/config/config'
import { API } from '@/constants/api.constants';
import { toast } from 'react-hot-toast';
import LogoLoader from '../components/ui/LogoLoader';
import { dictionaryService } from '@/services/dictionary.service'
import { Noto_Sans } from 'next/font/google'
import type { MosqueLanguageSettings } from '@/types/translation.types'
import type { NameOfAllah } from '@/types/names-of-allah.types'
import type { Holiday } from '@/types/holiday.types'

const notoSans = Noto_Sans({
    subsets: ['latin', 'cyrillic'],
    display: 'swap',
})

// Импорт иконок погоды
import sunnyIcon from '../pic/weather/sunny.png'; // Солнечно
import cloudyIcon from '../pic/weather/cloudy.png'; // Облачно
import partlyCloudyIcon from '../pic/weather/partly_cloudy.png'; // Малая облачность
import rainyIcon from '../pic/weather/rainy.png'; // Дождь
import snowyIcon from '../pic/weather/snowy.png'; // Снег
// import stormyIcon from '../pic/weather/stormy.png'; // Гроза - закомментировано, так как файл отсутствует

type PrayerTimeProps = {
    time: string;
    label: string;
    highlight?: boolean;
    pic: StaticImageData;
    pic2: StaticImageData;
    remainingTime: number;
    progress: number;
    className?: string;
    fixedTime?: string | null;
    isFixedTimeActive?: boolean;
    t: (key: string, fallback: string) => string;
    currentLang: 'ru' | 'tt';
    iqama?: IqamaInfo | null; // Информация об икамате
    isIqamaActive?: boolean; // Активен ли икамат сейчас
};

interface PrayerTimes {
    fajr: string;
    shuruk: string;
    zuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    mechet?: string; // Добавлено поле mechet для времени мечети
}

interface IqamaInfo {
    enabled: boolean;
    minutes: number;
}

interface PrayerResponse {
    id: number;
    cityId: number; // Изменен тип с string на number
    date: string;
    fajr: string; // Изменено с fajrStart на fajr
    shuruk: string; // Добавлено поле shuruk
    zuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    mechet?: string; // Добавлено поле mechet для времени мечети
    mosqueName?: string;
    cityName?: string;
    fajrIqama: IqamaInfo | null;
    shurukIqama: IqamaInfo | null;
    zuhrIqama: IqamaInfo | null;
    asrIqama: IqamaInfo | null;
    maghribIqama: IqamaInfo | null;
    ishaIqama: IqamaInfo | null;
    mechetIqama: IqamaInfo | null;
}

interface Mosque {
    id: number;
    cityId: number;
    name: string;
    logoUrl: string | null;
}

interface City {
    id: number;
    name: string;
    logoUrl: string | null;
}

interface WeatherData {
    temperature: number;
    description: string;
    icon: string;
    city: string;
    updatedAt?: string; // Время последнего обновления
}

// Добавляем интерфейс для фиксированного времени намаза мечети
interface FixedPrayerTime {
    id: number;
    mosqueId: number;
    fajr: string;
    shuruk: string;
    zuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
    mechet: string | null;
    fajrActive: boolean;
    shurukActive: boolean;
    zuhrActive: boolean;
    asrActive: boolean;
    maghribActive: boolean;
    ishaActive: boolean;
    mechetActive: boolean;
    createdAt: string;
    updatedAt: string;
    mosqueName?: string;
    cityName?: string;
}

const PrayerTime: React.FC<PrayerTimeProps> = ({ time, label, highlight, pic, pic2, remainingTime, progress, className = '', fixedTime, isFixedTimeActive = false, t, currentLang, iqama = null, isIqamaActive = false }) => {
    // Определяем цвет карточки: желтый для икамата, зеленый для обычного активного
    const getCardColor = () => {
        if (isIqamaActive) return 'bg-[#F7C948]'; // Желтый для икамата
        return 'bg-[#5ec262]'; // Зеленый для обычного активного
    };

    return (
        <div
            className={`relative 
                tv1:w-[140px] tv1:h-[230px] 
                tv:w-[150px] tv:h-[280px]
                pc1:w-[190px] pc1:h-[272x]
                pc:w-[229px] pc:h-[349px]
                md-max:w-[140px] md-max:h-[220px] 
                sm-max:w-[120px] sm-max:h-[200px]
                rounded-[20px] p-[20px] flex flex-col justify-start items-start transition-all duration-300 ease-in-out sm-max:mx-auto
                md-max:p-[15px] sm-max:p-[12px]
                    ${highlight
                    ? `${(isFixedTimeActive ? '' : '')} ${/* цвет по умолчанию для highlight */''} ${className} ${(isFixedTimeActive ? '' : '')} ${getCardColor()} transform text-white !h-[429px] !w-[353px]  pc:!w-[353px] pc:!h-[429px] pc1:!w-[283px]  pc1:!h-[352px] tv:!h-[342px] tv:!w-[243px]  tv1:!h-[302px] tv1:!w-[203px] md-max:!h-[320px] md-max:!w-[240px] sm-max:!h-[270px] sm-max:!w-[200px] pc: pt-[20px] pr-[20px] pl-[20px] pb-[20px] flex justify-between`
                    : `bg-white justify-between ${className}`}
            `}
        >
            <div className="w-full flex justify-between items-center">
                <div className={`
                    max-w-[80px] max-h-[80px]
                    pc1:max-w-[100px] pc1:max-h-[100px]
                    tv:max-w-[70px] tv:max-h-[70px]
                    tv1:max-w-[60px] tv1:max-h-[60px]
                    md-max:max-w-[60px] md-max:max-h-[60px]
                    sm-max:max-w-[50px] sm-max:max-h-[50px]
                    ${highlight ? '!max-w-[120px] !max-h-[120px] pc1:!max-w-[130px] pc1:!max-h-[130px] tv:!max-w-[90px] tv:!max-h-[90px] tv1:!max-w-[70px] tv1:!max-h-[70px] md-max:!max-w-[80px] md-max:!max-h-[80px] sm-max:!max-w-[70px] sm-max:!max-h-[70px]' : 'text-[#17181d]'} flex bg-transparent`}>
                    <Image
                        className={highlight ? 'mt-0' : 'max-w-full max-h-full object-contain'}
                        src={highlight ? pic2 : pic}
                        alt={label}
                    />
                </div>

                {isFixedTimeActive && (
                    <div className="absolute top-2 right-2 flex items-center">
                        {/* ... */}
                    </div>
                )}

                {highlight && (
                    <div className="absolute pc:max-w-[175px] pc1:max-w-[155px] tv:max-w-[125px] tv1:max-w-[105px] md-max:max-w-[110px] sm-max:max-w-[90px] h-[112px] right-[4px] top-[4px] flex flex-col items-end">
                        <div className="w-[100%] text-right bg-white rounded-bl-[40px] rounded-[8px] rounded-tr-[19px] py-[4px] px-[8px] flex flex-col">
                            <div className={`text-[#17181d] font-normal break-words overflow-wrap-anywhere ${currentLang === 'tt' ? 'pc:text-[18px] tv:text-[14px] tv1:text-[10px] md-max:text-[12px] sm-max:text-[10px]' : 'pc:text-[22px] tv:text-[16px] tv1:text-[12px] md-max:text-[14px] sm-max:text-[12px]'}`}>
                                {isIqamaActive ? t('time.now', 'Сейчас') : t('time.until', 'Через')}
                            </div>
                            {!isIqamaActive && (
                                <div className={`text-[#17181d] font-bold break-all overflow-wrap-anywhere ${currentLang === 'tt' ? 'text-[24px] pc:text-[24px] pc1:text-[20px] tv:text-[16px] tv1:text-[14px] md-max:text-[18px] sm-max:text-[14px]' : 'text-[30px] pc:text-[30px] pc1:text-[25px] tv:text-[20px] tv1:text-[18px] md-max:text-[22px] sm-max:text-[18px]'}`}>
                                    {formatTime(remainingTime, t)}
                                </div>
                            )}
                            {isIqamaActive && iqama && (
                                <div className={`text-[#17181d] font-normal break-words overflow-wrap-anywhere ${currentLang === 'tt' ? 'pc:text-[14px] tv:text-[12px] tv1:text-[9px] md-max:text-[10px] sm-max:text-[8px]' : 'pc:text-[16px] tv:text-[14px] tv1:text-[10px] md-max:text-[12px] sm-max:text-[10px]'}`}>
                                    {t('time.iqama', 'Икамат')}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-start mt-[15%] w-full md-max:mt-[10%] sm-max:mt-[5%]">
                {isFixedTimeActive && fixedTime && (
                    <div className={`text-center text-[60px] pc:text-[60px] pc1:text-[50px] tv:text-[40px] tv1:text-[35px] md-max:text-[42px] sm-max:text-[36px] leading-none font-[700] ${highlight ? 'text-white !text-[60px] pc:!text-[60px] pc1:!text-[55px] tv:!text-[50px] tv1:!text-[45px] md-max:!text-[48px] sm-max:!text-[40px]' : 'text-[#17181d]'}`}>
                        {fixedTime}*
                    </div>
                )}

                <div className={`text-center ${isFixedTimeActive && fixedTime ? 'text-[40px] pc:text-[40px] pc1:text-[35px] tv:text-[30px] tv1:text-[25px]' : 'text-[60px] pc:text-[60px] pc1:text-[50px] tv:text-[40px] tv1:text-[35px]'} leading-none font-[700] 
                    ${isFixedTimeActive && fixedTime ? 'md-max:text-[32px] sm-max:text-[28px]' : 'md-max:text-[46px] sm-max:text-[40px]'}
                    ${highlight ? `text-white ${isFixedTimeActive && fixedTime ? '!text-[40px] pc:!text-[40px] pc1:!text-[35px] tv:!text-[30px] tv1:!text-[25px] md-max:!text-[32px] sm-max:!text-[28px]' : '!text-[60px] pc:!text-[60px] pc1:!text-[55px] tv:!text-[50px] tv1:!text-[45px] md-max:!text-[48px] sm-max:!text-[40px]'}` : 'text-[#17181d]'}`}>
                    {time}
                </div>

                <div className={`text-center text-[40px] tv:text-[25px] tv1:text-[20px] md-max:text-[28px] sm-max:text-[24px] font-[400] ${highlight ? 'text-white !text-[48px] pc:!text-[48px] tv:!text-[35px] tv1:!text-[30px] md-max:!text-[34px] sm-max:!text-[28px]' : 'text-[#17181d]'}`}>{label}</div>

                {highlight && (
                    <div className="w-full flex flex-col items-start justify-between mt-[20px] md-max:mt-[15px] sm-max:mt-[10px]">
                        <div className="w-full h-[8px] bg-[rgba(255,255,255,0.2)] rounded-full sm-max:h-[6px]">
                            <div
                                className="h-full bg-white rounded-full transition-all duration-1000"
                                style={{
                                    width: `${progress}%`,
                                    animation: 'pulseAndGrow 1s ease-in-out infinite alternate',
                                }}
                            ></div>
                        </div>
                        <style jsx>{`
                            @keyframes pulseAndGrow {
                                0% {
                                    opacity: 0.4;
                                    transform: scaleY(1);
                                }
                                100% {
                                    opacity: 1;
                                    transform: scaleY(1.5);
                                }
                            }
                        `}</style>
                    </div>
                )}
            </div>
        </div>
    );
};

const calculateTimeDifference = (targetTime: string): number => {
    const currentTime = new Date();
    currentTime.setSeconds(0, 0);

    const [hours, minutes] = targetTime.split(':').map(Number);
    const targetDateTime = new Date(currentTime);
    targetDateTime.setHours(hours, minutes, 0, 0);

    const difference = targetDateTime.getTime() - currentTime.getTime();
    return Math.max(difference, 0);
};

const formatTime = (milliseconds: number, t: (key: string, fallback: string) => string): string => {
    const totalMinutes = Math.round(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours} ${t('time.hour', 'ч')} ${minutes} ${t('time.min', 'мин')}`.trim();
    }
    return `${minutes} ${t('time.min', 'мин')}${t('time.from', '')}`.trim();
};

const calculateProgress = (remainingTime: number, totalDuration: number): number => {
    // Если нет активного намаза или totalDuration равно 0, возвращаем 0
    if (totalDuration === 0 || remainingTime === 0) {
        return 0;
    }

    // Вычисляем пройденное время
    const elapsedTime = totalDuration - remainingTime;
    // Возвращаем процент прогресса
    return Math.min((elapsedTime / totalDuration) * 100, 100);
};

// Заменяем компоненты SVG на компоненты с изображениями
const WeatherIcon = ({ iconType }: { iconType: string }) => {
    let iconSrc;

    // Определяем, какую иконку использовать
    switch (iconType) {
        case 'sunny':
            iconSrc = sunnyIcon;
            break;
        case 'cloudy':
            iconSrc = cloudyIcon;
            break;
        case 'partly_cloudy':
            iconSrc = partlyCloudyIcon;
            break;
        case 'rainy':
            iconSrc = rainyIcon;
            break;
        case 'snowy':
            iconSrc = snowyIcon;
            break;
        case 'stormy':
            iconSrc = rainyIcon; // Используем rainyIcon вместо stormyIcon, так как файл отсутствует
            break;
        default:
            iconSrc = sunnyIcon; // По умолчанию
    }

    return (
        <Image
            src={iconSrc}
            alt={`Weather icon: ${iconType}`}
            width={24}
            height={24}
            className="weather-icon"
        />
    );
};

// Заменяем функцию mapWeatherCodeToIcon для использования нового компонента
const mapWeatherCodeToIcon = (code: string) => {
    const codeNum = parseInt(code);

    // Солнечно
    if (codeNum === 1000) return <WeatherIcon iconType="sunny" />;

    // Облачно
    if ([1003, 1006, 1009, 1030, 1135, 1147].includes(codeNum)) return <WeatherIcon iconType="cloudy" />;

    // Дождь
    if ([1063, 1069, 1072, 1150, 1153, 1168, 1171, 1180, 1183, 1186, 1189, 1192, 1195, 1198, 1201, 1240, 1243, 1246].includes(codeNum))
        return <WeatherIcon iconType="rainy" />;

    // Гроза
    if ([1087, 1273, 1276, 1279, 1282].includes(codeNum)) return <WeatherIcon iconType="stormy" />;

    // Снег
    if ([1066, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1255, 1258, 1261, 1264].includes(codeNum))
        return <WeatherIcon iconType="snowy" />;

    // По умолчанию
    return <WeatherIcon iconType="sunny" />;
};

// Преобразование кодов погоды OpenWeatherMap в наши внутренние коды
const mapOpenWeatherCodeToInternalCode = (openWeatherCode: string) => {
    const code = parseInt(openWeatherCode);

    // Ясно, солнечно
    if (code >= 800 && code <= 801) return '1000';

    // Облачно
    if (code >= 802 && code <= 804) return '1003';

    // Туман
    if (code >= 700 && code <= 799) return '1030';

    // Дождь
    if (code >= 300 && code <= 599) return '1183';

    // Гроза
    if (code >= 200 && code <= 299) return '1087';

    // Снег
    if (code >= 600 && code <= 699) return '1213';

    // По умолчанию - солнечно
    return '1000';
};

const DigitalClock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const [blink, setBlink] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setTime(new Date());
            setBlink(prev => !prev);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    const seconds = String(time.getSeconds()).padStart(2, '0');

    return (
        <div className="flex items-center justify-center">
            <span className="text-[52px] pc1:text-[52px] pc2:text-[42px] tv1:text-[32px] break-all overflow-wrap-anywhere">{hours}</span>
            <span style={{ opacity: blink ? 1 : 0.2, transition: 'opacity 0.2s' }} className="text-[52px] pc1:text-[52px] pc2:text-[42px] tv1:text-[32px]">:</span>
            <span className="text-[52px] pc1:text-[52px] pc2:text-[42px] tv1:text-[32px] break-all overflow-wrap-anywhere">{minutes}</span>
            <span style={{ opacity: blink ? 1 : 0.2, transition: 'opacity 0.2s', marginLeft: 1 }} className="text-[32px] font-normal pc1:text-[32px] pc2:text-[22px] tv1:text-[16px] mt-[14px]">:</span>
            <span className="text-[32px] font-normal pc1:text-[32px] pc2:text-[22px] tv1:text-[16px] mt-[14px] break-all overflow-wrap-anywhere">{seconds}</span>
        </div>
    );
};

export function Test() {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [regularPrayerTimes, setRegularPrayerTimes] = useState<PrayerTimes | null>(null); // Обычное время без учета фиксированного
    const [fixedPrayerTimes, setFixedPrayerTimes] = useState<FixedPrayerTime | null>(null);
    const [iqamaData, setIqamaData] = useState<Record<string, IqamaInfo | null>>({}); // Данные об икамате для каждого намаза
    const [nearestPrayer, setNearestPrayer] = useState<string>('');
    const [activePrayer, setActivePrayer] = useState<string>(''); // с учетом икамата
    const [isIqamaPeriod, setIsIqamaPeriod] = useState<boolean>(false); // Период икамата (желтый цвет)
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [cities, setCities] = useState<City[]>([]);
    const [currentCityId, setCurrentCityId] = useState<number | null>(() => {
        if (typeof window !== 'undefined') {
            const savedCityId = localStorage.getItem('currentCityId');
            return savedCityId ? parseInt(savedCityId) : 1;
        }
        return 1;
    });
    const [currentMosqueId, setCurrentMosqueId] = useState<number | null>(() => {
        if (typeof window !== 'undefined') {
            const savedMosqueId = localStorage.getItem('currentMosqueId');
            return savedMosqueId ? parseInt(savedMosqueId) : null;
        }
        return null;
    });
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedCity') || 'Казань';
        }
        return 'Казань';
    });
    const [selectedMosque, setSelectedMosque] = useState<string>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('selectedMosque') || '';
        }
        return '';
    });
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secondaryQrCode, setSecondaryQrCode] = useState<string | null>(null);
    const [secondaryQrProjectName, setSecondaryQrProjectName] = useState<string | null>(null);
    const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
    const [mosqueDropdownOpen, setMosqueDropdownOpen] = useState<boolean>(false);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
    const [currentNameIndex, setCurrentNameIndex] = useState<number>(0);
    const [namesOfAllahFromApi, setNamesOfAllahFromApi] = useState<NameOfAllah[]>([]);
    const [currentName, setCurrentName] = useState<NameOfAllah | null>(null);
    const [allahLang, setAllahLang] = useState<'ru' | 'tt'>('ru')
    
    // Функция для преобразования локального формата в формат API
    const convertLocalToApiFormat = (localName: any, mosqueId: number = 0, index: number = 0): NameOfAllah => {
        return {
            id: index,
            mosqueId: mosqueId,
            arabic: localName.arabic,
            transcription: localName.transcription,
            meaning: localName.meaning,
            transcriptionTatar: localName.transcriptionTatar,
            meaningTatar: localName.meaningTatar,
            createdAt: '',
            updatedAt: ''
        };
    };
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const mosqueDropdownRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [prayerLang, setPrayerLang] = useState<'ru' | 'tt'>('ru');
    const [dictionaryMap, setDictionaryMap] = useState<Record<string, { ru: string; tt: string }>>({})
    const [languageSettings, setLanguageSettings] = useState<{
        translationsEnabled: boolean;
        languageToggleEnabled: boolean;
        languageToggleIntervalSeconds: number;
        fridayZuhrAsJomgaEnabled?: boolean;
    } | null>(null);
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [nearestHoliday, setNearestHoliday] = useState<{ holiday: Holiday; daysUntil: number } | null>(null);

    // Загрузка имен Аллаха из API для текущей мечети
    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!currentMosqueId) {
                // Если мечеть не выбрана, используем локальные данные как fallback
                if (isMounted && namesOfAllah.length > 0) {
                    setNamesOfAllahFromApi([]);
                    setCurrentName(convertLocalToApiFormat(namesOfAllah[0], 0, 0));
                }
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/names-of-allah/mosque/${currentMosqueId}`);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                if (isMounted) {
                    if (Array.isArray(data) && data.length > 0) {
                        // Фильтруем только включенные имена (isEnabled === true или undefined для обратной совместимости)
                        const enabledNames = data.filter(name => name.isEnabled !== false);
                        // Используем данные из API (только включенные)
                        setNamesOfAllahFromApi(enabledNames);
                        if (enabledNames.length > 0) {
                            setCurrentName(enabledNames[0]);
                            setCurrentNameIndex(0);
                        }
                    } else {
                        // Если API вернул пустой массив, используем локальные данные как fallback
                        setNamesOfAllahFromApi([]);
                        if (namesOfAllah.length > 0) {
                            setCurrentName(convertLocalToApiFormat(namesOfAllah[0], currentMosqueId, 0));
                            setCurrentNameIndex(0);
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка при загрузке имен Аллаха:', error);
                // При ошибке используем локальные данные как fallback
                if (isMounted && namesOfAllah.length > 0) {
                    setNamesOfAllahFromApi([]);
                    setCurrentName(convertLocalToApiFormat(namesOfAllah[0], currentMosqueId || 0, 0));
                    setCurrentNameIndex(0);
                }
            }
        })();
        return () => { isMounted = false; };
    }, [currentMosqueId]);

    // Интервал для обновления имени Аллаха каждые 30 секунд
    useEffect(() => {
        // Используем данные из API, если они есть, иначе локальные данные
        const namesToUse = namesOfAllahFromApi.length > 0 
            ? namesOfAllahFromApi 
            : namesOfAllah.map((localName, index) => convertLocalToApiFormat(localName, currentMosqueId || 0, index));
        
        if (namesToUse.length === 0 || !currentName) return;

        const nameInterval = setInterval(() => {
            const nextIndex = (currentNameIndex + 1) % namesToUse.length;
            setCurrentNameIndex(nextIndex);
            setCurrentName(namesToUse[nextIndex]);
        }, 30000); // 30 секунд

        return () => clearInterval(nameInterval);
    }, [currentNameIndex, namesOfAllahFromApi, currentMosqueId, currentName]);

    // Переключение языка блока Имен Аллаха с учетом настроек мечети
    useEffect(() => {
        // Переключение работает только если переводы включены И переключение языков включено
        if (!languageSettings?.translationsEnabled || !languageSettings?.languageToggleEnabled) {
            // Если переводы или переключение выключены, не создаем интервал
            return
        }
        
        const intervalSeconds = languageSettings.languageToggleIntervalSeconds || 30
        const interval = setInterval(() => {
            setAllahLang(prev => (prev === 'ru' ? 'tt' : 'ru'))
        }, intervalSeconds * 1000)
        
        return () => clearInterval(interval)
    }, [languageSettings?.translationsEnabled, languageSettings?.languageToggleEnabled, languageSettings?.languageToggleIntervalSeconds])

    // Загрузка настроек языков мечети
    useEffect(() => {
        let isMounted = true
        ;(async () => {
            if (!currentMosqueId) {
                if (isMounted) {
                    setLanguageSettings(null)
                    // Сбрасываем язык на русский, если мечеть не выбрана
                    setPrayerLang('ru')
                    setAllahLang('ru')
                }
                return
            }
            try {
                const response = await fetch(`${API_BASE_URL}/api/mosque-language-settings/mosque/${currentMosqueId}`)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                if (isMounted) {
                    const newSettings = {
                        translationsEnabled: data.translationsEnabled ?? true,
                        languageToggleEnabled: data.languageToggleEnabled ?? false,
                        languageToggleIntervalSeconds: data.languageToggleIntervalSeconds ?? 30,
                        fridayZuhrAsJomgaEnabled: data.fridayZuhrAsJomgaEnabled ?? false
                    }
                    setLanguageSettings(newSettings)
                    
                    // Если переводы выключены, сбрасываем язык на русский
                    if (!newSettings.translationsEnabled) {
                        setPrayerLang('ru')
                        setAllahLang('ru')
                    }
                }
            } catch (e) {
                console.error('Ошибка при загрузке настроек языков:', e)
                // Устанавливаем значения по умолчанию
                if (isMounted) {
                    setLanguageSettings({
                        translationsEnabled: true,
                        languageToggleEnabled: false,
                        languageToggleIntervalSeconds: 30,
                        fridayZuhrAsJomgaEnabled: false
                    })
                }
            }
        })()
        return () => { isMounted = false }
    }, [currentMosqueId])

    // Переключение языка подписей намазов с учетом настроек мечети
    useEffect(() => {
        // Переключение работает только если переводы включены И переключение языков включено
        if (!languageSettings?.translationsEnabled || !languageSettings?.languageToggleEnabled) {
            // Если переводы или переключение выключены, не создаем интервал
            return
        }
        
        const intervalSeconds = languageSettings.languageToggleIntervalSeconds || 30
        const interval = setInterval(() => {
            setPrayerLang(prev => (prev === 'ru' ? 'tt' : 'ru'))
        }, intervalSeconds * 1000)
        
        return () => clearInterval(interval)
    }, [languageSettings?.translationsEnabled, languageSettings?.languageToggleEnabled, languageSettings?.languageToggleIntervalSeconds])

    // Загрузка словаря и сборка карты ключ -> {ru, tt} для конкретной мечети
    useEffect(() => {
        let isMounted = true
        ;(async () => {
            if (!currentMosqueId) {
                if (isMounted) setDictionaryMap({})
                return
            }
            try {
                // Загружаем переводы для конкретной мечети
                const response = await fetch(`${API_BASE_URL}/api/translations/entries/mosque/${currentMosqueId}`)
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`)
                }
                const data = await response.json()
                
                // Проверяем, включены ли переводы для этой мечети
                if (!data.translationsEnabled) {
                    if (isMounted) setDictionaryMap({})
                    return
                }
                
                // Преобразуем формат API в формат словаря
                const map: Record<string, { ru: string; tt: string }> = {}
                if (Array.isArray(data.entries)) {
                    for (const entry of data.entries) {
                        map[entry.key] = { ru: entry.ru || '', tt: entry.tt || '' }
                    }
                }
                
                if (isMounted) setDictionaryMap(map)
            } catch (e) {
                console.error('Ошибка при загрузке переводов:', e)
                if (isMounted) setDictionaryMap({})
            }
        })()
        return () => { isMounted = false }
    }, [currentMosqueId])

    // Загрузка праздников для текущей мечети
    useEffect(() => {
        let isMounted = true;
        (async () => {
            if (!currentMosqueId) {
                if (isMounted) {
                    setHolidays([]);
                    setNearestHoliday(null);
                }
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/mosques/${currentMosqueId}/holidays`);
                if (!response.ok) {
                    if (response.status === 404) {
                        if (isMounted) {
                            setHolidays([]);
                            setNearestHoliday(null);
                        }
                        return;
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                
                if (isMounted) {
                    // Фильтруем только включенные праздники
                    const enabledHolidays = Array.isArray(data) ? data.filter((h: Holiday) => h.isEnabled) : [];
                    setHolidays(enabledHolidays);
                    
                    // Вычисляем ближайший праздник
                    const today = new Date();
                    today.setHours(0, 0, 0, 0); // Устанавливаем время на начало дня
                    const currentYear = today.getFullYear();
                    let nearest: { holiday: Holiday; daysUntil: number } | null = null;
                    
                    for (const holiday of enabledHolidays) {
                        const [startMonth, startDay] = holiday.startDate.split('-').map(Number);
                        const startDate = new Date(currentYear, startMonth - 1, startDay);
                        startDate.setHours(0, 0, 0, 0);
                        
                        // Проверяем, не начался ли праздник уже
                        let holidayStartDate = startDate;
                        if (holidayStartDate < today) {
                            // Если праздник уже прошел в этом году, проверяем следующий год
                            holidayStartDate = new Date(currentYear + 1, startMonth - 1, startDay);
                            holidayStartDate.setHours(0, 0, 0, 0);
                        }
                        
                        // Если праздник уже начался сегодня или раньше, проверяем период праздника
                        if (startDate <= today) {
                            // Если есть дата окончания, проверяем, не закончился ли праздник
                            if (holiday.endDate) {
                                const [endMonth, endDay] = holiday.endDate.split('-').map(Number);
                                const endDate = new Date(currentYear, endMonth - 1, endDay);
                                endDate.setHours(0, 0, 0, 0);
                                
                                // Если текущая дата находится в промежутке праздника, пропускаем его
                                if (today >= startDate && today <= endDate) {
                                    continue; // Праздник идет сейчас, не показываем
                                }
                                
                                // Если праздник закончился в этом году, проверяем следующий год
                                if (endDate < today) {
                                    const nextYearStartDate = new Date(currentYear + 1, startMonth - 1, startDay);
                                    nextYearStartDate.setHours(0, 0, 0, 0);
                                    holidayStartDate = nextYearStartDate;
                                }
                            } else {
                                // Однодневный праздник - если он сегодня, пропускаем
                                if (startDate.getTime() === today.getTime()) {
                                    continue; // Праздник сегодня, не показываем
                                }
                            }
                        }
                        
                        const daysUntil = Math.ceil((holidayStartDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                        
                        // Показываем только будущие праздники (daysUntil > 0)
                        if (daysUntil > 0 && (!nearest || daysUntil < nearest.daysUntil)) {
                            nearest = { holiday, daysUntil };
                        }
                    }
                    
                    setNearestHoliday(nearest);
                }
            } catch (error) {
                console.error('Ошибка при загрузке праздников:', error);
                if (isMounted) {
                    setHolidays([]);
                    setNearestHoliday(null);
                }
            }
        })();
        return () => { isMounted = false; };
    }, [currentMosqueId]);

    const t = (key: string, fallback: string) => {
        // Если переводы выключены для мечети, возвращаем fallback
        if (languageSettings && !languageSettings.translationsEnabled) {
            return fallback
        }
        
        const item = dictionaryMap[key]
        if (!item) return fallback
        return (prayerLang === 'ru' ? item.ru : item.tt) || fallback
    }

    // Функция для перевода фраз праздников - работает независимо от translationsEnabled
    const tHoliday = (key: string, fallbackRu: string, fallbackTt: string) => {
        const item = dictionaryMap[key]
        if (item) {
            return (prayerLang === 'ru' ? item.ru : item.tt) || (prayerLang === 'ru' ? fallbackRu : fallbackTt)
        }
        return prayerLang === 'ru' ? fallbackRu : fallbackTt
    }

    // Обновляем день недели каждую минуту, чтобы при переходе через полночь обновлялось название
    const [currentDay, setCurrentDay] = useState(new Date().getDay());
    useEffect(() => {
        const interval = setInterval(() => {
            const newDay = new Date().getDay();
            if (newDay !== currentDay) {
                setCurrentDay(newDay);
            }
        }, 60000); // Проверяем каждую минуту
        
        return () => clearInterval(interval);
    }, [currentDay]);

    // Вычисляем метки намазов с учетом дня недели и настроек
    // Пересчитываем при изменении настроек, языка или дня недели
    const prayerLabels = useMemo(() => {
        // Проверяем, является ли сегодня пятницей и включена ли настройка
        const isFriday = currentDay === 5; // 5 = пятница (0 = воскресенье)
        const shouldShowJomga = isFriday && (languageSettings?.fridayZuhrAsJomgaEnabled === true);
        
        return {
            fajr: t('prayer.fajr', 'Фаджр'),
            shuruk: t('prayer.shuruk', 'Шурук'),
            zuhr: shouldShowJomga ? t('prayer.jomga', 'Жомга') : t('prayer.zuhr', 'Зухр'),
            asr: t('prayer.asr', 'Аср'),
            maghrib: t('prayer.maghrib', 'Магриб'),
            isha: t('prayer.isha', 'Иша'),
            mechet: t('prayer.mechet', 'Мечеть'),
        };
    }, [languageSettings?.fridayZuhrAsJomgaEnabled, prayerLang, dictionaryMap, currentDay, t]);

    // Функция для проверки, идет ли сейчас икамат
    const isIqamaCurrentlyActive = (prayerTime: string, iqamaMinutes: number): boolean => {
        if (!prayerTime || prayerTime === '00:00' || !prayerTime.includes(':')) return false;
        
        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();
        
        const [prayerHours, prayerMins] = prayerTime.split(':').map(Number);
        if (isNaN(prayerHours) || isNaN(prayerMins)) return false;
        
        const prayerTotalMinutes = prayerHours * 60 + prayerMins;
        const iqamaEndMinutes = prayerTotalMinutes + iqamaMinutes;
        
        // Проверяем, находится ли текущее время между началом намаза и концом икамата
        return currentMinutes >= prayerTotalMinutes && currentMinutes <= iqamaEndMinutes;
    };

    // Функция для получения времени намаза (с учетом фиксированного времени)
    const getPrayerTime = (prayerName: string): string => {
        const regularTime = regularPrayerTimes?.[prayerName as keyof PrayerTimes];
        const currentTime = prayerTimes?.[prayerName as keyof PrayerTimes];
        return regularTime || currentTime || '00:00';
    };

    // Функция для получения времени намаза для расчета икамата (приоритет фиксированного времени)
    const getPrayerTimeForIqama = (prayerName: string): string => {
        // Если фиксированное время активно, используем его
        const fixedTimeActive = fixedPrayerTimes?.[`${prayerName}Active` as keyof typeof fixedPrayerTimes] as boolean;
        if (fixedTimeActive && fixedPrayerTimes?.[prayerName as keyof typeof fixedPrayerTimes]) {
            return fixedPrayerTimes[prayerName as keyof typeof fixedPrayerTimes] as string;
        }
        // Иначе используем обычное время
        return getPrayerTime(prayerName);
    };

    // Функция для проверки активности икамата для конкретного намаза
    const getIqamaActiveForPrayer = (prayerName: string): boolean => {
        if (!prayerTimes || activePrayer !== prayerName) return false;
        const iqama = iqamaData[prayerName];
        if (!iqama || !iqama.enabled || iqama.minutes <= 0) return false;
        // Используем время с учетом фиксированного времени для расчета икамата
        const prayerTime = getPrayerTimeForIqama(prayerName);
        if (!prayerTime || prayerTime === '00:00' || !prayerTime.includes(':')) return false;
        return isIqamaCurrentlyActive(prayerTime, iqama.minutes);
    };

    const prayers = [
        {
            time: getPrayerTime('fajr'),
            label: prayerLabels.fajr,
            highlight: activePrayer === 'fajr',
            pic: fadjr,
            pic2: fadjr2,
            fixedTime: fixedPrayerTimes?.fajrActive ? fixedPrayerTimes?.fajr : null,
            isFixedTimeActive: fixedPrayerTimes?.fajrActive || false,
            iqama: iqamaData.fajr || null,
            isIqamaActive: getIqamaActiveForPrayer('fajr')
        },
        {
            time: getPrayerTime('mechet'),
            label: prayerLabels.mechet,
            highlight: activePrayer === 'mechet',
            pic: mosque,
            pic2: mosque,
            fixedTime: fixedPrayerTimes?.mechetActive ? fixedPrayerTimes?.mechet : null,
            isFixedTimeActive: fixedPrayerTimes?.mechetActive || false,
            iqama: iqamaData.mechet || null,
            isIqamaActive: getIqamaActiveForPrayer('mechet')
        },
        {
            time: getPrayerTime('shuruk'),
            label: prayerLabels.shuruk,
            highlight: activePrayer === 'shuruk',
            pic: shuruk,
            pic2: shuruk2,
            fixedTime: fixedPrayerTimes?.shurukActive ? fixedPrayerTimes?.shuruk : null,
            isFixedTimeActive: fixedPrayerTimes?.shurukActive || false,
            iqama: iqamaData.shuruk || null,
            isIqamaActive: getIqamaActiveForPrayer('shuruk')
        },
        {
            time: getPrayerTime('zuhr'),
            label: prayerLabels.zuhr,
            highlight: activePrayer === 'zuhr',
            pic: zuhr,
            pic2: zuhr2,
            fixedTime: fixedPrayerTimes?.zuhrActive ? fixedPrayerTimes?.zuhr : null,
            isFixedTimeActive: fixedPrayerTimes?.zuhrActive || false,
            iqama: iqamaData.zuhr || null,
            isIqamaActive: getIqamaActiveForPrayer('zuhr')
        },
        {
            time: getPrayerTime('asr'),
            label: prayerLabels.asr,
            highlight: activePrayer === 'asr',
            pic: asr,
            pic2: asr2,
            fixedTime: fixedPrayerTimes?.asrActive ? fixedPrayerTimes?.asr : null,
            isFixedTimeActive: fixedPrayerTimes?.asrActive || false,
            iqama: iqamaData.asr || null,
            isIqamaActive: getIqamaActiveForPrayer('asr')
        },
        {
            time: getPrayerTime('maghrib'),
            label: prayerLabels.maghrib,
            highlight: activePrayer === 'maghrib',
            pic: magrib,
            pic2: magrib2,
            fixedTime: fixedPrayerTimes?.maghribActive ? fixedPrayerTimes?.maghrib : null,
            isFixedTimeActive: fixedPrayerTimes?.maghribActive || false
        },
        {
            time: regularPrayerTimes?.isha || prayerTimes?.isha || '00:00',
            label: prayerLabels.isha,
            highlight: activePrayer === 'isha',
            pic: isha,
            pic2: isha2,
            fixedTime: fixedPrayerTimes?.ishaActive ? fixedPrayerTimes?.isha : null,
            isFixedTimeActive: fixedPrayerTimes?.ishaActive || false
        },
    ];

    const getHijriDate = () => {
        const hijriDate = moment().format('iD-iM-iYYYY');
        const [day, monthIndex, year] = hijriDate.split('-');
        const monthNum = parseInt(monthIndex);
        const monthName = t(`hijri.month.${monthNum}`, 
            ['Мухаррам', 'Сафар', 'Раби\'уль авваль', 'Раби\'у сани',
             'Джумадуль уля', 'Джумадуль ахир', 'Раджаб', 'Ша\'абан',
             'Рамадан', 'Шавваль', 'Зуль-ка\'да', 'Зуль-хиджа'][monthNum - 1] || 'Неизвестный месяц'
        );

        return `${day} ${monthName} ${year}`;
    };

    useEffect(() => {
        if (currentMosqueId) {
            const fetchQRCode = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}${API.GET_MOSQUE_QRCODES(currentMosqueId)}`);
                    if (!response.ok) {
                        throw new Error(`Ошибка сети при загрузке QR-кодов: ${response.status}`);
                    }

                    const data = await response.json();

                    // Сначала сбрасываем все значения, чтобы избежать отображения старых данных
                    setQrCode(null);
                    setSecondaryQrCode(null);
                    setSecondaryQrProjectName(null);

                    if (!data || !Array.isArray(data) || data.length === 0) {
                        return;
                    }

                    // Обработка основного QR-кода
                    const primaryQR = data.find(qr => qr.isPrimary === true);
                    if (primaryQR) {
                        setQrCode(primaryQR.imageUrl);
                    } else if (data.length > 0) {
                        setQrCode(data[0].imageUrl);
                    }

                    // Обработка дополнительного QR-кода (отдельно от основного)
                    const secondaryQR = data.find(qr => qr.isPrimary === false);
                    if (secondaryQR) {
                        setSecondaryQrCode(secondaryQR.imageUrl);
                        setSecondaryQrProjectName(secondaryQR.projectName);
                    }

                } catch (error) {
                    console.error("Ошибка при загрузке QR-кодов:", error);
                    // При ошибке сбрасываем все значения
                    setQrCode(null);
                    setSecondaryQrCode(null);
                    setSecondaryQrProjectName(null);
                }
            };

            fetchQRCode();
        } else {
            // Если мечеть не выбрана, очищаем QR-коды
            setQrCode(null);
            setSecondaryQrCode(null);
            setSecondaryQrProjectName(null);
        }
    }, [currentMosqueId]);

    // Автоматическое обновление погоды каждые 5 минут
    useEffect(() => {
        // При первоначальной загрузке компонента или изменении города
        let isMounted = true;
        let lastFetchTime = 0;

        // Функция для проверки необходимости запроса погоды
        const updateWeather = () => {
            const now = new Date().getTime();
            // Запрашиваем погоду только если прошло больше 10 секунд с последнего запроса
            // Это предотвратит дублирование запросов при быстрых изменениях состояния
            if (selectedCity && now - lastFetchTime > 10000 && isMounted) {
                lastFetchTime = now;
                fetchWeatherData(selectedCity);
            }
        };

        // Обновляем погоду сразу при смене города
        if (selectedCity) {
            updateWeather();
        }

        // Устанавливаем интервал обновления каждые 5 минут
        const weatherUpdateInterval = setInterval(updateWeather, 300000); // 5 минут в миллисекундах

        // Очищаем интервал при размонтировании компонента
        return () => {
            isMounted = false;
            clearInterval(weatherUpdateInterval);
        };
    }, [selectedCity]);

    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await axios.get<City[]>(`${API_BASE_URL}/api/cities`);
                // Сортировка городов по алфавиту
                const sortedCities = response.data.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
                setCities(sortedCities);

                if (!currentCityId || selectedCity) {
                    const selectedCityData = sortedCities.find(city => city.name === selectedCity);
                    if (selectedCityData) {
                        setCurrentCityId(selectedCityData.id);
                        localStorage.setItem('currentCityId', selectedCityData.id.toString());

                        // Получаем фиксированное время намаза при изменении города
                        // Обновляем фиксированное время при изменении мечети
                        if (currentMosqueId) {
                            fetchFixedPrayerTime(currentMosqueId);
                        } else {
                            setFixedPrayerTimes(null);
                        }
                    }
                }
            } catch (error) {
                console.error('Ошибка при загрузке списка городов:', error);
            }
        };

        getHijriDate();
        fetchCities();
    }, [selectedCity]);

    useEffect(() => {
        const fetchMosques = async () => {
            try {
                const response = await axios.get<Mosque[]>(`${API_BASE_URL}/api/mosques`);
                // Сортировка всех мечетей по алфавиту
                const sortedMosques = response.data.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
                setMosques(sortedMosques);

                // Фильтруем и сортируем мечети для текущего города
                const mosquesInCity = sortedMosques.filter(mosque => mosque.cityId === currentCityId);

                if (mosquesInCity.length > 0) {
                    // Проверяем, есть ли сохраненная мечеть в списке мечетей текущего города
                    const savedMosque = mosquesInCity.find(mosque =>
                        mosque.id === currentMosqueId && mosque.cityId === currentCityId
                    );

                    if (savedMosque) {
                        // Если сохраненная мечеть найдена, используем её
                        setSelectedMosque(savedMosque.name);
                        setCurrentMosqueId(savedMosque.id);
                    } else {
                        // Если сохраненной мечети нет в списке, берем первую мечеть из города
                        setSelectedMosque(mosquesInCity[0].name);
                        setCurrentMosqueId(mosquesInCity[0].id);
                        localStorage.setItem('selectedMosque', mosquesInCity[0].name);
                        localStorage.setItem('currentMosqueId', mosquesInCity[0].id.toString());
                    }
                } else {
                    // Если у города нет мечетей, сбрасываем выбранную мечеть и QR-коды
                    setSelectedMosque('');
                    setCurrentMosqueId(null);
                    setQrCode(null);
                    setSecondaryQrCode(null);
                    setSecondaryQrProjectName(null);
                    localStorage.removeItem('selectedMosque');
                    localStorage.removeItem('currentMosqueId');
                    console.log('У выбранного города нет мечетей, QR-коды сброшены');
                }
            } catch (error) {
                console.error('Ошибка при загрузке мечетей:', error);
                // При ошибке также сбрасываем данные
                setQrCode(null);
                setSecondaryQrCode(null);
                setSecondaryQrProjectName(null);
            }
        };

        fetchMosques();
    }, [currentCityId]);

    // Функция для загрузки времени намазов (с учетом приоритета)
    const fetchPrayerTimes = useCallback(async () => {
        try {
            // Используем mosqueId если он есть, иначе используем cityName как fallback
            let url = '';
            if (currentMosqueId) {
                url = `${API_BASE_URL}/api/prayers/today?mosqueId=${currentMosqueId}`;
            } else if (selectedCity) {
                url = `${API_BASE_URL}/api/prayers/today?cityName=${selectedCity}`;
            } else {
                console.warn('Нет выбранного города или мечети');
                return;
            }

            const response = await axios.get<PrayerResponse>(url);
            const { fajr, shuruk, zuhr, asr, maghrib, isha, mechet, fajrIqama, shurukIqama, zuhrIqama, asrIqama, maghribIqama, ishaIqama, mechetIqama } = response.data;

            setPrayerTimes({
                fajr,
                shuruk,
                zuhr,
                asr,
                maghrib,
                isha,
                mechet,
            });

            // Сохраняем данные об икамате
            setIqamaData({
                fajr: fajrIqama || null,
                shuruk: shurukIqama || null,
                zuhr: zuhrIqama || null,
                asr: asrIqama || null,
                maghrib: maghribIqama || null,
                isha: ishaIqama || null,
                mechet: mechetIqama || null,
            });

            console.log('Время намазов обновлено:', new Date().toLocaleString());
            console.log('Данные об икамате:', { fajrIqama, shurukIqama, zuhrIqama, asrIqama, maghribIqama, ishaIqama, mechetIqama });
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
            // toast.error('Ошибка при загрузке времени намазов');
        }
    }, [currentMosqueId, selectedCity]);

    // Функция для загрузки обычного времени намазов (без учета фиксированного)
    const fetchRegularPrayerTimes = useCallback(async () => {
        try {
            if (!currentMosqueId) {
                setRegularPrayerTimes(null);
                return;
            }

            // Получаем сегодняшнюю дату в локальном часовом поясе (формат YYYY-MM-DD)
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const today = `${year}-${month}-${day}`;
            
            console.log('Ищем обычное время на дату:', today);
            
            const response = await axios.get<PrayerResponse[]>(`${API_BASE_URL}/api/prayers/all?mosqueId=${currentMosqueId}`);
            
            // Проверяем, что response.data является массивом
            if (!Array.isArray(response.data)) {
                console.error('Ошибка: response.data не является массивом', response.data);
                setRegularPrayerTimes(null);
                return;
            }
            
            // Находим запись на сегодня
            const todayPrayer = response.data.find(p => {
                // Сравниваем даты, учитывая возможные форматы
                const prayerDate = p.date ? p.date.split('T')[0] : p.date;
                return prayerDate === today;
            });
            
            console.log('Найдена запись на сегодня:', todayPrayer);
            console.log('Все даты из ответа:', response.data.map(p => p.date));
            
            if (todayPrayer) {
                setRegularPrayerTimes({
                    fajr: todayPrayer.fajr || '00:00',
                    shuruk: todayPrayer.shuruk || '00:00',
                    zuhr: todayPrayer.zuhr || '00:00',
                    asr: todayPrayer.asr || '00:00',
                    maghrib: todayPrayer.maghrib || '00:00',
                    isha: todayPrayer.isha || '00:00',
                    mechet: todayPrayer.mechet || '00:00',
                });
            } else {
                console.warn('Запись на сегодня не найдена');
                setRegularPrayerTimes(null);
            }
        } catch (error: any) {
            console.error('Ошибка при получении молитв:', error);
            if (error.response) {
                console.error('Ответ сервера:', error.response.data);
                console.error('Статус:', error.response.status);
            }
            setRegularPrayerTimes(null);
        }
    }, [currentMosqueId]);

    // Загрузка времени намазов при изменении города или мечети
    useEffect(() => {
        fetchPrayerTimes();
        fetchRegularPrayerTimes(); // Загружаем обычное время
        // Обновляем фиксированное время при изменении мечети
        if (currentMosqueId) {
            fetchFixedPrayerTime(currentMosqueId);
        } else {
            setFixedPrayerTimes(null);
        }
    }, [fetchPrayerTimes, fetchRegularPrayerTimes, selectedMosque, currentMosqueId]);

    // Автоматическое обновление времени намазов в полночь
    useEffect(() => {
        const scheduleNextUpdate = () => {
            const now = new Date();
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0); // 00:00:00 следующего дня

            const timeUntilMidnight = tomorrow.getTime() - now.getTime();

            return setTimeout(() => {
                console.log('Автоматическое обновление времени намазов в полночь');
                fetchPrayerTimes();

                // Планируем следующее обновление через 24 часа
                const interval = setInterval(() => {
                    console.log('Ежедневное обновление времени намазов в полночь');
                    fetchPrayerTimes();
                }, 24 * 60 * 60 * 1000); // 24 часа

                return interval;
            }, timeUntilMidnight);
        };

        const timeoutId = scheduleNextUpdate();
        
        return () => {
            clearTimeout(timeoutId);
        };
    }, [fetchPrayerTimes]); // Перепланируем при изменении функции загрузки

    // Обновление времени намазов при возвращении на вкладку (если прошло больше 6 часов)
    useEffect(() => {
        let lastFetchTime = Date.now();
        
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                const timeSinceLastFetch = Date.now() - lastFetchTime;
                const sixHours = 6 * 60 * 60 * 1000; // 6 часов в миллисекундах
                
                if (timeSinceLastFetch > sixHours) {
                    console.log('Обновление времени намазов после длительного отсутствия');
                    fetchPrayerTimes();
                    lastFetchTime = Date.now();
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [fetchPrayerTimes]);

    useEffect(() => {
        if (!prayerTimes) return;

        const {
            nextPrayer,
            remainingTime: nextRemainingTime,
            totalDuration: nextTotalDuration,
        } = calculateTimeToNextPrayer(prayerTimes, fixedPrayerTimes);

        setNearestPrayer(nextPrayer);
        setRemainingTime(nextRemainingTime);
        setTotalDuration(nextTotalDuration);

        // вычисляем активный намаз с учетом икамата
        const computeActive = () => {
            if (!nextPrayer) {
                setActivePrayer('');
                setIsIqamaPeriod(false);
                return;
            }

            // Найдем предыдущий намаз и его время (с учетом фиксированного времени для икамата)
            const getTime = (name: string | undefined): string | null => {
                if (!name) return null;
                // Если фиксированное время активно, используем его для расчета икамата
                const fixedTimeActive = fixedPrayerTimes?.[`${name}Active` as keyof typeof fixedPrayerTimes] as boolean;
                if (fixedTimeActive && fixedPrayerTimes?.[name as keyof typeof fixedPrayerTimes]) {
                    return fixedPrayerTimes[name as keyof typeof fixedPrayerTimes] as string;
                }
                // Иначе используем обычное время
                const dict: Record<string, string | undefined> = {
                    fajr: prayerTimes.fajr,
                    shuruk: prayerTimes.shuruk,
                    zuhr: prayerTimes.zuhr,
                    asr: prayerTimes.asr,
                    maghrib: prayerTimes.maghrib,
                    isha: prayerTimes.isha,
                    mechet: prayerTimes.mechet,
                };
                return dict[name] || null;
            };

            const sorted = [
                { name: 'fajr', time: getTime('fajr') },
                { name: 'shuruk', time: getTime('shuruk') },
                { name: 'zuhr', time: getTime('zuhr') },
                { name: 'asr', time: getTime('asr') },
                { name: 'maghrib', time: getTime('maghrib') },
                { name: 'isha', time: getTime('isha') },
                ...(prayerTimes.mechet ? [{ name: 'mechet', time: getTime('mechet') }] : []),
            ]
                .filter(p => !!p.time)
                .sort((a, b) => getTimeInMinutes(a.time as string) - getTimeInMinutes(b.time as string));

            const now = new Date();
            const nowMin = now.getHours() * 60 + now.getMinutes();

            // Проверяем икамат
            let activeIqama = null;
            for (const p of sorted) {
                const prayerTime = p.time as string;
                const iqama = iqamaData[p.name];
                if (iqama && iqama.enabled && iqama.minutes > 0) {
                    if (isIqamaCurrentlyActive(prayerTime, iqama.minutes)) {
                        activeIqama = p;
                        break;
                    }
                }
            }

            if (activeIqama) {
                setActivePrayer(activeIqama.name);
                setIsIqamaPeriod(true);
            } else {
                setActivePrayer(nextPrayer);
                setIsIqamaPeriod(false);
            }
        };

        computeActive();

        // Инициализируем статус икамата при первом запуске
        let initialIqamaActive = false;
        const sortedForInit = [
            { name: 'fajr', time: fixedPrayerTimes?.fajrActive ? fixedPrayerTimes.fajr : prayerTimes.fajr },
            { name: 'shuruk', time: fixedPrayerTimes?.shurukActive ? fixedPrayerTimes.shuruk : prayerTimes.shuruk },
            { name: 'zuhr', time: fixedPrayerTimes?.zuhrActive ? fixedPrayerTimes.zuhr : prayerTimes.zuhr },
            { name: 'asr', time: fixedPrayerTimes?.asrActive ? fixedPrayerTimes.asr : prayerTimes.asr },
            { name: 'maghrib', time: fixedPrayerTimes?.maghribActive ? fixedPrayerTimes.maghrib : prayerTimes.maghrib },
            { name: 'isha', time: fixedPrayerTimes?.ishaActive ? fixedPrayerTimes.isha : prayerTimes.isha },
            ...(prayerTimes.mechet ? [{ name: 'mechet', time: fixedPrayerTimes?.mechetActive ? (fixedPrayerTimes.mechet || '') : prayerTimes.mechet }] : []),
        ]
            .filter(p => !!p.time)
            .sort((a, b) => getTimeInMinutes(a.time as string) - getTimeInMinutes(b.time as string));

        const nowInit = new Date();
        for (const p of sortedForInit) {
            const prayerTime = p.time as string;
            const iqama = iqamaData[p.name];
            if (iqama && iqama.enabled && iqama.minutes > 0) {
                if (isIqamaCurrentlyActive(prayerTime, iqama.minutes)) {
                    initialIqamaActive = true;
                    break;
                }
            }
        }

        // Используем setInterval для более надежной работы на Android TV
        // requestAnimationFrame может не вызываться стабильно на TV устройствах
        let intervalId: NodeJS.Timeout;
        let lastUpdateTime = Date.now();
        let lastCheckTime = Date.now();
        let previousNextPrayer = nextPrayer;
        let previousIqamaActive = initialIqamaActive;

        const updateTimer = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastUpdateTime;
            lastUpdateTime = currentTime;

            // Принудительно пересчитываем каждую секунду для надежности
            const timeSinceLastCheck = currentTime - lastCheckTime;
            const shouldForceRecalculate = timeSinceLastCheck >= 1000;

            setRemainingTime((prevTime) => {
                // Пересчитываем если время истекло или прошла секунда
                if (prevTime <= 1000 || shouldForceRecalculate) {
                    const {
                        nextPrayer: newNextPrayer,
                        remainingTime: newRemainingTime,
                        totalDuration: newTotalDuration,
                    } = calculateTimeToNextPrayer(prayerTimes, fixedPrayerTimes);

                    // Проверяем, изменился ли следующий намаз (карточка должна переключиться)
                    const nextPrayerChanged = previousNextPrayer !== newNextPrayer;
                    
                    // Проверяем текущий статус икамата
                    let currentIqamaActive = false;
                    const sorted = [
                        { name: 'fajr', time: fixedPrayerTimes?.fajrActive ? fixedPrayerTimes.fajr : prayerTimes.fajr },
                        { name: 'shuruk', time: fixedPrayerTimes?.shurukActive ? fixedPrayerTimes.shuruk : prayerTimes.shuruk },
                        { name: 'zuhr', time: fixedPrayerTimes?.zuhrActive ? fixedPrayerTimes.zuhr : prayerTimes.zuhr },
                        { name: 'asr', time: fixedPrayerTimes?.asrActive ? fixedPrayerTimes.asr : prayerTimes.asr },
                        { name: 'maghrib', time: fixedPrayerTimes?.maghribActive ? fixedPrayerTimes.maghrib : prayerTimes.maghrib },
                        { name: 'isha', time: fixedPrayerTimes?.ishaActive ? fixedPrayerTimes.isha : prayerTimes.isha },
                        ...(prayerTimes.mechet ? [{ name: 'mechet', time: fixedPrayerTimes?.mechetActive ? (fixedPrayerTimes.mechet || '') : prayerTimes.mechet }] : []),
                    ]
                        .filter(p => !!p.time)
                        .sort((a, b) => getTimeInMinutes(a.time as string) - getTimeInMinutes(b.time as string));

                    const now = new Date();
                    const nowMin = now.getHours() * 60 + now.getMinutes();

                    for (const p of sorted) {
                        const prayerTime = p.time as string;
                        const iqama = iqamaData[p.name];
                        if (iqama && iqama.enabled && iqama.minutes > 0) {
                            if (isIqamaCurrentlyActive(prayerTime, iqama.minutes)) {
                                currentIqamaActive = true;
                                break;
                            }
                        }
                    }

                    // Перезагружаем страницу если:
                    // 1. Изменился следующий намаз (карточка должна переключиться)
                    // 2. Икамат закончился (был активен, а теперь нет)
                    const iqamaEnded = previousIqamaActive && !currentIqamaActive;
                    
                    if (nextPrayerChanged || iqamaEnded) {
                        // Небольшая задержка перед перезагрузкой, чтобы состояние успело обновиться
                        setTimeout(() => {
                            window.location.reload();
                        }, 500);
                        return prevTime; // Возвращаем текущее значение, так как страница перезагрузится
                    }

                    // Обновляем предыдущие значения
                    previousNextPrayer = newNextPrayer;
                    previousIqamaActive = currentIqamaActive;

                    setNearestPrayer(newNextPrayer);
                    setTotalDuration(newTotalDuration);

                    // переоценить активный намаз с учётом икамата
                    computeActive();

                    lastCheckTime = currentTime;
                    return newRemainingTime;
                }
                // обновляем активный блок каждые тики
                computeActive();
                return Math.max(0, prevTime - deltaTime);
            });
        };

        // Используем setInterval с частотой 100ms для плавного обновления
        // Это более надежно чем requestAnimationFrame на Android TV
        intervalId = setInterval(updateTimer, 100);

        // Также добавляем проверку при возврате фокуса на страницу
        const handleVisibilityChange = () => {
            if (!document.hidden) {
                // Принудительно пересчитываем при возврате фокуса
                const {
                    nextPrayer: newNextPrayer,
                    remainingTime: newRemainingTime,
                    totalDuration: newTotalDuration,
                } = calculateTimeToNextPrayer(prayerTimes, fixedPrayerTimes);

                setNearestPrayer(newNextPrayer);
                setRemainingTime(newRemainingTime);
                setTotalDuration(newTotalDuration);
                computeActive();
                lastUpdateTime = Date.now();
                lastCheckTime = Date.now();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [prayerTimes, fixedPrayerTimes, iqamaData]);

    // Функция для конвертации времени в минуты от начала дня
    const getTimeInMinutes = (timeString: string): number => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    // Функция для вычисления времени окончания икамата
    const calculateIqamaEndTime = (prayerTime: string, minutes: number): string => {
        const [hours, mins] = prayerTime.split(':').map(Number);
        const totalMinutes = hours * 60 + mins + minutes; // Добавляем минуты
        const iqamaHours = Math.floor(totalMinutes / 60) % 24; // Обработка перехода через полночь
        const iqamaMins = totalMinutes % 60;
        return `${String(iqamaHours).padStart(2, '0')}:${String(iqamaMins).padStart(2, '0')}`;
    };

    const handleCitySelect = (city: City) => {
        try {
            setCityDropdownOpen(false);
            setSelectedCity(city.name);
            setCurrentCityId(city.id);
            localStorage.setItem('selectedCity', city.name);
            localStorage.setItem('currentCityId', city.id.toString());
            fetchWeatherData(city.name);
            // Обновляем фиксированное время при изменении мечети
            if (currentMosqueId) {
                fetchFixedPrayerTime(currentMosqueId);
            } else {
                setFixedPrayerTimes(null);
            }
            // toast.success('Город успешно изменен');
        } catch (error) {
            console.error('Ошибка при смене города:', error);
            // toast.error('Ошибка при смене города');
        }
    };

    const handleMosqueSelect = (mosque: Mosque) => {
        try {
            setSelectedMosque(mosque.name);
            setCurrentMosqueId(mosque.id);
            setMosqueDropdownOpen(false);
            localStorage.setItem('selectedMosque', mosque.name);
            localStorage.setItem('currentMosqueId', mosque.id.toString());
            // toast.success('Мечеть успешно выбрана');
        } catch (error) {
            console.error('Ошибка при выборе мечети:', error);
            // toast.error('Ошибка при выборе мечети');
        }
    };

    const getLogoUrl = () => {
        const mosque = mosques.find(m => m.name === selectedMosque && m.cityId === currentCityId);
        const city = cities.find(c => c.id === currentCityId);

        if (mosque?.logoUrl) {
            return `${API_BASE_URL}/${mosque.logoUrl}`;
        } else if (city?.logoUrl) {
            return `${API_BASE_URL}${city.logoUrl}`;
        } else {
            return 'https://placeholder.apptor.studio/61/61/product1.png';
        }
    };

    // Функция для получения погодных данных
    const fetchWeatherData = async (cityName: string) => {
        try {
            setIsLoadingWeather(true);


            // Получаем координаты через геокодинг
            const geocodeResponse = await axios.get(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)},Россия&limit=1`
            );

            if (!geocodeResponse.data || geocodeResponse.data.length === 0) {
                throw new Error('Город не найден');
            }

            const { lat, lon } = geocodeResponse.data[0];
            const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQ3MDY1MDYwLCJpYXQiOjE3NDcwNjQ3NjAsImp0aSI6ImFiOTgzM2YyNjAzZTQ4Mjk4ODc5ZDBmMzk2Y2I3NzZjIiwidXNlcl9pZCI6ODkzfQ.hPqzVC8BOUff9JoOXLQHEfZFPJ3GR2aJHnfroReTYus';
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hour = String(now.getHours()).padStart(2, '0');
            const dateHour = `${year}-${month}-${day}T${hour}:00`;

            const response = await axios.get(
                `https://projecteol.ru/api/weather/?lat=${lat}&lon=${lon}&date=${dateHour}&token=${token}`
            );

            if (response.data && response.data.length > 0) {
                const weatherInfo = response.data[0];
                const weatherData: WeatherData = {
                    temperature: Math.round(weatherInfo.temp_100_cel),
                    description: getWeatherDescription(weatherInfo.oblachnost_atmo, weatherInfo.vlaga_2f),
                    icon: getWeatherIcon(weatherInfo.oblachnost_atmo, weatherInfo.vlaga_2f),
                    city: cityName,
                    updatedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                };

                setWeatherData(weatherData);
            }
        } catch (error) {
            console.error('Ошибка при загрузке погоды:', error);
            setWeatherData({
                temperature: 5,
                description: 'Облачно',
                icon: '1003',
                city: cityName,
                updatedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            });
        } finally {
            setIsLoadingWeather(false);
        }
    };

    // Функция для определения описания погоды
    const getWeatherDescription = (cloudiness: number, humidity: number): string => {
        if (cloudiness < 20) return 'Ясно';
        if (cloudiness < 50) return 'Малооблачно';
        if (cloudiness < 80) return 'Облачно';
        if (humidity > 80) return 'Дождливо';
        return 'Облачно';
    };

    // Функция для определения иконки погоды
    const getWeatherIcon = (cloudiness: number, humidity: number): string => {
        if (cloudiness < 20) return 'sunny';
        if (cloudiness < 50) return 'partly_cloudy';
        if (cloudiness < 80) return 'cloudy';
        if (humidity > 80) return 'rainy';
        return 'cloudy';
    };

    // Обновляем интервал обновления погоды
    useEffect(() => {
        let isMounted = true;
        let lastFetchTime = 0;

        const updateWeather = () => {
            const now = new Date().getTime();
            if (selectedCity && now - lastFetchTime > 3600000 && isMounted) { // 1 час

                lastFetchTime = now;
                fetchWeatherData(selectedCity);
            }
        };

        // Обновляем погоду сразу при смене города
        if (selectedCity) {
            updateWeather();
        }

        // Устанавливаем интервал обновления каждый час
        const weatherUpdateInterval = setInterval(updateWeather, 3600000);

        return () => {
            isMounted = false;
            clearInterval(weatherUpdateInterval);
        };
    }, [selectedCity]);

    // Определяем индекс текущей выделенной молитвы
    const getHighlightedPrayerIndex = () => {
        return prayers.findIndex(prayer => prayer.highlight === true);
    };

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (
                cityDropdownOpen &&
                cityDropdownRef.current &&
                !cityDropdownRef.current.contains(event.target as Node)
            ) {
                setCityDropdownOpen(false);
            }
            if (
                mosqueDropdownOpen &&
                mosqueDropdownRef.current &&
                !mosqueDropdownRef.current.contains(event.target as Node)
            ) {
                setMosqueDropdownOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [cityDropdownOpen, mosqueDropdownOpen]);

    // Функция для получения фиксированного времени намаза
    const fetchFixedPrayerTime = async (mosqueId: number | null) => {
        if (!mosqueId) {
            setFixedPrayerTimes(null);
            return;
        }
        try {
            // Публичный эндпоинт для получения фиксированного времени мечети
            const response = await axios.get<FixedPrayerTime>(`${API_BASE_URL}/api/prayers/fixed-time/mosque/${mosqueId}`);
            if (response.data) {
                setFixedPrayerTimes(response.data);
                // toast.success('Фиксированное время намазов загружено');
            } else {
                setFixedPrayerTimes(null);
            }
        } catch (error) {
            console.error('Ошибка при получении фиксированного времени намаза:', error);
            // toast.error('Ошибка при загрузке фиксированного времени');
            setFixedPrayerTimes(null);
        }
    };

    // Функция расчета времени до ближайшего намаза с учетом фиксированного времени
    const calculateTimeToNextPrayer = (prayerTimes: PrayerTimes, fixedPrayerTimes: FixedPrayerTime | null): { nextPrayer: string, remainingTime: number, totalDuration: number } => {
        if (!prayerTimes) {
            return { nextPrayer: '', remainingTime: 0, totalDuration: 0 };
        }

        const currentTime = new Date();
        currentTime.setSeconds(0, 0);

        // Создаем словарь времен намазов с учетом фиксированного времени, если оно активно
        const prayerTimesDict: Record<string, { time: string, isFixed: boolean }> = {
            fajr: {
                time: fixedPrayerTimes?.fajrActive ? fixedPrayerTimes.fajr : prayerTimes.fajr,
                isFixed: fixedPrayerTimes?.fajrActive || false
            },
            shuruk: {
                time: fixedPrayerTimes?.shurukActive ? fixedPrayerTimes.shuruk : prayerTimes.shuruk,
                isFixed: fixedPrayerTimes?.shurukActive || false
            },
            zuhr: {
                time: fixedPrayerTimes?.zuhrActive ? fixedPrayerTimes.zuhr : prayerTimes.zuhr,
                isFixed: fixedPrayerTimes?.zuhrActive || false
            },
            asr: {
                time: fixedPrayerTimes?.asrActive ? fixedPrayerTimes.asr : prayerTimes.asr,
                isFixed: fixedPrayerTimes?.asrActive || false
            },
            maghrib: {
                time: fixedPrayerTimes?.maghribActive ? fixedPrayerTimes.maghrib : prayerTimes.maghrib,
                isFixed: fixedPrayerTimes?.maghribActive || false
            },
            isha: {
                time: fixedPrayerTimes?.ishaActive ? fixedPrayerTimes.isha : prayerTimes.isha,
                isFixed: fixedPrayerTimes?.ishaActive || false
            }
        };

        if (prayerTimes.mechet) {
            prayerTimesDict.mechet = {
                time: fixedPrayerTimes?.mechetActive ? (fixedPrayerTimes.mechet || '') : prayerTimes.mechet,
                isFixed: fixedPrayerTimes?.mechetActive || false
            };
        }

        // Получаем текущее время в минутах
        const currentTimeInMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

        // Фильтруем только будущие намазы
        const futurePrayers: Array<{ name: string, time: string, timeInMinutes: number }> = [];

        for (const [prayerName, { time }] of Object.entries(prayerTimesDict)) {
            if (!time) continue;

            const prayerTimeInMinutes = getTimeInMinutes(time);

            // Если время намаза еще не прошло сегодня
            if (prayerTimeInMinutes > currentTimeInMinutes) {
                futurePrayers.push({
                    name: prayerName,
                    time: time,
                    timeInMinutes: prayerTimeInMinutes
                });
            }
        }

        // Проверяем, есть ли хотя бы один намаз в словаре
        const hasAnyPrayer = Object.values(prayerTimesDict).some(({ time }) => time);
        if (!hasAnyPrayer) {
            return { nextPrayer: '', remainingTime: 0, totalDuration: 0 };
        }

        // Если есть будущие намазы сегодня
        if (futurePrayers.length > 0) {
            // Находим ближайший
            const nextPrayer = futurePrayers.reduce((closest, current) =>
                current.timeInMinutes < closest.timeInMinutes ? current : closest
            );

            const difference = (nextPrayer.timeInMinutes - currentTimeInMinutes) * 60 * 1000;

            // Находим предыдущий намаз для расчета интервала
            const sortedPrayers = Object.entries(prayerTimesDict)
                .filter(([_, { time }]) => time)
                .sort((a, b) => getTimeInMinutes(a[1].time) - getTimeInMinutes(b[1].time));

            const nextIndex = sortedPrayers.findIndex(([name]) => name === nextPrayer.name);
            if (nextIndex === -1) {
                return { nextPrayer: '', remainingTime: 0, totalDuration: 0 };
            }

            const prevIndex = nextIndex > 0 ? nextIndex - 1 : sortedPrayers.length - 1;
            const prevPrayer = sortedPrayers[prevIndex];
            if (!prevPrayer || !prevPrayer[1].time) {
                return { nextPrayer: '', remainingTime: 0, totalDuration: 0 };
            }

            const currentPrayerTime = nextPrayer.timeInMinutes;
            const prevPrayerTime = getTimeInMinutes(prevPrayer[1].time);

            const timeBetweenPrayers = currentPrayerTime > prevPrayerTime
                ? (currentPrayerTime - prevPrayerTime) * 60 * 1000
                : ((currentPrayerTime + 24 * 60) - prevPrayerTime) * 60 * 1000;

            return {
                nextPrayer: nextPrayer.name,
                remainingTime: difference,
                totalDuration: timeBetweenPrayers
            };
        }

        // Если нет будущих намазов, возвращаем пустой результат
        return { nextPrayer: '', remainingTime: 0, totalDuration: 0 };
    };

    useEffect(() => {
        const timer = setTimeout(() => setLoading(false), 2000); // 2 секунды
        return () => clearTimeout(timer);
    }, []);

    if (loading) {
        return <LogoLoader />;
    }

    return (
        <div className="w-[100%] h-screen bg-[#f6f6f6] pt-[20px] pl-[20px] pr-[20px] overflow-auto pc1:p-[10px] pc2:p-[5px]  ">
            {/* Основной контейнер */}
            <div className="w-full border-[5px] border-white bg-[#eeeeee] rounded-[40px] flex flex-wrap lg:justify-between items-center p-[10px] 
                lg-max:flex-col lg-max:gap-4
                md-max:border-[3px] md-max:rounded-[30px] md-max:p-4">

                {/* Левый блок (часы и дата) - без изменений для ПК */}
                <div className="flex flex-wrap items-center space-x-6 
                    lg-max:flex-col lg-max:space-x-0 lg-max:gap-4 lg-max:w-full
                    md-max:flex-col md-max:space-x-0 md-max:gap-[10px] md-max:items-center">

                    <div className="text-[#17181d] text-center text-[52px] font-[700] pt-[8px] pb-[8px] pr-[48px] pl-[48px] pc2:pt-[6px] pc2:pb-[6px] pc2:pr-[30px] pc2:pl-[30px] tv1:pt-[4px] tv1:pb-[4px] tv1:pr-[25px] tv1:pl-[25px] bg-white rounded-[24px]
                        lg-max:text-[46px] lg-max:px-10 lg-max:py-3
                        md-max:text-[36px] md-max:px-8 md-max:py-3">
                        <DigitalClock />
                    </div>

                    <div className='flex gap-[5px] items-center
                        lg-max:flex-col lg-max:items-center lg-max:gap-1
                        md-max:flex-col md-max:items-center md-max:gap-0'>
                        <div className="text-[#17181d] text-[33px] pc1:text-[33px] pc2:text-[30px] tv1:text-[20px] break-words overflow-wrap-anywhere
                            lg-max:text-[33px]
                            md-max:text-[28px]">
                            {(() => {
                                const d = new Date();
                                const dayNum = d.getDate();
                                const monthNum = d.getMonth() + 1;
                                const monthName = t(`month.${monthNum}`, d.toLocaleDateString('ru-RU', { month: 'long' }));
                                return `${dayNum} ${monthName}`;
                            })()},
                        </div>
                        <div className="text-[#17181d] text-[33px] pc1:text-[33px] pc2:text-[30px] tv1:text-[20px] break-words overflow-wrap-anywhere
                            lg-max:text-[33px]
                            md-max:text-[28px]">
                            {(() => {
                                const d = new Date();
                                const idx = d.getDay(); // 0-вс ... 6-сб
                                const keys: Record<number, string> = {
                                    0: 'weekday.sunday',
                                    1: 'weekday.monday',
                                    2: 'weekday.tuesday',
                                    3: 'weekday.wednesday',
                                    4: 'weekday.thursday',
                                    5: 'weekday.friday',
                                    6: 'weekday.saturday',
                                };
                                return t(keys[idx], d.toLocaleDateString('ru-RU', { weekday: 'long' }));
                            })()}
                        </div>
                    </div>
                </div>

                {/* Центральный блок (праздник) */}
                {nearestHoliday && nearestHoliday.daysUntil >= 0 && (
                    <div className="flex items-center justify-center
                        lg-max:w-full lg-max:mb-2
                        md-max:w-full md-max:mb-2">
                        <div className="text-[#17181d] text-[33px] pc1:text-[33px] pc2:text-[24px] tv1:text-[18px] break-words overflow-wrap-anywhere text-center
                            lg-max:text-[33px]
                            md-max:text-[20px]">
                            {prayerLang === 'ru' ? nearestHoliday.holiday.nameRu : nearestHoliday.holiday.nameTatar} {nearestHoliday.daysUntil === 0 ? tHoliday('holiday.today', 'сегодня', 'бүген') : `${tHoliday('holiday.in', 'через', 'күрә')} ${nearestHoliday.daysUntil} ${nearestHoliday.daysUntil === 1 ? tHoliday('holiday.day', 'день', 'көн') : nearestHoliday.daysUntil < 5 ? tHoliday('holiday.days2', 'дня', 'көн') : tHoliday('holiday.days', 'дней', 'көн')}`}
                        </div>
                    </div>
                )}

                {/* Правый блок (информация) - без изменений для ПК */}
                <div className="flex flex-wrap items-center text-center space-x-6 pc2:space-x-4 tv1:space-x-2 
                    lg-max:space-x-0 lg-max:justify-center lg-max:w-full
                    md-max:flex-col md-max:gap-4 md-max:w-full">

                    {/* Блок хиджры */}
                    <div className="flex flex-col bg-white rounded-[25px] px-4 py-[12px] pc2:px-3 pc2:py-[10px] tv1:px-3 tv1:py-[8px] pc2:h-[86px] tv1:h-[56px] 
                        lg-max:px-5 lg-max:py-3 lg-max:min-w-[180px]
                        md-max:px-4 md-max:py-3 md-max:w-full md-max:items-center">
                        <div className="text-[#a0a2b1] pc2:text-[12px] font-normal pc2:leading-[27.60px] tv1:leading-[17.60px] tv1:text-[10px] break-words overflow-wrap-anywhere
                            lg-max:text-sm
                            md-max:text-sm">{t('hijri.label', 'Дата по хиджре')}</div>
                        <div className="text-[#17181d] pc1:text-[24px] pc2:text-[18px] tv1:text-[14px] font-normal pc2:leading-[27.60px] tv1:leading-[17.60px] break-words overflow-wrap-anywhere
                            lg-max:text-[24px]
                            md-max:text-[22px]">{getHijriDate()}</div>
                    </div>

                    {/* Контейнер города, мечети и аватара */}
                    <div className="flex items-left gap-[10px] items-center 
                        lg-max:gap-4 lg-max:flex-nowrap
                        md-max:flex-col md-max:w-full md-max:gap-4">

                        {/* Контейнер города и мечети */}
                        <div className="flex gap-[10px] 
                            lg-max:flex-1 lg-max:gap-3
                            md-max:w-full md-max:flex-col md-max:gap-4">

                            {/* Выбор города */}
                            <div className='flex flex-col bg-white rounded-[25px] px-3 sm:px-4 md:px-5 lg:px-6 pt-[10px] pc2:h-[86px] tv1:h-[56px] 
                                lg-max:flex-1 lg-max:px-4 lg-max:py-2 relative
                                md-max:px-3 md-max:w-full md-max:items-center'>
                                <div className="cursor-pointer relative z-10 text-[#17181d] pc1:text-[24px] pc2:text-[18px] tv1:text-[14px] font-normal pc2:leading-[27.60px] tv1:leading-[17.60px]
                                lg-max:text-[20px]
                                md-max:text-[22px]"
                                    onClick={() => setCityDropdownOpen(prev => !prev)} ref={cityDropdownRef}>
                                    <div className="text-[#a0a2b1] pc2:text-[12px] tv1:text-[10px] font-normal
                                        lg-max:text-sm">{t('city.label', 'Город')}</div>
                                    <div className="text-ellipsis overflow-hidden whitespace-nowrap">{t(`city.${selectedCity}`, selectedCity)}</div>
                                    {cityDropdownOpen && (
                                        <div className="absolute bg-white border rounded-lg shadow-lg w-[250px] max-h-[320px] overflow-x-hidden overflow-y-auto z-1000
                                            lg-max:w-full lg-max:max-h-[200px]
                                            md-max:w-[90%] md-max:max-h-[200px] md-max:top-full md-max:mt-1">
                                            {cities.map((city) => (
                                                <div key={city.id} className="p-2 hover:bg-gray-200 cursor-pointer text-left pc1:text-[24px] pc2:text-[18px] tv1:text-[14px] break-words overflow-wrap-anywhere
                                                    lg-max:text-[18px] lg-max:text-center
                                                    md-max:text-[18px] md-max:text-center"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCityDropdownOpen(false);
                                                        handleCitySelect(city);
                                                    }}>
                                                    {t(`city.${city.name}`, city.name)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Выбор мечети */}
                            <div className="flex flex-col bg-white rounded-[25px] px-3 sm:px-4 md:px-5 lg:px-6 pt-[10px] pc2:h-[86px] tv1:h-[56px] 
                                lg-max:flex-1 lg-max:px-4 lg-max:py-2 relative
                                md-max:px-3 md-max:w-full md-max:items-center">
                                <div className="cursor-pointer relative z-10"
                                    onClick={() => setMosqueDropdownOpen(prev => !prev)} ref={mosqueDropdownRef}>
                                    <div className='text-[#a0a2b1] pc2:text-[12px] tv1:text-[10px] pc2:leading-[27.60px] tv1:leading-[17.60px] font-normal
                                        lg-max:text-sm'>{t('mosque.label', 'Мечеть')}</div>
                                    <div className="text-[#17181d] pc1:text-[24px] pc2:text-[18px] tv1:text-[14px] font-normal pc2:leading-[27.60px] tv1:leading-[17.60px] text-ellipsis overflow-hidden whitespace-nowrap break-words overflow-wrap-anywhere
                                        lg-max:text-[20px]
                                        md-max:text-[22px]">{selectedMosque}</div>
                                    {mosqueDropdownOpen && (
                                        <div className="absolute right-0 bg-white border rounded-lg shadow-lg w-[250px] max-h-96 overflow-y-auto z-1000
                                            lg-max:w-full lg-max:max-h-[200px] lg-max:left-0
                                            md-max:w-[90%] md-max:max-h-[200px] md-max:left-0 md-max:right-auto md-max:top-full md-max:mt-1">
                                            {mosques
                                                .filter(mosque => mosque.cityId === currentCityId)
                                                .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                                                .map((mosque) => (
                                                    <div key={mosque.id} className="p-2 hover:bg-gray-200 text-left cursor-pointer text-[#17181d] break-words overflow-wrap-anywhere
                                                        lg-max:text-[18px] lg-max:text-center lg-max:whitespace-normal
                                                        md-max:text-center md-max:whitespace-normal"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleMosqueSelect(mosque);
                                                        }}>
                                                        {mosque.name}
                                                    </div>
                                                ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Аватар (остается на своем месте) */}
                        <div className="sm-max:mt-2">
                            <img className="w-[45px] h-[45px] sm:w-[50px] sm:h-[50px] md:w-[55px] md:h-[55px] lg:w-[61px] lg:h-[61px] rounded-[20px]
                                lg-max:w-[55px] lg-max:h-[55px]
                                md-max:w-[50px] md-max:h-[50px]"
                                src={getLogoUrl()}
                                alt="avatar" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center h-[397px] pc:h-[397px] pc1:h-[320px] tv:h-[300px] tv1:h-[260px] gap justify-between w-full border-[5px] border-white rounded-[48px] pt-[20px] pb-[20px] pl-[15px] pr-[15px] sm:pl-[20px] sm:pr-[20px] md:pl-[25px] md:pr-[25px] mt-[40px] 
                sm-max:flex-wrap sm-max:justify-center sm-max:gap-[15px] sm-max:h-auto sm-max:pt-[15px] sm-max:pb-[15px]
                xl-max:flex-wrap xl-max:justify-center xl-max:gap-[12px] xl-max:h-auto xl-max:pt-[15px] xl-max:pb-[15px]">
                {prayers.map((prayer, index) => {
                    const highlightedIndex = getHighlightedPrayerIndex();
                    const isNextToHighlighted = (highlightedIndex !== -1) && (index === highlightedIndex - 1 || index === highlightedIndex + 1);

                    return (
                        <div key={index} className="mx-[3px] sm:mx-1 md:mx-2">
                            <PrayerTime
                                time={prayer.time}
                                label={prayer.label}
                                highlight={prayer.highlight}
                                pic={prayer.pic}
                                pic2={prayer.pic2}
                                remainingTime={prayer.highlight ? remainingTime : 0}
                                progress={prayer.highlight ? calculateProgress(remainingTime, totalDuration) : 0}
                                className={isNextToHighlighted ? 'w-[211px] pc1:w-[180px] pc2:w-[150px]' : ''}
                                fixedTime={prayer.fixedTime}
                                isFixedTimeActive={prayer.isFixedTimeActive}
                                t={t}
                                currentLang={prayerLang}
                                iqama={prayer.iqama}
                                isIqamaActive={prayer.isIqamaActive}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="w-full gap-[24px] pc2:h-[357px] rounded-[50px] flex sm-max:flex-col justify-between items-center pt-[14px] pl-[24px] pr-[24px] tv1:mt-[19px] pc2:mt-[40px] sm-max:h-auto
                md-max:flex-wrap md-max:justify-center md-max:gap-y-6">
                {secondaryQrCode && (
                    <div className="text-white text-[20px] flex justify-center font-extrabold sm-max:w-full md-max:w-full md-max:order-1">
                        <div className="pc2:w-[287px] pc2:h-[357px] tv1:w-[247px] tv1:h-[260px] space-y-4 bg-[#5EC262] rounded-[32px] p-[24px] sm-max:w-full sm-max:h-auto sm-max:items-center
                            md-max:h-[300px] md-max:flex md-max:flex-col md-max:justify-between">
                            <div className='flex gap-[11px] items-center justify-between sm-max:flex-col sm-max:items-start md-max:flex-row md-max:w-full'>
                                <div className="flex flex-col">
                                    {/* <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] font-bold max-w-[190px] md-max:text-[24px] break-words overflow-wrap-anywhere">{t('help.label', 'Помощь')}</div> */}
                                    <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] font-bold max-w-[190px] md-max:text-[24px] break-words overflow-wrap-anywhere">
                                        {secondaryQrProjectName ? `"${secondaryQrProjectName}"` : `${t('help.project', 'Проект')}`}
                                    </div>
                                </div>
                                <img src={`${phoneIcon.src}`} alt="phone" className="w-[30px] h-[50px] -mt-8 md-max:mt-0" />
                            </div>
                            <div className="flex flex-col items-center md-max:mt-2">
                                <img
                                    className="pc2:w-[190px] pc2:h-[190px] tv1:w-[150px] tv1:h-[150px] rounded-[20px] sm-max:mx-auto
                                    md-max:w-[160px] md-max:h-[160px]"
                                    src={`${API_BASE_URL}${secondaryQrCode}`}
                                    alt="Дополнительный QR код для проекта"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className={`${!secondaryQrCode ? 'flex-grow' : 'max-w-[1200px]'} w-full h-full pc2:h-[357px] tv1:h-[260px] bg-[rgba(217,217,217,1)] rounded-[20px] flex items-center justify-center p-[12px]
                    md-max:w-full md-max:order-3 md-max:mt-0 md-max:h-auto`}>
                    <div className="w-full h-full flex flex-col items-center justify-center md-max:py-6">
                        <div className="bg-white rounded-[16px] p-6 shadow-md border-[2px] border-[#5ec262] mx-auto w-full h-full flex flex-col items-center justify-center
                            md-max:p-4">
                            {currentName && (
                                <>
                                    <div className="text-[50px] pc:text-[60px] pc1:text-[50px] pc2:text-[40px] font-bold text-[#5ec262] mb-4 text-center break-words overflow-wrap-anywhere
                                        md-max:text-[40px]">
                                        {currentName.arabic}
                                    </div>
                                    <div className={`text-[34px] pc:text-[40px] pc1:text-[34px] pc2:text-[28px] font-medium text-center text-[#17181d] break-words overflow-wrap-anywhere
                                        md-max:text-[28px] ${notoSans.className} tt-text`}>
                                        {allahLang === 'tt' ? (currentName.transcriptionTatar || currentName.transcription) : currentName.transcription}
                                    </div>
                                    <div className="text-[28px] pc:text-[32px] pc1:text-[28px] pc2:text-[24px] text-gray-600 text-center mt-2 break-words overflow-wrap-anywhere
                                        md-max:text-[22px]">
                                        {allahLang === 'tt' ? (currentName.meaningTatar || currentName.meaning) : currentName.meaning}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {qrCode && (
                    <div className="text-white text-[20px] flex justify-center font-extrabold sm-max:w-full md-max:w-full md-max:order-2">
                        <div className="pc2:w-[287px] pc2:h-[357px] tv1:w-[247px] tv1:h-[260px] space-y-4 bg-[#5EC262] rounded-[32px] p-[24px] sm-max:w-full sm-max:h-auto
                             md-max:h-[300px] md-max:flex md-max:flex-col md-max:justify-between">
                            <div className='flex gap-[11px] items-center justify-between sm-max:flex-col sm-max:items-start md-max:flex-row md-max:w-full'>
                                <div className="flex flex-col">
                                    <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] font-bold md-max:text-[24px] break-words overflow-wrap-anywhere">{t('help.label', 'Помощь')}</div>
                                    <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] font-bold md-max:text-[24px] break-words overflow-wrap-anywhere">{t('help.mosque', 'мечети')}</div>
                                </div>
                                <img src={`${phoneIcon.src}`} alt="phone" className="w-[30px] h-[50px] -mt-8 md-max:mt-0" />
                            </div>
                            <div className="flex flex-col items-center md-max:mt-2">
                                <img
                                    className="pc2:w-[190px] pc2:h-[190px] tv1:w-[150px] tv1:h-[150px] rounded-[20px] sm-max:mx-auto
                                    md-max:w-[160px] md-max:h-[160px]"
                                    src={`${API_BASE_URL}${qrCode.startsWith('/') ? qrCode : '/' + qrCode}`}
                                    alt="Основной QR код для мечети"
                                    onError={(e) => {
                                        console.error('Ошибка загрузки QR-кода:', qrCode);
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full text-center text-[16px] text-gray-500 pc:mt-[10px] md-max:mt-4 break-words overflow-wrap-anywhere">
                {t('footnote.collective', '* — время, принятое мечетью для проведения коллективного намаза')}
            </div>

            <style jsx global>{`
                .tt-text {
                    font-variant-ligatures: none;
                    font-synthesis: none;
                    font-feature-settings: "liga" 0, "kern" 1;
                    letter-spacing: 0.01em;
                    line-height: 1.32;
                    -webkit-font-smoothing: antialiased;
                    text-rendering: geometricPrecision;
                }
            `}</style>
        </div>
    );
}