'use client';

import React, { useEffect, useState } from 'react';
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
import { API_BASE_URL } from '@/config/config'

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

const PrayerTime: React.FC<PrayerTimeProps> = ({ time, label, highlight, pic, pic2, remainingTime, progress }) => {
    return (
        <div className="relative">
            <div className={`w-[302px] h-[302px] ${highlight ? 'bg-[#5ec262]' : 'bg-white'} rounded-[50px]`}/>
            <Image className=" w-1/3 left-[35px]  bottom-[190px] absolute" src={highlight ? pic2 : pic}
                   alt={label}


            />
            <div className={`w-[130px] h-[60px] absolute left-[155px] top-[20px] ${highlight ? 'bg-white' : 'hidden'} rounded-tr-[50px] rounded-[10px] px-3 py-[10px]`}>
                {highlight ? (
                    <>
                        <div className="text-[#a0a2b1] text-[14px] font-normal ">осталось</div>
                        <div className="text-[#17181d] text-[16px] font-bold ">{formatTime(remainingTime)}</div>
                    </>
                ) : null}
            </div>

            {highlight && (
                <div className={`w-[130px] h-[60px] absolute left-[155px] top-[85px]`}>
                    <div className="h-2 bg-gradient-to-r from-white rounded-full">
                        <div className="h-full bg-white rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            <div
                className={`absolute left-[35px] top-[144px] text-[73px] font-extralight leading-[73px] ${highlight ? 'text-white' : 'text-[#17181d]'}`}>
                {time}
            </div>
            <div
                className={`absolute left-[35px] top-[230px] text-3xl font-extrabold leading-[36px] ${highlight ? 'text-white' : 'text-[#17181d]'}`}>
                {label}
            </div>


        </div>
    );
};

// Функция для расчета разницы времени в миллисекундах
const calculateTimeDifference = (targetTime: string): number => {
    const currentTime = new Date();
    const [hours, minutes] = targetTime.split(':').map(Number);
    const targetDateTime = new Date(currentTime);
    targetDateTime.setHours(hours, minutes, 0);

    const difference = targetDateTime.getTime() - currentTime.getTime();
    return Math.max(difference, 0);
};

// Форматирование времени в часы, минуты, секунды
const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours} ч ${minutes} мин`;
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
        { time: prayerTimes?.fajr || '00:00', label: 'Фаджр', highlight: nearestPrayer === 'fajr', pic: fadjr, pic2: fadjr2 },
        { time: prayerTimes?.shuruk || '00:00', label: 'Шурук', highlight: nearestPrayer === 'shuruk', pic: shuruk, pic2: shuruk2 },
        { time: prayerTimes?.zuhr || '00:00', label: 'Зухр', highlight: nearestPrayer === 'zuhr', pic: zuhr, pic2: zuhr2 },
        { time: prayerTimes?.asr || '00:00', label: 'Аср', highlight: nearestPrayer === 'asr', pic: asr, pic2: asr2 },
        { time: prayerTimes?.maghrib || '00:00', label: 'Магриб', highlight: nearestPrayer === 'maghrib', pic: magrib, pic2: magrib2 },
        { time: prayerTimes?.isha || '00:00', label: 'Иша', highlight: nearestPrayer === 'isha', pic: isha, pic2: isha2 },
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


    // Запрос данных о мечетях и установка первой мечети выбранного города
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


    // Запрос данных о намазах для выбранного города
    useEffect(() => {
        const fetchPrayerTimes = async () => {
            try {
                const response = await axios.get<PrayerResponse>(
                    `${API_BASE_URL}/api/prayers/today?cityName=${selectedCity}`
                );
                const { fajr, shuruk, zuhr, asr, maghrib, isha } = response.data;

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

        // Обновление оставшегося времени каждую секунду
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
                    const response = await fetch(`${API_BASE_URL}/api/qrcodes/${currentMosqueId}`);
                    if (!response.ok) {
                        throw new Error('Network response was not ok');
                    }
                    const data = await response.json();
                    if(data.imageUrl)    {
                        console.log(data.imageUrl)
                        setQrCode(data.imageUrl);
                    }
                    else {
                        setQrCode('')
                    }
                } catch (error) {
                    setQrCode('')
                    console.error('Ошибка при получении QR-кода:', error);
                }
            };

            fetchQRCode();
        }
    }, [currentMosqueId]);


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
        <div className=" w-[1920px] h-[1080px] relative bg-[#f6f6f6]">
            <div className="flex justify-between w-[1887px] h-[302px] left-[16px] top-[171px] absolute">
                {prayers.map((prayer, index) => (
                    <div key={index}>
                        <PrayerTime time={prayer.time} label={prayer.label} highlight={prayer.highlight}
                                    pic={prayer.pic} pic2={prayer.pic2} remainingTime={remainingTime}
                                    progress={calculateProgress(remainingTime, totalDuration)}/>
                    </div>
                ))}
            </div>

            {/* Верхняя панель с временем и датой */}
            <div className="w-[1887px] h-[105px] left-[16px] top-[16px] absolute">
                <div className="w-[1887px] h-[105px] bg-[#eeeeee] rounded-[40px] absolute"/>

                <div className="absolute left-[30px] top-[22px] flex items-center">
                    <div
                        className="text-[#17181d] text-[62px] font-extralight leading-[62px]">{new Date().toLocaleTimeString('ru-RU', {
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</div>
                    <div className={"ml-6"}>
                        <div
                            className="text-[#17181d] text-[23px] font-extrabold leading-[27.60px]"> {new Date().toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'long',
                        })}</div>
                        <div
                            className="text-[#17181d] text-[23px] font-normal leading-[27.60px]"> {new Date().toLocaleDateString('ru-RU', {
                            weekday: 'long',
                        })}</div>
                    </div>
                </div>

                {/* Дата по хиджре */}
                <div className="absolute left-[888px] top-[15px] bg-[#ffffff] rounded-[25px] px-6 py-[10px] max-h-20">
                    <div className="text-[#a0a2b1] text-x font-normal leading-[27.60px]">Дата по хиджре</div>
                    <div className="text-[#17181d] text-2xl font-bold leading-[27.60px] mr-8">{getHijriDate()}</div>
                </div>

                {/*<div*/}
                {/*    className="absolute left-[788px] top-[15px] bg-[#ffffff] rounded-[25px] px-6 py-[10px] max-h-20 flex">*/}
                {/*    <div>*/}
                {/*        <div className="text-[#a0a2b1] text-x font-normal leading-[27.60px] font-mono">Осталось</div>*/}
                {/*        <div className="text-[#17181d] text-2xl font-bold leading-[27.60px] ">5 дней</div>*/}
                {/*    </div>*/}

                {/*    <div className={"ml-8"}>*/}
                {/*        <img className="w-[55px] h-[55px]   rounded-[20px]"*/}
                {/*             src="https://via.placeholder.com/61x61" alt="avatar"/>*/}
                {/*    </div>*/}


                {/*    <div className={"ml-8 mr-12"}>*/}
                {/*        <div className="text-[#17181d] text-2xl font-extrabold leading-[27.60px]">Маулид ан-Наби</div>*/}
                {/*        <div className="text-[#17181d] text-x font-normal leading-[27.60px]">Ночь с 14 на 15 сентября*/}
                {/*        </div>*/}
                {/*    </div>*/}
                {/*</div>*/}

                {/* Остальные элементы */}
                <div className="absolute left-[1396px] top-[24px]">
                    <div className="text-[#a0a2b1] text-1.5xl font-normal leading-[21.60px] flex">
                        <div className={"mr-2 cursor-pointer relative"} onClick={() => {
                            setMosqueDropdownOpen((prev) => !prev);
                        }}>
                            Мечеть
                            {mosqueDropdownOpen && (
                                <div
                                    className="absolute top-12 right-0 bg-white border rounded-lg shadow-lg w-[250px] max-h-96 overflow-y-auto z-1000">
                                    {mosques
                                        .filter(mosque => mosque.cityId === currentCityId)
                                        .map((mosque) => (
                                            <div
                                                key={mosque.id}
                                                className="p-2 hover:bg-gray-200 cursor-pointer"
                                                onClick={() => handleMosqueSelect(mosque)}
                                            >
                                                {mosque.name}
                                            </div>
                                        ))}
                                </div>
                            )}

                        </div>
                        ·
                        <div className={"ml-2 cursor-pointer relative"} onClick={() => {
                            setCityDropdownOpen((prev) => !prev);
                        }}>
                            {selectedCity}
                            {cityDropdownOpen && (
                                <div
                                    className="absolute top-12 right-0 bg-white border rounded-lg shadow-lg w-[250px] max-h-96 overflow-y-auto z-1000">
                                    {cities.map((city) => (
                                        <div
                                            key={city.id}
                                            className="p-2 hover:bg-gray-200 cursor-pointer"
                                            onClick={() => {
                                                setCityDropdownOpen(false);
                                                setSelectedCity(city.name);
                                            }}
                                        >
                                            {city.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="text-[#17181d] text-3xl leading-[39.60px]">{selectedMosque}</div>
                </div>

                {/* Картинка и другие блоки */}
                <div className="absolute left-[1804px] top-[22px]">
                    <img
                        className="w-[61px] h-[61px] rounded-[20px]"
                        src={getLogoUrl()}
                        alt="avatar"
                    />
                </div>
            </div>

            {/* Нижний рекламный блок */}
            <div className="w-[1887px] h-[400px] left-[16px] top-[516px] absolute">
                <div className="w-[1887px] h-[400px] bg-white rounded-[50px] absolute"/>

                <div className="w-[500px] h-[300px] bg-[#F6F6F6] left-[100px] top-[50px] rounded-[50px] absolute"/>

                <div
                    className="absolute left-[180px] top-[140px] text-[#17181D] text-[120px] font-extrabold leading-[102px]">
                    {currentName.arabic}
                </div>

                <div
                    className="absolute left-[650px] top-[90px] text-[#17181D] text-[70px] font-extrabold leading-[102px]">
                    {currentName.pronunciation}
                </div>

                <div
                    className="absolute left-[650px] top-[200px] text-[#17181D] text-[60px]  leading-[102px]">
                    {currentName.explanation}
                </div>

                <div className="w-[287px] h-[400px] bg-[#5EC262] right-0 rounded-[50px] absolute"/>
                <div
                    className="absolute right-12 top-[20px] max-w-[180px] text-white text-xl font-extrabold leading-[27.60px] z-20 text-left break-words">
                    Подробную информацию можно узнать по переходу с QR-кода
                </div>

                <div className="absolute right-11 top-[180px]">
                    {qrCode && (
                        <img
                            className="w-[190px] h-[190px] rounded-[20px]"
                            src={`${API_BASE_URL}${qrCode}`}
                            alt="avatar"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
