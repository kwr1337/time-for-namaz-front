'use client';

import React, { useEffect, useState } from 'react';
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

const PrayerTime: React.FC<PrayerTimeProps> = ({ time, label, highlight, pic, pic2, remainingTime, progress, className = '' }) => {
    return (
        <div
            className={`relative 
                tv:w-[150px] tv:h-[280px]
                pc1:w-[190px] pc1:h-[272x]
                pc:w-[229px] pc:h-[349px]
                rounded-[20px] p-[20px] flex flex-col justify-start items-start transition-all duration-300 ease-in-out sm-max:mx-auto
                ${highlight 
                    ? 'bg-[#5ec262] transform text-white !h-[429px] !w-[353px]  pc:!w-[353px] pc:!h-[429px] pc1:!w-[283px]  pc1:!h-[352px] tv:!h-[342px] tv:!w-[243px]  pc: pt-[20px] pr-[20px] pl-[20px] pb-[20px] sm-max:!h-[270px]  flex justify-between'
                    : `bg-white justify-between ${className}`}
            `}
        >
            <div className="w-full flex justify-between items-center">
                <div className={`
                    max-w-[70px] max-h-[70px]
                    pc1:max-w-[60px] pc1:max-h-[60px]
                    tv:max-w-[50px] tv:max-h-[50px]
                    ${highlight ? '!max-w-[120px] !max-h-[120px] pc1:!max-w-[100px] pc1:!max-h-[100px] tv:!max-w-[80px] tv:!max-h-[80px]' : 'text-[#17181d]'} flex bg-transparent`}>
                    <Image
                        className={highlight ? 'mt-0' : 'max-w-full max-h-full object-contain'} 
                        src={highlight ? pic2 : pic}
                        alt={label}
                    />
                </div>

                {highlight && (
                    <div className="absolute pc:max-w-[175px] pc1:max-w-[155px] tv:max-w-[125px] h-[112px] right-[4px] top-[4px] flex flex-col items-end">
                        <div className="w-[100%] text-right bg-white rounded-bl-[40px] rounded-[8px] rounded-tr-[19px] py-[4px] px-[8px] flex flex-col">
                            <div className="text-[#17181d] pc:text-[22px] tv:text-[16px]  font-normal">Через</div>
                            <div className="text-[#17181d] text-[30px] pc:text-[30px] pc1:text-[25px] tv:text-[20px] font-bold">
                                {formatTime(remainingTime)}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-start mt-[15%] w-full">
                <div className={`text-center text-[60px] pc:text-[60px] pc1:text-[50px] tv:text-[40px] leading-none font-[700] ${highlight ? 'text-white !text-[60px] pc:!text-[60px] pc1:!text-[55px] tv:!text-[50px]' : 'text-[#17181d]'}`}>
                    {time}
                </div>

                <div className={`text-center text-[40px] tv:text-[25px] font-[400] ${highlight ? 'text-white !text-[48px] pc:!text-[48px] tv:!text-[35px]' : 'text-[#17181d]'}`}>
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
    const [nearestPrayer, setNearestPrayer] = useState<string>('');
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [cities, setCities] = useState<City[]>([]);
    const [currentCityId, setCurrentCityId] = useState<number | null>(1);
    const [currentMosqueId, setCurrentMosqueId] = useState<number | null>(null);
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('Казань');
    const [selectedMosque, setSelectedMosque] = useState<string>('');
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secondaryQrCode, setSecondaryQrCode] = useState<string | null>(null);
    const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
    const [mosqueDropdownOpen, setMosqueDropdownOpen] = useState<boolean>(false);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
    const [currentNameIndex, setCurrentNameIndex] = useState<number>(0);
    const [currentName, setCurrentName] = useState(namesOfAllah[0]);

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
            pic2: fadjr2
        },
        {
            time: prayerTimes?.mechet || '00:00',
            label: 'Мечеть',
            highlight: nearestPrayer === 'mechet',
            pic: mosque,
            pic2: mosque
        },
        {
            time: prayerTimes?.shuruk || '00:00',
            label: 'Шурук',
            highlight: nearestPrayer === 'shuruk',
            pic: shuruk,
            pic2: shuruk2
        },
        {
            time: prayerTimes?.zuhr || '00:00',
            label: 'Зухр',
            highlight: nearestPrayer === 'zuhr',
            pic: zuhr,
            pic2: zuhr2
        },
        { time: prayerTimes?.asr || '00:00', label: 'Аср', highlight: nearestPrayer === 'asr', pic: asr, pic2: asr2 },
        {
            time: prayerTimes?.maghrib || '00:00',
            label: 'Магриб',
            highlight: nearestPrayer === 'maghrib',
            pic: magrib,
            pic2: magrib2
        },
        { time: prayerTimes?.isha || '00:00', label: 'Иша', highlight: nearestPrayer === 'isha', pic: isha, pic2: isha2 },
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
                    const response = await fetch(`${API_BASE_URL}/api/qrcodes/by-mosque/${currentMosqueId}`);
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
                        } else {
                            setSecondaryQrCode(null);
                        }
                    } else {
                        setQrCode(null);
                        setSecondaryQrCode(null);
                        console.log('Для текущей мечети нет QR-кодов');
                    }
                } catch (error) {
                    setQrCode(null);
                    setSecondaryQrCode(null);
                    console.error('Ошибка при получении QR-кодов:', error);
                }
            };

            fetchQRCode();
        } else {
            // Если мечеть не выбрана, очищаем QR-коды
            setQrCode(null);
            setSecondaryQrCode(null);
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
                console.log(`Запрос погоды из интервала для города: ${selectedCity}`);
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
                setCities(response.data);
                
                // Устанавливаем currentCityId только если он не был установлен ранее
                // или если изменился выбранный город
                if (!currentCityId || selectedCity) {
                    const selectedCityData = response.data.find(city => city.name === selectedCity);
                    if (selectedCityData) {
                        console.log(`Установка ID города из useEffect: ${selectedCityData.id} для города ${selectedCity}`);
                        setCurrentCityId(selectedCityData.id);
                    }
                }
            } catch (error) {
                console.error('Ошибка при загрузке списка городов:', error);
            }
        };
        
        getHijriDate();
        fetchCities();
    }, [selectedCity]); // Зависим только от selectedCity, currentCityId не добавляем

    useEffect(() => {
        const fetchMosques = async () => {
            try {
                const response = await axios.get<Mosque[]>(`${API_BASE_URL}/api/mosques`);
                setMosques(response.data);

                const mosquesInCity = response.data.filter(mosque => mosque.cityId === currentCityId);
                if (mosquesInCity.length > 0) {
                    setSelectedMosque(mosquesInCity[0].name);
                    setCurrentMosqueId(mosquesInCity[0].id);
                } else {
                    // Если у города нет мечетей, сбрасываем выбранную мечеть и QR-коды
                    setSelectedMosque('');
                    setCurrentMosqueId(null);
                    setQrCode(null);
                    setSecondaryQrCode(null);
                    console.log('У выбранного города нет мечетей, QR-коды сброшены');
                }
            } catch (error) {
                console.error('Ошибка при загрузке мечетей:', error);
                // При ошибке также сбрасываем данные
                setQrCode(null);
                setSecondaryQrCode(null);
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
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
            }
        };

        fetchPrayerTimes();
    }, [selectedCity, selectedMosque]);

    useEffect(() => {
        if (!prayerTimes) return;

        const prayerTimesArray = Object.entries(prayerTimes);
        let closestPrayer = '';
        let minDifference = Infinity;
        let previousPrayerName = '';
        let timeBetweenPrayers = 0;

        // Находим ближайший следующий намаз
        prayerTimesArray.forEach(([prayerName, time]) => {
            const difference = calculateTimeDifference(time);
            if (difference < minDifference && difference > 0) {
                minDifference = difference;
                closestPrayer = prayerName;
            }
        });

        // Находим предыдущий намаз для расчета общего интервала
        const sortedPrayers = [...prayerTimesArray].sort((a, b) => {
            return getTimeInMinutes(a[1]) - getTimeInMinutes(b[1]);
        });

        const closestPrayerIndex = sortedPrayers.findIndex(([name]) => name === closestPrayer);
        const previousPrayerIndex = closestPrayerIndex > 0 ? closestPrayerIndex - 1 : sortedPrayers.length - 1;
        
        previousPrayerName = sortedPrayers[previousPrayerIndex][0];
        
        // Расчет общего времени между намазами
        const currentPrayerTime = getTimeInMinutes(sortedPrayers[closestPrayerIndex][1]);
        const prevPrayerTime = getTimeInMinutes(sortedPrayers[previousPrayerIndex][1]);
        
        // Если предыдущий намаз позже текущего, это означает, что он был вчера
        timeBetweenPrayers = currentPrayerTime > prevPrayerTime 
            ? (currentPrayerTime - prevPrayerTime) * 60 * 1000 
            : ((currentPrayerTime + 24 * 60) - prevPrayerTime) * 60 * 1000;

        console.log(`Интервал между намазами ${previousPrayerName} и ${closestPrayer}: ${formatTime(timeBetweenPrayers)}`);
        
        setNearestPrayer(closestPrayer);
        setRemainingTime(minDifference);
        setTotalDuration(timeBetweenPrayers);

        const timer = setInterval(() => {
            setRemainingTime((prevTime) => {
                if (prevTime <= 1000) {
                    // Нашли следующий намаз
                    let nextPrayerIndex = sortedPrayers.findIndex(([name]) => name === closestPrayer) + 1;
                    if (nextPrayerIndex >= sortedPrayers.length) {
                        nextPrayerIndex = 0;
                    }
                    
                    const nextPrayerName = sortedPrayers[nextPrayerIndex][0];
                    const nextPrayerTime = sortedPrayers[nextPrayerIndex][1];
                    
                    // Обновим предыдущий намаз - это текущий, который только что прошел
                    previousPrayerName = closestPrayer;
                    
                    // Расчет нового общего времени между намазами
                    const newCurrentPrayerTime = getTimeInMinutes(sortedPrayers[nextPrayerIndex][1]);
                    const newPrevPrayerTime = getTimeInMinutes(sortedPrayers[nextPrayerIndex > 0 ? nextPrayerIndex - 1 : sortedPrayers.length - 1][1]);
                    
                    const newTimeBetweenPrayers = newCurrentPrayerTime > newPrevPrayerTime 
                        ? (newCurrentPrayerTime - newPrevPrayerTime) * 60 * 1000 
                        : ((newCurrentPrayerTime + 24 * 60) - newPrevPrayerTime) * 60 * 1000;
                    
                    setTotalDuration(newTimeBetweenPrayers);
                    setNearestPrayer(nextPrayerName);
                    
                    return calculateTimeDifference(nextPrayerTime);
                }
                return prevTime - 1000;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [prayerTimes]);

    // Функция для конвертации времени в минуты от начала дня
    const getTimeInMinutes = (timeString: string): number => {
        const [hours, minutes] = timeString.split(':').map(Number);
        return hours * 60 + minutes;
    };

    const handleMosqueSelect = (mosque: Mosque) => {
        setSelectedMosque(mosque.name);
        setCurrentMosqueId(mosque.id);
        setMosqueDropdownOpen(false);
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
            console.log(`Запрос погоды для города: ${cityName}`);
            // Правильно кодируем название города для URL
            const encodedCityName = encodeURIComponent(cityName);
            console.log(`Закодированное название: ${encodedCityName}`);
            
            // Добавляем метку времени для предотвращения кэширования
            const timestamp = new Date().getTime();
            const response = await axios.get(`https://api.weatherapi.com/v1/current.json?key=07574987d72a4422b5665010250505&q=${encodedCityName}&lang=ru&_t=${timestamp}`);
            console.log('Ответ API:', response.data);
            
            // Проверяем, что ответ относится к запрошенному городу
            if (response.data.location && response.data.location.name) {
                console.log(`API вернул данные для города: ${response.data.location.name}`);
            }
            
            const weatherInfo: WeatherData = {
                temperature: Math.round(response.data.current.temp_c),
                description: response.data.current.condition.text,
                icon: response.data.current.condition.code.toString(),
                city: cityName, // Используем выбранное название города, а не то, что вернул API
                updatedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
            };
            
            console.log('Обработанные погодные данные:', weatherInfo);
            setWeatherData(weatherInfo);
        } catch (error) {
            console.error('Ошибка при загрузке погоды через WeatherAPI:', error);
            
            // Попробуем альтернативный API - OpenWeatherMap
            try {
                console.log('Пробуем получить погоду через альтернативный API...');
                const encodedCityName = encodeURIComponent(cityName);
                const openWeatherResponse = await axios.get(
                    `https://api.openweathermap.org/data/2.5/weather?q=${encodedCityName},ru&appid=7da8513adbad99c86a8edc1c5f04bc04&units=metric&lang=ru`
                );
                console.log('Ответ OpenWeatherMap API:', openWeatherResponse.data);
                
                const weatherInfo: WeatherData = {
                    temperature: Math.round(openWeatherResponse.data.main.temp),
                    description: openWeatherResponse.data.weather[0].description,
                    // Мапирование кодов OpenWeatherMap на наши коды иконок (приблизительное)
                    icon: mapOpenWeatherCodeToInternalCode(openWeatherResponse.data.weather[0].id.toString()),
                    city: cityName,
                    updatedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                };
                
                console.log('Данные погоды с резервного API:', weatherInfo);
                setWeatherData(weatherInfo);
            } catch (backupError) {
                console.error('Ошибка при загрузке погоды через резервный API:', backupError);
                // Фиксированное значение как крайнее резервное
                setWeatherData({
                    temperature: 5,
                    description: 'Облачно',
                    icon: '1003',
                    city: cityName,
                    updatedAt: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                });
            }
        } finally {
            setIsLoadingWeather(false);
        }
    };

    // Определяем индекс текущей выделенной молитвы
    const getHighlightedPrayerIndex = () => {
        return prayers.findIndex(prayer => prayer.highlight === true);
    };

    return (
        <div className="w-[100%] h-screen bg-[#f6f6f6] p-[20px] overflow-auto pc1:p-[10px] pc2:p-[5px]  ">
            <div className="w-full border-[5px] border-white bg-[#eeeeee] rounded-[40px] flex flex-wrap xl:justify-between items-center p-[10px] xl-max:justify-center lg-max:flex-col sm-max:flex-col sm-max:gap-[20px] sm-max:items-center">
                <div className="flex flex-wrap items-center space-x-6 sm-max:flex-col sm-max:space-x-0 sm-max:gap-[10px] sm-max:items-center ">
                    <div className="text-[#17181d] text-[52px] font-[700] pt-[8px] pb-[8px] pr-[48px] pl-[48px]  tv:pt-[6px] tv:pb-[6px] tv:pr-[30px] tv:pl-[30px] bg-white rounded-[24px]">
                        {(() => {
                            const now = new Date();
                               const hours = now.getHours().toString().padStart(2, '0');
                            const minutes = now.getMinutes().toString().padStart(2, '0');
                            const seconds = now.getSeconds().toString().padStart(2, '0');
                            return (
                                <span>
                                    <span className="text-[52px] pc1:text-[52px] tv:text-[42px] ">{hours}:{minutes}</span>
                                    <span className="text-[32px] font-normal pc1:text-[32px] tv :text-[22px] ">:{seconds}</span>
                                </span>
                            );
                        })()}
                    </div>
                    <div className='flex gap-[5px] sm-max:flex-col sm-max:items-center sm-max:gap-[0px]'>
                        <div className="text-[#17181d] text-[40px] pc1:text-[40px] tv:text-[30px] font-normal ">
                            {new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })},
                        </div>
                        <div className="text-[#17181d] text-[40px] pc1:text-[40px] tv:text-[30px] ">
                            {new Date().toLocaleDateString('ru-RU', { weekday: 'long' })}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center text-center space-x-6 tv:space-x-4 lg-max:justify-center lg:flex-row sm-max:flex-col sm-max:gap-[15px]">
                    <div 
                        className="flex flex-col bg-white rounded-[25px] px-3 sm:px-4 md:px-5 lg:px-6 py-[10px] h-[70px] sm:h-[75px] md:h-[80px] lg:h-[86px] sm-max:px-3 sm-max:w-full sm-max:items-center"
                    >
                        <div className="text-[#a0a2b1] text-[12px] font-normal leading-[27.60px]">
                            Погода
                        </div>
                        <div className="text-[#17181d] text-[18px] font-normal leading-[27.60px] flex items-center justify-center">
                            {isLoadingWeather ? (
                                <div className="flex items-center ">
                                    <span className="animate-spin">⟳</span>
                                    Загрузка...
                                </div>
                            ) : weatherData ? (
                                <div className="flex items-center">
                                    <span className="mr-2 flex items-center scale-125">
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
                    <div className="flex flex-col bg-white rounded-[25px] tv:px-1  px-3 py-[10px] h-[70px] h-[86px] sm-max:px-3 sm-max:w-full sm-max:items-center">
                        <div className="text-[#a0a2b1] text-[12px] font-normal leading-[27.60px]">Дата по хиджре</div>
                        <div className="text-[#17181d] pc1:text-[24px] tv:text-[18px] font-normal leading-[27.60px]">{getHijriDate()}</div>
                    </div>
                    <div className="flex items-left gap-[24px] lg-max:w-full justify-center sm-max:flex-col sm-max:items-center sm-max:gap-[15px] sm-max:!ml-0">
                        <div className='flex flex-col bg-white rounded-[25px] px-3 sm:px-4 md:px-5 lg:px-6 pt-[10px] h-[70px] sm:h-[75px] md:h-[80px] lg:h-[86px] sm-max:px-3 sm-max:w-full sm-max:items-center'>
                            <div className="cursor-pointer relative z-10 text-[#17181d] text-[20px] sm:text-[24px] md:text-[28px] lg:text-[33px] sm-max:text-[25px] font-normal leading-[27.60px]"
                                onClick={() => setCityDropdownOpen(prev => !prev)}>
                                <div className="text-[#a0a2b1] text-[12px] sm:text-[14px] md:text-[16px] font-normal">Город</div>
                                {selectedCity}
                                {cityDropdownOpen && (
                                    <div className="absolute bg-white border rounded-lg shadow-lg w-[250px] max-h-[320px] overflow-x-hidden overflow-y-auto z-1000">
                                        {cities.map((city) => (
                                            <div key={city.id} className="p-2 hover:bg-gray-200 cursor-pointer pc1:text-[24px] tv:text-[18px]"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Предотвращаем всплытие события
                                                    setCityDropdownOpen(false);
                                                    setSelectedCity(city.name);
                                                    // Устанавливаем идентификатор города немедленно
                                                    setCurrentCityId(city.id);
                                                    // Немедленно вызываем fetchWeatherData для быстрого обновления
                                                    fetchWeatherData(city.name);
                                                    console.log(`Выбран город: ${city.name}, ID: ${city.id}`);
                                                }}>
                                                {city.name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col bg-white rounded-[25px] px-3 sm:px-4 md:px-5 lg:px-6 pt-[10px] h-[70px] sm:h-[75px] md:h-[80px] lg:h-[86px] sm-max:px-3 sm-max:w-full sm-max:items-center">
                            <div className="cursor-pointer relative z-10"
                                onClick={() => setMosqueDropdownOpen(prev => !prev)}>
                                <div className='text-[#a0a2b1] text-[12px] sm:text-[14px] md:text-[16px] font-normal'>Мечеть</div>
                                <div className="text-[#17181d] text-[18px] sm:text-[20px] md:text-[22px] lg:text-[24px] leading-[35.60px] sm-max:text-[25px]">{selectedMosque}</div>
                                {mosqueDropdownOpen && (
                                    <div className="absolute bg-white border rounded-lg shadow-lg w-[250px] max-h-96 overflow-y-auto z-1000">
                                        {mosques.filter(mosque => mosque.cityId === currentCityId).map((mosque) => (
                                            <div key={mosque.id} className="p-2 hover:bg-gray-200 cursor-pointer text-[#17181d]"
                                                onClick={() => handleMosqueSelect(mosque)}>
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

            <div className="flex items-center h-[397px] pc:h-[397px] pc1:h-[320px] tv:h-[300px] gap justify-between w-full border-[5px] border-white rounded-[48px] pt-[20px] pb-[20px] pl-[15px] pr-[15px] sm:pl-[20px] sm:pr-[20px] md:pl-[25px] md:pr-[25px] mt-[40px] sm-max:flex-wrap sm-max:justify-center sm-max:gap-[15px]">
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
                                remainingTime={remainingTime}
                                progress={calculateProgress(remainingTime, totalDuration)}
                                className={isNextToHighlighted ? 'w-[211px] pc1:w-[180px] pc2:w-[150px]' : ''}
                            />
                        </div>
                    );
                })}
            </div>

            <div className="w-full gap-[24px] h-[387px] sm:h-[300px] md:h-[330px] lg:h-[350px] xl:h-[387px] rounded-[50px] flex sm-max:flex-col justify-between items-center px-3 sm:px-4 md:px-6 lg:px-8 xl:px-12 py-4 relative mt-6 sm-max:gap-[20px] sm-max:h-auto">
                {secondaryQrCode && (
                    <div className="text-white text-[20px] flex justify-center font-extrabold sm-max:w-full">
                        <div className="w-[200px] sm:w-[220px] md:w-[240px] lg:w-[264px] xl:w-[287px] h-[280px] sm:h-[300px] md:h-[320px] lg:h-[340px] xl:h-[357px] space-y-4 bg-[#5EC262] rounded-[32px] p-[24px] sm-max:w-full sm-max:h-auto sm-max:items-center">
                            <div className='flex gap-[11px] items-center justify-between sm-max:flex-col sm-max:items-start'>
                                <div className="text-white text-left text-[22px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-bold">Помощь "Проект"</div>
                                <img src={`${phoneIcon.src}`} alt="phone" className="w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] md:w-[40px] md:h-[40px]" />
                            </div>
                            <div className="flex flex-col items-center">
                                <img 
                                    className="w-[140px] sm:w-[150px] md:w-[170px] lg:w-[180px] xl:w-[190px] h-[140px] sm:h-[150px] md:h-[170px] lg:h-[180px] xl:h-[190px] rounded-[20px] sm-max:mx-auto" 
                                    src={`${API_BASE_URL}${secondaryQrCode}`} 
                                    alt="Дополнительный QR код для проекта" 
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className={`${!secondaryQrCode ? 'flex-grow' : 'max-w-[1200px]'} w-full max-h-[387px] h-full bg-[rgba(217,217,217,1)] rounded-[32px] sm-max:h-[200px] flex items-center justify-center`}>
                    <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="bg-white rounded-[24px] p-6 shadow-md border-[2px] border-[#5ec262] mx-auto w-[95%] h-[90%] flex flex-col items-center justify-center">
                            <div className="text-[50px] pc:text-[60px] pc1:text-[50px] tv:text-[40px] font-bold text-[#5ec262] mb-4 text-center">
                                {currentName.arabic}
                            </div>
                            <div className="text-[34px] pc:text-[40px] pc1:text-[34px] tv:text-[28px] font-medium text-center text-[#17181d]">
                                {currentName.pronunciation}
                            </div>
                            <div className="text-[28px] pc:text-[32px] pc1:text-[28px] tv:text-[24px] text-gray-600 text-center mt-2">
                                {currentName.explanation}
                            </div>
                        </div>
                    </div>
                </div>

                {qrCode && (
                    <div className="text-white text-[20px] flex justify-center font-extrabold sm-max:w-full sm-max:mb-[200px]">
                        <div className="w-[200px] sm:w-[220px] md:w-[240px] lg:w-[264px] xl:w-[287px] h-[280px] sm:h-[300px] md:h-[320px] lg:h-[340px] xl:h-[357px] space-y-4 bg-[#5EC262] rounded-[32px] p-[24px] sm-max:w-full sm-max:h-auto">
                            <div className='flex gap-[11px] items-center justify-between sm-max:flex-col sm-max:items-start'>
                                <div className="text-white text-left text-[22px] sm:text-[24px] md:text-[28px] lg:text-[32px] font-bold">Помощь мечети</div>
                                <img src={`${phoneIcon.src}`} alt="phone" className="w-[30px] h-[30px] sm:w-[35px] sm:h-[35px] md:w-[40px] md:h-[40px]" />
                            </div>
                            <div className="flex flex-col items-center">
                                <img 
                                    className="w-[140px] sm:w-[150px] md:w-[170px] lg:w-[180px] xl:w-[190px] h-[140px] sm:h-[150px] md:h-[170px] lg:h-[180px] xl:h-[190px] rounded-[20px] sm-max:mx-auto" 
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