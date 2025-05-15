'use client';

import React, { useEffect, useState, useRef } from 'react';
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

const PrayerTime: React.FC<PrayerTimeProps> = ({ time, label, highlight, pic, pic2, remainingTime, progress, className = '', fixedTime, isFixedTimeActive = false }) => {
    return (
        <div
            className={`relative 
                tv1:w-[140px] tv1:h-[230px] 
                tv:w-[150px] tv:h-[280px]
                pc1:w-[190px] pc1:h-[272x]
                pc:w-[229px] pc:h-[349px]
                rounded-[20px] p-[20px] flex flex-col justify-start items-start transition-all duration-300 ease-in-out sm-max:mx-auto
                    ${highlight
                    ? 'bg-[#5ec262] transform text-white !h-[429px] !w-[353px]  pc:!w-[353px] pc:!h-[429px] pc1:!w-[283px]  pc1:!h-[352px] tv:!h-[342px] tv:!w-[243px]  tv1:!h-[302px] tv1:!w-[203px]  pc: pt-[20px] pr-[20px] pl-[20px] pb-[20px] sm-max:!h-[270px]  flex justify-between'
                    : `bg-white justify-between ${className}`}
            `}
        >
            <div className="w-full flex justify-between items-center">
                <div className={`
                    max-w-[80px] max-h-[80px]
                    pc1:max-w-[70px] pc1:max-h-[70px]
                    tv:max-w-[60px] tv:max-h-[60px]
                    tv1:max-w-[50px] tv1:max-h-[50px]
                    ${highlight ? '!max-w-[120px] !max-h-[120px] pc1:!max-w-[100px] pc1:!max-h-[100px] tv:!max-w-[80px] tv:!max-h-[80px] tv1:!max-w-[60px] tv1:!max-h-[60px]' : 'text-[#17181d]'} flex bg-transparent`}>
                    <Image
                        className={highlight ? 'mt-0' : 'max-w-full max-h-full object-contain'} 
                        src={highlight ? pic2 : pic}
                        alt={label}
                    />
                </div>

                {isFixedTimeActive && (
                    <div className="absolute top-2 right-2 flex items-center">
                        {/* <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span> */}
                        {/* <span className="ml-1 text-[10px] text-green-600 font-bold">ФИКС.</span> */}
                    </div>
                )}

                {highlight && (
                    <div className="absolute pc:max-w-[175px] pc1:max-w-[155px] tv:max-w-[125px] tv1:max-w-[105px] h-[112px] right-[4px] top-[4px] flex flex-col items-end">
                        <div className="w-[100%] text-right bg-white rounded-bl-[40px] rounded-[8px] rounded-tr-[19px] py-[4px] px-[8px] flex flex-col">
                            <div className="text-[#17181d] pc:text-[22px] tv:text-[16px] tv1:text-[12px]  font-normal">Через</div>
                            <div className="text-[#17181d] text-[30px] pc:text-[30px] pc1:text-[25px] tv:text-[20px] tv1:text-[18px] font-bold">
                                {formatTime(remainingTime)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-start mt-[15%] w-full">
                {highlight && isFixedTimeActive && fixedTime && (
                    <div className={`text-center text-[60px] pc:text-[60px] pc1:text-[50px] tv:text-[40px] tv1:text-[35px] leading-none font-[700] ${highlight ? 'text-white !text-[60px] pc:!text-[60px] pc1:!text-[55px] tv:!text-[50px] tv1:!text-[45px]' : 'text-[#17181d]'}`}>
                        {fixedTime}*
                    </div>
                )}
                
                <div className={`text-center ${highlight && isFixedTimeActive && fixedTime ? 'text-[40px] pc:text-[40px] pc1:text-[35px] tv:text-[30px] tv1:text-[25px]' : 'text-[60px] pc:text-[60px] pc1:text-[50px] tv:text-[40px] tv1:text-[35px]'} leading-none font-[700] ${highlight ? `text-white ${isFixedTimeActive && fixedTime ? '!text-[40px] pc:!text-[40px] pc1:!text-[35px] tv:!text-[30px] tv1:!text-[25px]' : '!text-[60px] pc:!text-[60px] pc1:!text-[55px] tv:!text-[50px] tv1:!text-[45px]'}` : 'text-[#17181d]'}`}>
                    {time}
                </div>

                <div className={`text-center text-[40px] tv:text-[25px] tv1:text-[20px] font-[400] ${highlight ? 'text-white !text-[48px] pc:!text-[48px] tv:!text-[35px] tv1:!text-[30px]' : 'text-[#17181d]'}`}>
                    {label}
                </div>

                {highlight && (
                    <div className="w-full flex flex-col items-start justify-between mt-[20px]">
                        <div className="w-full h-[8px] bg-[rgba(255,255,255,0.2)] rounded-full">
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

const formatTime = (milliseconds: number): string => {
    const totalMinutes = Math.round(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
};

const calculateProgress = (remainingTime: number, totalDuration: number): number => {
    // Вычисляем пройденное время
    const elapsedTime = totalDuration - remainingTime;
    // Возвращаем процент прогресса
    return Math.min((elapsedTime / totalDuration) * 100, 100);
};

// Заменяем компоненты SVG на компоненты с изображениями
const WeatherIcon = ({ iconType }: { iconType: string }) => {
  let iconSrc;
  
  // Определяем, какую иконку использовать
  switch(iconType) {
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

export function Test() {
    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [fixedPrayerTimes, setFixedPrayerTimes] = useState<FixedPrayerTime | null>(null);
    const [nearestPrayer, setNearestPrayer] = useState<string>('');
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
    const cityDropdownRef = useRef<HTMLDivElement>(null);
    const mosqueDropdownRef = useRef<HTMLDivElement>(null);

    // Интервал для обновления имени Аллаха каждые 30 секунд
    useEffect(() => {
        const nameInterval = setInterval(() => {
            const nextIndex = (currentNameIndex + 1) % namesOfAllah.length;
            setCurrentNameIndex(nextIndex);
            setCurrentName(namesOfAllah[nextIndex]);
        }, 30000); // 30 секунд

        return () => clearInterval(nameInterval);
    }, [currentNameIndex]);

    const prayers = [
        {
            time: prayerTimes?.fajr || '00:00',
            label: 'Фаджр',
            highlight: nearestPrayer === 'fajr',
            pic: fadjr,
            pic2: fadjr2,
            fixedTime: fixedPrayerTimes?.fajrActive ? fixedPrayerTimes?.fajr : null,
            isFixedTimeActive: fixedPrayerTimes?.fajrActive || false
        },
        {
            time: prayerTimes?.mechet || '00:00',
            label: 'Мечеть',
            highlight: nearestPrayer === 'mechet',
            pic: mosque,
            pic2: mosque,
            fixedTime: fixedPrayerTimes?.mechetActive ? fixedPrayerTimes?.mechet : null,
            isFixedTimeActive: fixedPrayerTimes?.mechetActive || false
        },
        {
            time: prayerTimes?.shuruk || '00:00',
            label: 'Шурук',
            highlight: nearestPrayer === 'shuruk',
            pic: shuruk,
            pic2: shuruk2,
            fixedTime: fixedPrayerTimes?.shurukActive ? fixedPrayerTimes?.shuruk : null,
            isFixedTimeActive: fixedPrayerTimes?.shurukActive || false
        },
        {
            time: prayerTimes?.zuhr || '00:00',
            label: 'Зухр',
            highlight: nearestPrayer === 'zuhr',
            pic: zuhr,
            pic2: zuhr2,
            fixedTime: fixedPrayerTimes?.zuhrActive ? fixedPrayerTimes?.zuhr : null,
            isFixedTimeActive: fixedPrayerTimes?.zuhrActive || false
        },
        { 
            time: prayerTimes?.asr || '00:00', 
            label: 'Аср', 
            highlight: nearestPrayer === 'asr', 
            pic: asr, 
            pic2: asr2,
            fixedTime: fixedPrayerTimes?.asrActive ? fixedPrayerTimes?.asr : null,
            isFixedTimeActive: fixedPrayerTimes?.asrActive || false
        },
        {
            time: prayerTimes?.maghrib || '00:00',
            label: 'Магриб',
            highlight: nearestPrayer === 'maghrib',
            pic: magrib,
            pic2: magrib2,
            fixedTime: fixedPrayerTimes?.maghribActive ? fixedPrayerTimes?.maghrib : null,
            isFixedTimeActive: fixedPrayerTimes?.maghribActive || false
        },
        { 
            time: prayerTimes?.isha || '00:00', 
            label: 'Иша', 
            highlight: nearestPrayer === 'isha', 
            pic: isha, 
            pic2: isha2,
            fixedTime: fixedPrayerTimes?.ishaActive ? fixedPrayerTimes?.isha : null,
            isFixedTimeActive: fixedPrayerTimes?.ishaActive || false
        },
    ];

    const hijriMonths = [
        'Мухаррам', 'Сафар', 'Раби аль-авваль', 'Раби ас-сани',
        'Джумад аль-уля', 'Джумад ас-сания', 'Раджаб', 'Шаабан',
        'Рамадан', 'Шавваль', 'Зу-ль-када', 'Зу-ль-хиджа'
    ];

    const getHijriDate = () => {
        const hijriDate = moment().format('iD-iM-iYYYY');
        const [day, monthIndex, year] = hijriDate.split('-');
        const monthName = hijriMonths[parseInt(monthIndex) - 1];

        return `${day} ${monthName} ${year}`;
    };

    useEffect(() => {
        if (currentMosqueId) {
            const fetchQRCode = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}${API.GET_MOSQUE_QRCODES(currentMosqueId)}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();
                    if (data && Array.isArray(data) && data.length > 0) {
                        // Ищем основной QR-код (isPrimary === true)
                        const primaryQR = data.find(qr => qr.isPrimary === true);
                        // Ищем второстепенный QR-код (isPrimary === false)
                        const secondaryQR = data.find(qr => qr.isPrimary === false);
                        
                        // Устанавливаем основной QR-код
                        if (primaryQR) {
                            setQrCode(primaryQR.imageUrl);
                        } else if (data.length > 0) {
                            // Если основного нет, берем первый доступный
                            setQrCode(data[0].imageUrl);
                        } else {
                            setQrCode(null);
                        }
                        
                        // Устанавливаем второстепенный QR-код, если есть
                        if (secondaryQR) {
                            setSecondaryQrCode(secondaryQR.imageUrl);
                            setSecondaryQrProjectName(secondaryQR.projectName);
                           
                        } else {
                            setQrCode(null);
                            setSecondaryQrCode(null);
                            setSecondaryQrProjectName(null);
                            
                        }
                    } else {
                        setQrCode(null);
                        setSecondaryQrCode(null);
                        setSecondaryQrProjectName(null);
                        
                    }
                } catch (error) {
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
            console.log('Мечеть не выбрана, QR-коды сброшены');
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

    useEffect(() => {
        const fetchPrayerTimes = async () => {
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
                // toast.success('Время намазов успешно обновлено');
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
                // toast.error('Ошибка при загрузке времени намазов');
            }
        };

        fetchPrayerTimes();
    }, [selectedCity, selectedMosque]);

    useEffect(() => {
        if (!prayerTimes) return;

        // Используем функцию для расчета времени до следующего намаза с учетом фиксированного времени
        const { nextPrayer, remainingTime: nextRemainingTime, totalDuration: nextTotalDuration } = 
            calculateTimeToNextPrayer(prayerTimes, fixedPrayerTimes);
        
        setNearestPrayer(nextPrayer);
        setRemainingTime(nextRemainingTime);
        setTotalDuration(nextTotalDuration);

        let animationFrameId: number;
        let lastUpdateTime = Date.now();

        const updateTimer = () => {
            const currentTime = Date.now();
            const deltaTime = currentTime - lastUpdateTime;
            lastUpdateTime = currentTime;

            setRemainingTime((prevTime) => {
                if (prevTime <= 1000) {
                    // Когда время до намаза закончилось, пересчитываем следующий намаз
                    const { nextPrayer: newNextPrayer, remainingTime: newRemainingTime, totalDuration: newTotalDuration } = 
                        calculateTimeToNextPrayer(prayerTimes, fixedPrayerTimes);
                    
                    setNearestPrayer(newNextPrayer);
                    setTotalDuration(newTotalDuration);
                    
                    return newRemainingTime;
                }
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
                    temperature: Math.round(weatherInfo.temp_2 - 273.15),
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
        if (!prayerTimes) return { nextPrayer: '', remainingTime: 0, totalDuration: 0 };

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

        let closestPrayer = '';
        let minDifference = Infinity;
        
        // Находим ближайший следующий намаз
        for (const [prayerName, { time }] of Object.entries(prayerTimesDict)) {
            if (!time) continue;
            
            const difference = calculateTimeDifference(time);
            if (difference < minDifference && difference > 0) {
                minDifference = difference;
                closestPrayer = prayerName;
            }
        }

        // Находим предыдущий намаз для расчета общего интервала
        const sortedPrayers = Object.entries(prayerTimesDict)
            .filter(([_, { time }]) => time)
            .sort((a, b) => {
                return getTimeInMinutes(a[1].time) - getTimeInMinutes(b[1].time);
            });

        // Проверяем, есть ли хотя бы один намаз
        if (sortedPrayers.length === 0) {
            return { nextPrayer: '', remainingTime: 0, totalDuration: 0 };
        }

        // Проверка наличия ближайшего намаза
        if (!closestPrayer) {
            // Если не нашли ближайший намаз, берем первый доступный на следующий день
            closestPrayer = sortedPrayers[0][0];
            // Рассчитываем время до первого намаза следующего дня
            const firstPrayerTime = getTimeInMinutes(sortedPrayers[0][1].time);
            const currentTimeInMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
            minDifference = ((24 * 60) - currentTimeInMinutes + firstPrayerTime) * 60 * 1000;
        }

        const closestPrayerIndex = sortedPrayers.findIndex(([name]) => name === closestPrayer);
        
        // Проверка на корректность индекса ближайшего намаза
        if (closestPrayerIndex === -1) {
            return { nextPrayer: '', remainingTime: 0, totalDuration: 0 };
        }

        const previousPrayerIndex = closestPrayerIndex > 0 ? closestPrayerIndex - 1 : sortedPrayers.length - 1;
        
        // Расчет общего времени между намазами (с проверкой на валидность индексов)
        if (!sortedPrayers[closestPrayerIndex] || !sortedPrayers[previousPrayerIndex]) {
            return { nextPrayer: closestPrayer, remainingTime: minDifference, totalDuration: 24 * 60 * 60 * 1000 };
        }

        const currentPrayerTime = getTimeInMinutes(sortedPrayers[closestPrayerIndex][1].time);
        const prevPrayerTime = getTimeInMinutes(sortedPrayers[previousPrayerIndex][1].time);
        
        // Если предыдущий намаз позже текущего, это означает, что он был вчера
        const timeBetweenPrayers = currentPrayerTime > prevPrayerTime 
            ? (currentPrayerTime - prevPrayerTime) * 60 * 1000 
            : ((currentPrayerTime + 24 * 60) - prevPrayerTime) * 60 * 1000;

        return {
            nextPrayer: closestPrayer,
            remainingTime: minDifference,
            totalDuration: timeBetweenPrayers
        };
    };

    return (
        <div className="w-[100%] h-screen bg-[#f6f6f6] p-[20px] overflow-auto pc1:p-[10px] pc2:p-[5px]  ">
            <div className="w-full border-[5px] border-white bg-[#eeeeee] rounded-[40px] flex flex-wrap xl:justify-between items-center p-[10px] xl-max:justify-center lg-max:flex-col sm-max:flex-col sm-max:gap-[20px] sm-max:items-center">
                <div className="flex flex-wrap items-center space-x-6 sm-max:flex-col sm-max:space-x-0 sm-max:gap-[10px] sm-max:items-center ">
                    <div className="text-[#17181d] text-center text-[52px] font-[700] pt-[8px] pb-[8px] pr-[48px] pl-[48px]  pc2:pt-[6px] pc2:pb-[6px] pc2:pr-[30px] pc2:pl-[30px]  tv1:pt-[4px] tv1:pb-[4px] tv1:pr-[25px] tv1:pl-[25px] bg-white rounded-[24px]">
                        {(() => {
                            const now = new Date();
                            const hours = now.getHours().toString().padStart(2, '0');
                            const minutes = now.getMinutes().toString().padStart(2, '0');
                            const seconds = now.getSeconds().toString().padStart(2, '0');
                            return (
                                <div className="flex items-center justify-center">
                                    <span className="text-[52px] pc1:text-[52px] pc2:text-[42px] tv1:text-[32px]">{hours}</span>
                                    <span className="text-[52px] pc1:text-[52px] pc2:text-[42px] tv1:text-[32px] animate-[softBlink_1.5s_ease-in-out_infinite]">:</span>
                                    <span className="text-[52px] pc1:text-[52px] pc2:text-[42px] tv1:text-[32px]">{minutes}</span>
                                    <span className="text-[32px] font-normal pc1:text-[32px] pc2:text-[22px] tv1:text-[16px] mt-[14px] animate-[softBlink_1.5s_ease-in-out_infinite]">:</span>
                                    <span className="text-[32px] font-normal pc1:text-[32px] pc2:text-[22px] tv1:text-[16px] mt-[14px]">{seconds}</span>
                                </div>
                            );
                        })()}
                        <style jsx>{`
                            @keyframes softBlink {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0.3; }
                            }
                        `}</style>
                    </div>
                    <div className='flex gap-[5px] sm-max:flex-col sm-max:items-center sm-max:gap-[0px]'>
                        <div className="text-[#17181d] text-[40px] pc1:text-[40px] pc2:text-[30px] tv1:text-[20px] ">
                            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })},
                        </div>
                        <div className="text-[#17181d] text-[40px] pc1:text-[40px] pc2:text-[30px] tv1:text-[20px] ">
                            {new Date().toLocaleDateString('ru-RU', { weekday: 'long' })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center text-center space-x-6 pc2:space-x-4 tv1:space-x-2 lg-max:justify-center lg:flex-row sm-max:flex-col sm-max:gap-[15px]">
                    <div 
                        className="flex flex-col bg-white rounded-[25px] px-3 sm:px-4 md:px-5 lg:px-6 py-[10px] pc2:h-[86px] tv1:h-[56px] sm-max:px-3 sm-max:w-full sm-max:items-center"
                    >
                        <div className="text-[#a0a2b1] text-[12px] font-normal pc2:leading-[27.60px] tv1:leading-[17.60px] tv1:text-[10px]">
                            Погода
                    </div>
                        <div className="text-[#17181d] pc2:text-[18px] tv1:text-[14px] font-normal pc2:leading-[27.60px] tv1:leading-[17.60px] flex items-center justify-center">
                            {isLoadingWeather ? (
                                <div className="flex items-center ">
                                    <span className="animate-spin">⟳</span>
                                    Загрузка...
                    </div>
                            ) : weatherData ? (
                                <div className="flex items-center">
                                    <span className="mr-2 flex items-center pc2:scale-125 tv1:scale-100">
                                        {mapWeatherCodeToIcon(weatherData.icon)}
                                    </span>
                                    <span className="font-normal">{weatherData.temperature}°C</span>
                                </div>
                            ) : (
                                <div className="flex items-center">
                                    <span className="mr-2 scale-125">
                                        <WeatherIcon iconType="cloudy" />
                                    </span>
                                    4°C
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col bg-white rounded-[25px] pc2:px-1 tv1:px-0  px-3 py-[10px] pc2:h-[86px] tv1:h-[56px] sm-max:px-3 sm-max:w-full sm-max:items-center">
                        <div className="text-[#a0a2b1] pc2:text-[12px] font-normal pc2:leading-[27.60px] tv1:leading-[17.60px] tv1:text-[10px] ">Дата по хиджре</div>
                        <div className="text-[#17181d] pc1:text-[24px] pc2:text-[18px] tv1:text-[14px] font-normal  pc2:leading-[27.60px] tv1:leading-[17.60px]">{getHijriDate()}</div>
                    </div>
                    <div className="flex items-left gap-[10px] items-center lg-max:w-full justify-center ">
                        <div className='flex flex-col bg-white rounded-[25px] px-3 sm:px-4 md:px-5 lg:px-6 pt-[10px] pc2:h-[86px] tv1:h-[56px] sm-max:px-3 sm-max:w-full sm-max:items-center'>
                            <div className="cursor-pointer relative z-10 text-[#17181d] pc1:text-[24px] pc2:text-[18px] tv1:text-[14px] font-normal pc2:leading-[27.60px] tv1:leading-[17.60px]"
                                onClick={() => setCityDropdownOpen(prev => !prev)} ref={cityDropdownRef}>
                                <div className="text-[#a0a2b1] pc2:text-[12px] tv1:text-[10px]  font-normal">Город</div>
                                {selectedCity}
                                {cityDropdownOpen && (
                                    <div className="absolute bg-white border rounded-lg shadow-lg w-[250px] max-h-[320px] overflow-x-hidden overflow-y-auto z-1000">
                                        {cities.map((city) => (
                                            <div key={city.id} className="p-2 hover:bg-gray-200 cursor-pointer text-left pc1:text-[24px] pc2:text-[18px] tv1:text-[14px]"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setCityDropdownOpen(false);
                                                    handleCitySelect(city);
                                                }}>
                                                {city.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col bg-white rounded-[25px] px-3 sm:px-4 md:px-5 lg:px-6 pt-[10px] pc2:h-[86px] tv1:h-[56px] sm-max:px-3 sm-max:w-full sm-max:items-center">
                            <div className="cursor-pointer relative z-10"
                                onClick={() => setMosqueDropdownOpen(prev => !prev)} ref={mosqueDropdownRef}>
                                <div className='text-[#a0a2b1] pc2:text-[12px] tv1:text-[10px] pc2:leading-[27.60px] tv1:leading-[17.60px] font-normal'>Мечеть</div>
                                <div className="text-[#17181d] pc1:text-[24px] pc2:text-[18px] tv1:text-[14px] font-normal pc2:leading-[27.60px] tv1:leading-[17.60px]">{selectedMosque}</div>
                                {mosqueDropdownOpen && (
                                    <div className="absolute right-0 bg-white border rounded-lg shadow-lg w-[250px] max-h-96 overflow-y-auto z-1000">
                                        {mosques
                                            .filter(mosque => mosque.cityId === currentCityId)
                                            .sort((a, b) => a.name.localeCompare(b.name, 'ru'))
                                            .map((mosque) => (
                                                <div key={mosque.id} className="p-2 hover:bg-gray-200 text-left cursor-pointer text-[#17181d] whitespace-nowrap overflow-hidden text-ellipsis"
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

                        <div className="sm-max:mt-2">
                            <img className="w-[45px] h-[45px] sm:w-[50px] sm:h-[50px] md:w-[55px] md:h-[55px] lg:w-[61px] lg:h-[61px] rounded-[20px]" src={getLogoUrl()} alt="avatar" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center h-[397px] pc:h-[397px] pc1:h-[320px] tv:h-[300px] tv1:h-[250px] gap justify-between w-full border-[5px] border-white rounded-[48px] pt-[20px] pb-[20px] pl-[15px] pr-[15px] sm:pl-[20px] sm:pr-[20px] md:pl-[25px] md:pr-[25px] mt-[40px] sm-max:flex-wrap sm-max:justify-center sm-max:gap-[15px]">
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
                            remainingTime={highlightedIndex !== -1 ? remainingTime : 0}
                            progress={highlightedIndex !== -1 ? calculateProgress(remainingTime, totalDuration) : 0}
                            className={isNextToHighlighted ? 'w-[211px] pc1:w-[180px] pc2:w-[150px]' : ''}
                            fixedTime={prayer.fixedTime}
                            isFixedTimeActive={prayer.isFixedTimeActive}
                        />
                    </div>
                    );
                })}
            </div>

            <div className="w-full gap-[24px] pc2:h-[357px]  rounded-[50px] flex sm-max:flex-col justify-between items-center px-3 tv1:mt-[30px] pc2:mt-[40px] sm-max:h-auto">
                {secondaryQrCode && (
                <div className="text-white text-[20px] flex justify-center font-extrabold sm-max:w-full">
                        <div className="pc2:w-[287px] pc2:h-[357px] tv1:w-[247px] tv1:h-[260px] space-y-4 bg-[#5EC262] rounded-[32px] p-[24px] sm-max:w-full sm-max:h-auto sm-max:items-center">
                        <div className='flex gap-[11px] items-center justify-between sm-max:flex-col sm-max:items-start'>
                            <div className="flex flex-col">
                                <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] font-bold  max-w-[190px]">Помощь</div>
                                <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] whitespace-nowrap  font-bold  max-w-[190px]"> {secondaryQrProjectName ? `"${secondaryQrProjectName}"` : '"Проект"'}</div>
                        </div>
                            <img src={`${phoneIcon.src}`} alt="phone" className="w-[30px] h-[40px] -mt-8" />
                            </div>
                            <div className="flex flex-col items-center">
                                <img 
                                    className="pc2:w-[190px] pc2:h-[190px] tv1:w-[150px] tv1:h-[150px] rounded-[20px] sm-max:mx-auto" 
                                    src={`${API_BASE_URL}${secondaryQrCode}`} 
                                    alt="Дополнительный QR код для проекта" 
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className={`${!secondaryQrCode ? 'flex-grow' : 'max-w-[1200px]'} w-full max-h-[387px] pc2:h-full tv1:h-[260px] bg-[rgba(217,217,217,1)] rounded-[32px] flex items-center justify-center`}>
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="bg-white rounded-[24px] p-6 shadow-md border-[2px] border-[#5ec262] mx-auto w-[95%] h-[90%] flex flex-col items-center justify-center">
                            <div className="text-[50px] pc:text-[60px] pc1:text-[50px] pc2:text-[40px] font-bold text-[#5ec262] mb-4 text-center">
                                {currentName.arabic}
                            </div>
                            <div className="text-[34px] pc:text-[40px] pc1:text-[34px] pc2:text-[28px] font-medium text-center text-[#17181d]">
                                {currentName.pronunciation}
                            </div>
                            <div className="text-[28px] pc:text-[32px] pc1:text-[28px] pc2:text-[24px] text-gray-600 text-center mt-2">
                                {currentName.explanation}
                            </div>
                        </div>
                    </div>
                </div>

                {qrCode && (
                <div className="text-white text-[20px] flex justify-center font-extrabold sm-max:w-full sm-max:mb-[200px]">
                        <div className="pc2:w-[287px] pc2:h-[357px]  tv1:w-[247px] tv1:h-[260px] space-y-4 bg-[#5EC262] rounded-[32px] p-[24px] sm-max:w-full sm-max:h-auto">
                        <div className='flex gap-[11px] items-center justify-between sm-max:flex-col sm-max:items-start'>
                             <div className="flex flex-col">
                                <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] font-bold">Помощь</div>
                                <div className="text-white text-left pc2:text-[28px] tv1:text-[20px] font-bold">мечети</div>
                        </div>
                            <img src={`${phoneIcon.src}`} alt="phone" className="w-[30px] h-[40px] -mt-8" />
                    </div>
                            <div className="flex flex-col items-center">
                                <img 
                                    className="pc2:w-[190px] pc2:h-[190px] tv1:w-[150px] tv1:h-[150px] rounded-[20px] sm-max:mx-auto" 
                                    src={`${API_BASE_URL}${qrCode}`} 
                                    alt="Основной QR код для мечети" 
                                />
                </div>
            </div>
        </div>
                )}
            </div>
        </div>
    );
}