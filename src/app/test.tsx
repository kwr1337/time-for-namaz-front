'use client';

import React, {useEffect, useState} from 'react';
import asr from '../pic/asr-1.png';
import asr2 from '../pic/asr-2.png';
import fadjr from '../pic/fadjr-1.png';
import fadjr2 from '../pic/fadjr-2.png';
import isha from '../pic/isha-1.png';
import isha2 from '../pic/isha-2.png';
import magrib from '../pic/magrib-1.png';
import magrib2 from '../pic/magrib-2.png';
import shuruk from '../pic/shuruk-1.png';
import shuruk2 from '../pic/shuruk-2.png';
import zuhr from '../pic/zuhr-1.png';
import zuhr1 from '../pic/zuhr-2.png';
import woman from '../pic/woman.png';
import qr from '../pic/qr.png';
import Image, {StaticImageData} from 'next/image';
import zuhr2 from "@/pic/zuhr-2.png";
import axios from "axios";
import moment from 'moment-hijri';
import namesOfAllah from "@/namesOfAllah/namesOfAllah";
import {API_BASE_URL} from '@/config/config'

type PrayerTimeProps = {
    time: string;
    label: string;
    highlight?: boolean;
    pic: StaticImageData;
    pic2: StaticImageData;
    remainingTime: number;
    progress: number;
};

