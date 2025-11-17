'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
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
    isGrace?: boolean; // 5-минутное окно после начала намаза
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

// Добавляем интерфейс для фиксированного времени намаза
interface FixedPrayerTime {
    id: number;
    cityId: number;
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
    cityName: string;
}

const PrayerTime: React.FC<PrayerTimeProps> = ({ time, label, highlight, pic, pic2, remainingTime, progress, className = '', fixedTime, isFixedTimeActive = false, t, currentLang, isGrace = false }) => {
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
                    ? `${(isFixedTimeActive ? '' : '')} ${/* цвет по умолчанию для highlight */''} ${className} ${(isFixedTimeActive ? '' : '')} ${(isGrace ? 'bg-[#F7C948]' : 'bg-[#5ec262]')} transform text-white !h-[429px] !w-[353px]  pc:!w-[353px] pc:!h-[429px] pc1:!w-[283px]  pc1:!h-[352px] tv:!h-[342px] tv:!w-[243px]  tv1:!h-[302px] tv1:!w-[203px] md-max:!h-[320px] md-max:!w-[240px] sm-max:!h-[270px] sm-max:!w-[200px] pc: pt-[20px] pr-[20px] pl-[20px] pb-[20px] flex justify-between`
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
                            <div className={`text-[#17181d] font-normal break-words overflow-wrap-anywhere ${currentLang === 'tt' ? 'pc:text-[18px] tv:text-[14px] tv1:text-[10px] md-max:text-[12px] sm-max:text-[10px]' : 'pc:text-[22px] tv:text-[16px] tv1:text-[12px] md-max:text-[14px] sm-max:text-[12px]'}`}>{isGrace ? t('time.now', 'Сейчас') : t('time.until', 'Через')}</div>
                            {!isGrace && (
                                <div className={`text-[#17181d] font-bold break-all overflow-wrap-anywhere ${currentLang === 'tt' ? 'text-[24px] pc:text-[24px] pc1:text-[20px] tv:text-[16px] tv1:text-[14px] md-max:text-[18px] sm-max:text-[14px]' : 'text-[30px] pc:text-[30px] pc1:text-[25px] tv:text-[20px] tv1:text-[18px] md-max:text-[22px] sm-max:text-[18px]'}`}>
                                    {formatTime(remainingTime, t)}
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
                                    width: isGrace ? '100%' : `${progress}%`,
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
    const [fixedPrayerTimes, setFixedPrayerTimes] = useState<FixedPrayerTime | null>(null);
    const [nearestPrayer, setNearestPrayer] = useState<string>('');
    const [activePrayer, setActivePrayer] = useState<string>(''); // с учетом грейс-периода
    const [isGracePeriod, setIsGracePeriod] = useState<boolean>(false);
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
    const [currentName, setCurrentName] = useState(namesOfAllah[0]);
    const [allahLang, setAllahLang] = useState<'ru' | 'tt'>('ru')
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const mosqueDropdownRef = useRef<HTMLDivElement>(null);
    const [loading, setLoading] = useState(true);
    const [prayerLang, setPrayerLang] = useState<'ru' | 'tt'>('ru');
    const [dictionaryMap, setDictionaryMap] = useState<Record<string, { ru: string; tt: string }>>({})

    // Интервал для обновления имени Аллаха каждые 30 секунд
    useEffect(() => {
        const nameInterval = setInterval(() => {
            const nextIndex = (currentNameIndex + 1) % namesOfAllah.length;
            setCurrentNameIndex(nextIndex);
            setCurrentName(namesOfAllah[nextIndex]);
        }, 30000); // 30 секунд

        return () => clearInterval(nameInterval);
    }, [currentNameIndex]);

    // Переключение языка блока Имен Аллаха каждые 30 секунд
    useEffect(() => {
        const interval = setInterval(() => {
            setAllahLang(prev => (prev === 'ru' ? 'tt' : 'ru'))
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    // Переключение языка подписей намазов каждые 30 секунд
    useEffect(() => {
        const interval = setInterval(() => {
            setPrayerLang(prev => (prev === 'ru' ? 'tt' : 'ru'))
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    // Загрузка словаря и сборка карты ключ -> {ru, tt}
    useEffect(() => {
        let isMounted = true
        ;(async () => {
            try {
                const entries = await dictionaryService.getAll()
                const map: Record<string, { ru: string; tt: string }> = {}
                for (const e of entries) {
                    if (!map[e.key]) map[e.key] = { ru: '', tt: '' }
                    if (e.locale === 'ru') map[e.key].ru = e.value
                    if (e.locale === 'tt') map[e.key].tt = e.value
                }
                if (isMounted) setDictionaryMap(map)
            } catch (e) {
                if (isMounted) setDictionaryMap({})
            }
        })()
        return () => { isMounted = false }
    }, [])

    const t = (key: string, fallback: string) => {
        const item = dictionaryMap[key]
        if (!item) return fallback
        return (prayerLang === 'ru' ? item.ru : item.tt) || fallback
    }

    const prayerLabels = {
        fajr: t('prayer.fajr', 'Фаджр'),
        shuruk: t('prayer.shuruk', 'Шурук'),
        zuhr: t('prayer.zuhr', 'Зухр'),
        asr: t('prayer.asr', 'Аср'),
        maghrib: t('prayer.maghrib', 'Магриб'),
        isha: t('prayer.isha', 'Иша'),
        mechet: t('prayer.mechet', 'Мечеть'),
    }

    const prayers = [
        {
            time: prayerTimes?.fajr || '00:00',
            label: prayerLabels.fajr,
            highlight: activePrayer === 'fajr',
            pic: fadjr,
            pic2: fadjr2,
            fixedTime: fixedPrayerTimes?.fajrActive ? fixedPrayerTimes?.fajr : null,
            isFixedTimeActive: fixedPrayerTimes?.fajrActive || false
        },
        {
            time: prayerTimes?.mechet || '00:00',
            label: prayerLabels.mechet,
            highlight: activePrayer === 'mechet',
            pic: mosque,
            pic2: mosque,
            fixedTime: fixedPrayerTimes?.mechetActive ? fixedPrayerTimes?.mechet : null,
            isFixedTimeActive: fixedPrayerTimes?.mechetActive || false
        },
        {
            time: prayerTimes?.shuruk || '00:00',
            label: prayerLabels.shuruk,
            highlight: activePrayer === 'shuruk',
            pic: shuruk,
            pic2: shuruk2,
            fixedTime: fixedPrayerTimes?.shurukActive ? fixedPrayerTimes?.shuruk : null,
            isFixedTimeActive: fixedPrayerTimes?.shurukActive || false
        },
        {
            time: prayerTimes?.zuhr || '00:00',
            label: prayerLabels.zuhr,
            highlight: activePrayer === 'zuhr',
            pic: zuhr,
            pic2: zuhr2,
            fixedTime: fixedPrayerTimes?.zuhrActive ? fixedPrayerTimes?.zuhr : null,
            isFixedTimeActive: fixedPrayerTimes?.zuhrActive || false
        },
        {
            time: prayerTimes?.asr || '00:00',
            label: prayerLabels.asr,
            highlight: activePrayer === 'asr',
            pic: asr,
            pic2: asr2,
            fixedTime: fixedPrayerTimes?.asrActive ? fixedPrayerTimes?.asr : null,
            isFixedTimeActive: fixedPrayerTimes?.asrActive || false
        },
        {
            time: prayerTimes?.maghrib || '00:00',
            label: prayerLabels.maghrib,
            highlight: activePrayer === 'maghrib',
            pic: magrib,
            pic2: magrib2,
            fixedTime: fixedPrayerTimes?.maghribActive ? fixedPrayerTimes?.maghrib : null,
            isFixedTimeActive: fixedPrayerTimes?.maghribActive || false
        },
        {
            time: prayerTimes?.isha || '00:00',
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
                        fetchFixedPrayerTime(selectedCityData.id);
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

    // Функция для загрузки времени намазов
    const fetchPrayerTimes = useCallback(async () => {
        try {
            const response = await axios.get<PrayerResponse>(
                `${API_BASE_URL}/api/prayers/today?cityName=${selectedCity}`
            );
            const { fajr, shuruk, zuhr, asr, maghrib, isha, mechet } = response.data;

            setPrayerTimes({
                fajr,
                shuruk,
                zuhr,
                asr,
                maghrib,
                isha,
                mechet,
            });
            console.log('Время намазов обновлено:', new Date().toLocaleString());
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
            // toast.error('Ошибка при загрузке времени намазов');
        }
    }, [selectedCity]);

    // Загрузка времени намазов при изменении города или мечети
    useEffect(() => {
        fetchPrayerTimes();
    }, [fetchPrayerTimes, selectedMosque]);

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

        // вычисляем активный намаз с учетом грейс-периода 5 минут
        const computeActiveWithGrace = () => {
            if (!nextPrayer) {
                setActivePrayer('');
                setIsGracePeriod(false);
                return;
            }

            // Найдем предыдущий намаз и его время
            const getTime = (name: string | undefined): string | null => {
                if (!name) return null;
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

            // активен тот, у кого время <= сейчас < время + 5 минут
            const graceMinutes = 5;
            const active = sorted.find(p => {
                const t = getTimeInMinutes(p.time as string);
                return t <= nowMin && nowMin < t + graceMinutes;
            });

            if (active) {
                setActivePrayer(active.name);
                setIsGracePeriod(true);
            } else {
                setActivePrayer(nextPrayer);
                setIsGracePeriod(false);
            }
        };

        computeActiveWithGrace();

        let animationFrameId: number;
        let lastUpdateTime = Date.now();

        const updateTimer = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastUpdateTime;
            lastUpdateTime = currentTime;

            setRemainingTime((prevTime) => {
                if (prevTime <= 1000) {
                    const {
                        nextPrayer: newNextPrayer,
                        remainingTime: newRemainingTime,
                        totalDuration: newTotalDuration,
                    } = calculateTimeToNextPrayer(prayerTimes, fixedPrayerTimes);

                    setNearestPrayer(newNextPrayer);
                    setTotalDuration(newTotalDuration);

                    // переоценить активный намаз с учётом грейса
                    computeActiveWithGrace();

                    return newRemainingTime;
                }
                // обновляем активный блок каждые тики, чтобы отловить окно 5 минут
                computeActiveWithGrace();
                return Math.max(0, prevTime - deltaTime);
            });

            animationFrameId = requestAnimationFrame(updateTimer);
        };

        animationFrameId = requestAnimationFrame(updateTimer);

        return () => {
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [prayerTimes, fixedPrayerTimes]);

    // Функция для конвертации времени в минуты от начала дня
    const getTimeInMinutes = (timeString: string): number => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const handleCitySelect = (city: City) => {
        try {
            setCityDropdownOpen(false);
            setSelectedCity(city.name);
            setCurrentCityId(city.id);
            localStorage.setItem('selectedCity', city.name);
            localStorage.setItem('currentCityId', city.id.toString());
            fetchWeatherData(city.name);
            fetchFixedPrayerTime(city.id);
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
    const fetchFixedPrayerTime = async (cityId: number) => {
        try {
            const response = await axios.get<FixedPrayerTime>(`${API_BASE_URL}/api/prayers/fixed-time/city/${cityId}`);
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

                    <div className='flex gap-[5px] 
                        lg-max:flex-col lg-max:items-center lg-max:gap-1
                        md-max:flex-col md-max:items-center md-max:gap-0'>
                        <div className="text-[#17181d] text-[40px] pc1:text-[40px] pc2:text-[30px] tv1:text-[20px] break-words overflow-wrap-anywhere
                            lg-max:text-[34px]
                            md-max:text-[28px]">
                            {(() => {
                                const d = new Date();
                                const dayNum = d.getDate();
                                const monthNum = d.getMonth() + 1;
                                const monthName = t(`month.${monthNum}`, d.toLocaleDateString('ru-RU', { month: 'long' }));
                                return `${dayNum} ${monthName}`;
                            })()},
                        </div>
                        <div className="text-[#17181d] text-[40px] pc1:text-[40px] pc2:text-[30px] tv1:text-[20px] break-words overflow-wrap-anywhere
                            lg-max:text-[34px]
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

                {/* Правый блок (информация) - без изменений для ПК */}
                <div className="flex flex-wrap items-center text-center space-x-6 pc2:space-x-4 tv1:space-x-2 
                    lg-max:space-x-0 lg-max:justify-center lg-max:w-full
                    md-max:flex-col md-max:gap-4 md-max:w-full">

                    {/* Блок хиджры */}
                    <div className="flex flex-col bg-white rounded-[25px] pc2:px-1 tv1:px-0 px-3 py-[10px] pc2:h-[86px] tv1:h-[56px] 
                        lg-max:px-4 lg-max:py-2 lg-max:min-w-[180px]
                        md-max:px-3 md-max:w-full md-max:items-center">
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
                                isGrace={isGracePeriod && prayer.highlight}
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
                                    <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] font-bold max-w-[190px] md-max:text-[24px] break-words overflow-wrap-anywhere">{t('help.label', 'Помощь')}</div>
                                    <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] font-bold max-w-[190px] md-max:text-[24px] break-words overflow-wrap-anywhere">
                                        {secondaryQrProjectName ? `"${secondaryQrProjectName}"` : `"${t('help.project', 'Проект')}"`}
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
                            <div className="text-[50px] pc:text-[60px] pc1:text-[50px] pc2:text-[40px] font-bold text-[#5ec262] mb-4 text-center break-words overflow-wrap-anywhere
                                md-max:text-[40px]">
                                {currentName.arabic}
                            </div>
                            <div className={`text-[34px] pc:text-[40px] pc1:text-[34px] pc2:text-[28px] font-medium text-center text-[#17181d] break-words overflow-wrap-anywhere
                                md-max:text-[28px] ${notoSans.className} tt-text`}>
                                {allahLang === 'tt' ? (currentName as any).transcriptionTatar || currentName.transcription : currentName.transcription}
                            </div>
                            <div className="text-[28px] pc:text-[32px] pc1:text-[28px] pc2:text-[24px] text-gray-600 text-center mt-2 break-words overflow-wrap-anywhere
                                md-max:text-[22px]">
                                {allahLang === 'tt' ? (currentName as any).meaningTatar || currentName.meaning : currentName.meaning}
                            </div>
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