interface PrayerTimes {
    fajr: string;
    shuruk: string;
    zuhr: string;
    asr: string;
    maghrib: string;
    isha: string;
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

const PrayerTime: React.FC<PrayerTimeProps> = ({time, label, highlight, pic, pic2, remainingTime, progress}) => {
    return (
        <div
            className={`w-[200px] h-[200px] pc1:w-[230px] pc1:h-[230px] pc:w-[302px] pc:h-[302px] mx-auto rounded-[50px] p-[20px] flex flex-col justify-start ${
                highlight ? 'bg-[#5ec262]' : 'bg-white'
            }`}
        >
            {/* Верхняя часть: Иконка и блок времени */}
            <div className="flex items-center"> 
                {/* Иконка */}
                <div className="w-[50px] h-[50px] pc:w-[88px] pc:h-[88px] flex bg-transparent">
                    <Image
                        className="max-w-full max-h-full object-contain"
                        src={highlight ? pic2 : pic}
                        alt={label}
                    />
                </div>

                {/* Оставшееся время */}
                {highlight && (
                    <div className="w-full flex flex-col items-end justify-between">
                        <div className="w-[87%] pc:w-[91%] bg-white rounded-tr-[50px] rounded-[10px] py-1 px-2 pc:px-4 pc:py-2 flex flex-col">
                            <div className="text-[#a0a2b1] text-[10px] pc:text-sm font-normal">осталось</div>
                            <div className="text-[#17181d] text-[12px] pc:text-base font-bold">
                                {formatTime(remainingTime)}
                            </div>
                        </div>
                        {/* Прогресс-бар */}
                        <div className="w-[87%] pc:w-[91%] h-2 bg-gray-200 rounded-full mt-1 pc:mt-2">
                            <div
                                className="h-full bg-white rounded-full"
                                style={{width: `${progress}%`}}
                            ></div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex flex-col items-start mt-[15%]">
                {/* Время */}
                <div
                    className={`text-center text-[45px] pc:text-[64px] leading-none font-light ${
                        highlight ? 'text-white' : 'text-[#17181d]'
                    }`}
                >
                    {time}
                </div>

                {/* Название молитвы */}
                <div
                    className={`text-center text-[22px] pc:text-[30px] font-bold ${
                        highlight ? 'text-white' : 'text-[#17181d]'
                    }`}
                >
                    {label}
                </div>
            </div>
        </div>
    );
};



// Функция для расчета разницы времени в миллисекундах
const calculateTimeDifference = (targetTime: string): number => {
    const currentTime = new Date();
    // Обнуляем секунды и миллисекунды у текущего времени для точного расчета
    currentTime.setSeconds(0, 0);
    
    const [hours, minutes] = targetTime.split(':').map(Number);
    const targetDateTime = new Date(currentTime);
    targetDateTime.setHours(hours, minutes, 0, 0);

    const difference = targetDateTime.getTime() - currentTime.getTime();
    return Math.max(difference, 0);
};

// Форматирование времени в часы и минуты
const formatTime = (milliseconds: number): string => {
    // Округляем до целых минут
    const totalMinutes = Math.round(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
        return `${hours} ч ${minutes} мин`;
    }
    return `${minutes} мин`;
};

const calculateProgress = (remainingTime: number, totalDuration: number): number => {
    return Math.min((1 - remainingTime / totalDuration) * 100, 100);
};

export function Test() {

    const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
    const [nearestPrayer, setNearestPrayer] = useState<string | null>(null);
    const [remainingTime, setRemainingTime] = useState<number>(0);
    const [totalDuration, setTotalDuration] = useState<number>(0);
    const [cities, setCities] = useState<City[]>([]);
    const [mosques, setMosques] = useState<Mosque[]>([]);
    const [selectedCity, setSelectedCity] = useState<string>('Казань');
    const [selectedMosque, setSelectedMosque] = useState<string | null>(null);
    const [hijriDate, setHijriDate] = useState(null);
    const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
    const [mosqueDropdownOpen, setMosqueDropdownOpen] = useState<boolean>(false);
    const [mosqueName, setMosqueName] = useState<string | null>(null);
    const [currentCityId, setCurrentCityId] = useState<number | null>(null);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentName, setCurrentName] = useState(namesOfAllah[currentIndex]);
    const [qrCode, setQrCode] = useState('');
    const [currentMosqueId, setCurrentMosqueId] = useState<number | null>(null);
    const [state, setState] = useState({
        prayerTimes: null,
        nearestPrayer: null,
        remainingTime: 0,
        totalDuration: 0,
        cities: [],
        mosques: [],
        selectedCity: 'Казань',
        selectedMosque: null,
        hijriDate: null,
        currentCityId: null,
        currentMosqueId: null,
    });

    const prayers = [
        {
            time: prayerTimes?.fajr || '00:00',
            label: 'Фаджр',
            highlight: nearestPrayer === 'fajr',
            pic: fadjr,
            pic2: fadjr2
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
        {time: prayerTimes?.asr || '00:00', label: 'Аср', highlight: nearestPrayer === 'asr', pic: asr, pic2: asr2},
        {
            time: prayerTimes?.maghrib || '00:00',
            label: 'Магриб',
            highlight: nearestPrayer === 'maghrib',
            pic: magrib,
            pic2: magrib2
        },
        {time: prayerTimes?.isha || '00:00', label: 'Иша', highlight: nearestPrayer === 'isha', pic: isha, pic2: isha2},
    ];

    const hijriMonths = [
        'Мухаррам', 'Сафар', 'Раби аль-авваль', 'Раби ас-сани',
        'Джумад аль-уля', 'Джумад ас-сания', 'Раджаб', 'Шаабан',
        'Рамадан', 'Шавваль', 'Зу-ль-када', 'Зу-ль-хиджа'
    ];


    const getHijriDate = () => {
        const hijriDate = moment().format('iD-iM-iYYYY'); // Форматирование даты по Хиджре
        const [day, monthIndex, year] = hijriDate.split('-');
        const monthName = hijriMonths[parseInt(monthIndex) - 1]; // Получаем название месяца на русском

        return `${day} ${monthName} ${year}`;
    };

    // Запрос данных о городах
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const response = await axios.get<City[]>(`${API_BASE_URL}/api/cities`);
                setCities(response.data);
                // Устанавливаем cityId для выбранного города
                const selectedCityData = response.data.find(city => city.name === selectedCity);
                setCurrentCityId(selectedCityData?.id || null); // Устанавливаем cityId
            } catch (error) {
                console.error('Ошибка при загрузке списка городов:', error);
            }
        };
        getHijriDate()
        fetchCities();
    }, [selectedCity]); // Добавлено selectedCity как зависимость

    useEffect(() => {
        const fetchMosques = async () => {
            try {
                const response = await axios.get<Mosque[]>(`${API_BASE_URL}/api/mosques`);
                setMosques(response.data);

                // Устанавливаем первую мечеть для выбранного города по умолчанию
                const mosquesInCity = response.data.filter(mosque => mosque.cityId === currentCityId);
                if (mosquesInCity.length > 0) {
                    setSelectedMosque(mosquesInCity[0].name)
                    setCurrentMosqueId(mosquesInCity[0].id)
                } else {
                    setSelectedMosque(null); // Если мечетей нет, сбрасываем выбор
                }
            } catch (error) {
                console.error('Ошибка при загрузке мечетей:', error);
            }
        };

        fetchMosques();
    }, [currentCityId]); // Теперь запрос зависит от идентификатора выбранного города

    useEffect(() => {
        const fetchPrayerTimes = async () => {
            try {
                const response = await axios.get<PrayerResponse>(
                    `${API_BASE_URL}/api/prayers/today?cityName=${selectedCity}`
                );
                const {fajr, shuruk, zuhr, asr, maghrib, isha} = response.data;

                setPrayerTimes({
                    fajr,
                    shuruk,
                    zuhr,
                    asr,
                    maghrib,
                    isha,
                });
                setMosqueName(mosqueName);
                setHijriDate(hijriDate);
            } catch (error) {
                console.error('Ошибка при загрузке данных:', error);
            }
        };

        fetchPrayerTimes();
    }, [selectedCity, selectedMosque]); // Добавлено 'selectedMosque' как зависимость

    useEffect(() => {
        if (!prayerTimes) return;

        const prayerTimesArray = Object.entries(prayerTimes);
        let closestPrayer = '';
        let minDifference = Infinity;

        prayerTimesArray.forEach(([prayerName, time]) => {
            const difference = calculateTimeDifference(time);
            if (difference < minDifference && difference > 0) {
                minDifference = difference;
                closestPrayer = prayerName;
            }
        });

        setNearestPrayer(closestPrayer);
        setRemainingTime(minDifference);
        setTotalDuration(minDifference);

        const timer = setInterval(() => {
            setRemainingTime((prevTime) => {
                if (prevTime <= 1000) {
                    let nextPrayerIndex = prayerTimesArray.findIndex(([name]) => name === closestPrayer) + 1;
                    if (nextPrayerIndex >= prayerTimesArray.length) {
                        nextPrayerIndex = 0; // Переход на первый намаз, если все намазы прошли
                    }
                    const nextPrayerName = prayerTimesArray[nextPrayerIndex][0];
                    const nextPrayerTime = prayerTimesArray[nextPrayerIndex][1];
                    setNearestPrayer(nextPrayerName);
                    return calculateTimeDifference(nextPrayerTime);
                }
                return prevTime - 1000;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [prayerTimes, nearestPrayer])

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) => (prevIndex + 1) % namesOfAllah.length);
            setCurrentName(namesOfAllah[(currentIndex + 1) % namesOfAllah.length]);
        }, 30000);

        return () => clearInterval(interval);
    }, [currentIndex]);

    useEffect(() => {
        if (currentMosqueId) {
            const fetchQRCode = async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/qrcodes/by-mosque/${currentMosqueId}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();
                    if (data.imageUrl) {
                        setQrCode(data.imageUrl); // Устанавливаем QR-код
                    } else {
                        setQrCode(''); // Если QR-код не найден
                    }
                } catch (error) {
                    setQrCode(''); // Ошибка, сбрасываем QR-код
                    console.error('Ошибка при получении QR-кода:', error);
                }
            };

            fetchQRCode(); // Запрос на получение QR-кода для выбранной мечети
        }
    }, [currentMosqueId]); // Зависимость от ID мечети


    const handleMosqueSelect = (mosque: Mosque) => {
        setSelectedMosque(mosque.name);
        setCurrentMosqueId(mosque.id); // Устанавливаем идентификатор текущей мечети
        setMosqueDropdownOpen(false); // Закрываем выпадающий список
    };

    const getLogoUrl = () => {
        const mosque = mosques.find(m => m.name === selectedMosque && m.cityId === currentCityId);
        const city = cities.find(c => c.id === currentCityId);

        if (mosque?.logoUrl) {
            return `${API_BASE_URL}/${mosque.logoUrl}`;
        } else if (city?.logoUrl) {
            return `${API_BASE_URL}${city.logoUrl}`;
        } else {
            return 'https://via.placeholder.com/61x61'; // URL заглушки, если логотипа нет
        }
    };

    return (
        <div className="w-[100%] h-screen  bg-[#f6f6f6] p-[20px] overflow-auto">
            <div
                className="w-full bg-[#eeeeee] rounded-[40px] flex flex-wrap  2xl:justify-between items-center p-[10px] xl-max:justify-center  lg-max:flex-col  ">

                <div className="flex flex-wrap items-center space-x-6">
                    <div className="text-[#17181d] text-[62px] lg:text-[52px] xl:text-[62px] font-extralight">
                        {new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
                    </div>
                    <div>
                        <div className="text-[#17181d] text-[24px] lg:text-[20px] xl:text-[24px] font-extrabold">
                            {new Date().toLocaleDateString('ru-RU', {day: 'numeric', month: 'long'})}
                        </div>
                        <div className="text-[#17181d] text-[24px] lg:text-[20px] xl:text-[24px] font-normal">
                            {new Date().toLocaleDateString('ru-RU', {weekday: 'long'})}
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center space-x-6 lg-max:justify-center lg:flex-row sm-max:flex-row lg-max:space-y-3 ">
                    <div className="flex flex-col bg-white rounded-[25px] px-6 py-[10px] h-[86px] sm-max:px-3 ">
                        <div className="text-[#a0a2b1] text-[18px] font-normal leading-[27.60px]">Дата по хиджре</div>
                        <div className="text-[#17181d] text-[33px] sm-max:text-[25px] font-medium leading-[27.60px]">{getHijriDate()}</div>
                    </div>
                    <div className="flex items-left lg:space-x-[0%] sm:space-x-[15%] lg-max:w-full space-x-4 justify-center ">

                        <div className="flex items-left flex-col ">
                            <div className="text-[#a0a2b1] text-[18px] font-[400] leading-[21.60px] flex space-x-1.5">
                                <div className="cursor-pointer relative"
                                     onClick={() => setMosqueDropdownOpen(prev => !prev)}>
                                    Мечеть
                                    {mosqueDropdownOpen && (
                                        <div
                                            className="absolute bg-white border rounded-lg shadow-lg w-[250px] max-h-96 overflow-y-auto z-1000">
                                            {mosques.filter(mosque => mosque.cityId === currentCityId).map((mosque) => (
                                                <div key={mosque.id} className="p-2 hover:bg-gray-200 cursor-pointer"
                                                     onClick={() => handleMosqueSelect(mosque)}>
                                                    {mosque.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div>·</div>
                                <div className="cursor-pointer relative"
                                     onClick={() => setCityDropdownOpen(prev => !prev)}>
                                    {selectedCity}
                                    {cityDropdownOpen && (
                                        <div
                                            className="absolute bg-white border rounded-lg shadow-lg w-[250px] max-h-96 overflow-y-auto z-1000">
                                            {cities.map((city) => (
                                                <div key={city.id} className="p-2 hover:bg-gray-200 cursor-pointer"
                                                     onClick={() => {
                                                         setCityDropdownOpen(false);
                                                         setSelectedCity(city.name);
                                                     }}>
                                                    {city.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="text-[#17181d] text-[33px] leading-[35.60px] sm-max:text-[25px] ">{selectedMosque}</div>
                        </div>
                        <div>
                            <img className="w-[61px] h-[61px] rounded-[20px]" src={getLogoUrl()} alt="avatar"/>
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap justify-center  pc1:gap-4 w-full mt-[2%]">
                {prayers.map((prayer, index) => (
                    <div key={index} className=" mb-[2%] w-[210px] pc1:w-[230px] pc:w-[297px] flex-shrink-1">
                        <PrayerTime
                            time={prayer.time}
                            label={prayer.label}
                            highlight={prayer.highlight}
                            pic={prayer.pic}
                            pic2={prayer.pic2}
                            remainingTime={remainingTime}
                            progress={calculateProgress(remainingTime, totalDuration)}
                        />
                    </div>
                ))}
            </div>
            <div className="w-full  bg-white rounded-[50px] flex sm-max:flex-col justify-between items-center px-6 md:px-12 py-4 relative mt-6">
                <div className="flex items-center justify-center min-h-screen-xl xl-max:flex-col">
                    <div className="w-full lg:w-[400px] xl:w-[500px] bg-[#F6F6F6] rounded-[50px] flex justify-center items-center relative p-[4%] xl-max:p-[2%]">
                        <div className="text-[#17181D] text-[120px] lg:text-[90px] xl:text-[120px] xl-max:text-[100px] font-extrabold text-center">
                            {currentName.arabic}
                        </div>
                    </div>
                    <div className="ml-[7%] xl-max:ml-[0%] w-[100%]">
                        <div className="text-[#17181D] text-[70px] lg:text-[50px] xl:text-[70px] xl-max:text-[40px] font-extrabold text-center">
                            {currentName.pronunciation}
                        </div>
                        <div className="text-[#17181D] text-[60px] lg:text-[40px] xl:text-[60px] xl-max:text-[30px] font-bold text-center">
                            {currentName.explanation}
                        </div>
                    </div>
                </div>
                <div className="w-[287px] lg:w-[250px] xl:w-[287px] h-[400px] lg:h-[350px] xl:h-[400px] flex flex-col space-y-4 bg-[#5EC262] rounded-[50px] p-[35px]">
                    <div className="text-white text-[21px] lg:text-[18px] xl:text-[21px] font-extrabold">
                        Подробную информацию можно узнать по переходу с QR-кода
                    </div>
                    <div className="text-white text-[20px] flex justify-center font-extrabold">
                        {qrCode && (
                            <img 
                                className="w-[190px] lg:w-[160px] xl:w-[190px] h-[190px] lg:h-[160px] xl:h-[190px] rounded-[20px]" 
                                src={`${API_BASE_URL}${qrCode}`}
                                alt="QR Code"
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
