// 'use client';
//
// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
//
// // Интерфейсы для данных о намазах, городах и мечетях
// interface PrayerTimes {
//     fajr: string;
//     shuruk: string;
//     zuhr: string;
//     asr: string;
//     maghrib: string;
//     isha: string;
// }
//
// interface PrayerResponse {
//     id: number;
//     cityId: number;
//     date: string;
//     fajr: string;
//     shuruk: string;
//     zuhr: string;
//     asr: string;
//     maghrib: string;
//     isha: string;
// }
//
// interface Mosque {
//     id: number;
//     cityId: number;
//     name: string;
//     logoUrl: string | null; // URL герба мечети
// }
//
// interface City {
//     id: number;
//     name: string;
// }
//
// // Функция для расчета разницы времени в миллисекундах
// const calculateTimeDifference = (targetTime: string): number => {
//     const currentTime = new Date();
//     const [hours, minutes] = targetTime.split(':').map(Number);
//     const targetDateTime = new Date(currentTime);
//     targetDateTime.setHours(hours, minutes, 0);
//
//     const difference = targetDateTime.getTime() - currentTime.getTime();
//     return Math.max(difference, 0);
// };
//
// // Форматирование времени в часы, минуты, секунды
// const formatTime = (milliseconds: number): string => {
//     const totalSeconds = Math.floor(milliseconds / 1000);
//     const hours = Math.floor(totalSeconds / 3600);
//     const minutes = Math.floor((totalSeconds % 3600) / 60);
//     const seconds = totalSeconds % 60;
//     return `${hours} ч ${minutes} мин ${seconds} сек`;
// };
//
// // Объект с русскими названиями намазов
// const prayerNames: { [key: string]: string } = {
//     fajr: 'Фаджр',
//     shuruk: 'Шурук',
//     zuhr: 'Зухр',
//     asr: 'Аср',
//     maghrib: 'Магриб',
//     isha: 'Иша',
// };
//
// export function PrayerTimes() {
//     const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
//     const [nearestPrayer, setNearestPrayer] = useState<string | null>(null);
//     const [remainingTime, setRemainingTime] = useState<number>(0);
//     const [cities, setCities] = useState<City[]>([]);
//     const [mosques, setMosques] = useState<Mosque[]>([]); // Состояние для мечетей
//     const [selectedCity, setSelectedCity] = useState<string>(() => {
//         const savedCity = localStorage.getItem('selectedCity');
//         return savedCity || 'Казань';
//     });
//     const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null); // Выбор мечети
//     const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
//     const [mosqueName, setMosqueName] = useState<string | null>(null);
//     const [hijriDate, setHijriDate] = useState<string | null>(null);
//
//     // Запрос списка городов
//     useEffect(() => {
//         const fetchCities = async () => {
//             try {
//                 const response = await axios.get<City[]>('http://localhost:4400/api/cities');
//                 setCities(response.data);
//             } catch (error) {
//                 console.error('Ошибка при загрузке списка городов:', error);
//             }
//         };
//         fetchCities();
//     }, []);
//
//     // Запрос данных о мечетях
//     useEffect(() => {
//         const fetchMosques = async () => {
//             try {
//                 const response = await axios.get<Mosque[]>('http://localhost:4400/api/mosques');
//                 setMosques(response.data);
//                 // Установка первой мечети как выбранной по умолчанию
//                 if (response.data.length > 0) {
//                     setSelectedMosque(response.data[0]);
//                 }
//             } catch (error) {
//                 console.error('Ошибка при загрузке мечетей:', error);
//             }
//         };
//         fetchMosques();
//     }, []);
//
//     // Запрос данных о намазах для выбранного города и мечети
//     useEffect(() => {
//         const fetchPrayerTimes = async () => {
//             if (!selectedMosque) return; // Если мечеть не выбрана, выходим
//
//             try {
//                 const response = await axios.get<PrayerResponse>(
//                     `http://localhost:4400/api/prayers/today?cityName=${selectedCity}&mosqueName=${selectedMosque.name}`
//                 );
//                 const { fajr, shuruk, zuhr, asr, maghrib, isha } = response.data;
//
//                 setPrayerTimes({
//                     fajr,
//                     shuruk,
//                     zuhr,
//                     asr,
//                     maghrib,
//                     isha,
//                 });
//                 setMosqueName(mosqueName);
//                 setHijriDate(hijriDate);
//             } catch (error) {
//                 console.error('Ошибка при загрузке данных:', error);
//             }
//         };
//
//         fetchPrayerTimes();
//     }, [selectedCity, selectedMosque]); // Добавлено 'selectedMosque' как зависимость
//
//     // Сохранение выбранного города в localStorage при изменении
//     useEffect(() => {
//         localStorage.setItem('selectedCity', selectedCity);
//     }, [selectedCity]);
//
//     // Поиск ближайшего намаза и настройка таймера
//     useEffect(() => {
//         if (!prayerTimes) return;
//
//         const prayerTimesArray = Object.entries(prayerTimes);
//         let closestPrayer = '';
//         let minDifference = Infinity;
//
//         prayerTimesArray.forEach(([prayerName, time]) => {
//             const difference = calculateTimeDifference(time);
//             if (difference < minDifference && difference > 0) {
//                 minDifference = difference;
//                 closestPrayer = prayerName;
//             }
//         });
//
//         setNearestPrayer(closestPrayer);
//         setRemainingTime(minDifference);
//
//         // Обновление оставшегося времени каждую секунду
//         const timer = setInterval(() => {
//             setRemainingTime((prevTime) => {
//                 if (prevTime <= 1000) {
//                     let nextPrayerIndex = prayerTimesArray.findIndex(([name]) => name === closestPrayer) + 1;
//                     if (nextPrayerIndex >= prayerTimesArray.length) {
//                         nextPrayerIndex = 0; // Переход на первый намаз, если все намазы прошли
//                     }
//                     const nextPrayerName = prayerTimesArray[nextPrayerIndex][0];
//                     const nextPrayerTime = prayerTimesArray[nextPrayerIndex][1];
//                     setNearestPrayer(nextPrayerName);
//                     return calculateTimeDifference(nextPrayerTime);
//                 }
//                 return prevTime - 1000;
//             });
//         }, 1000);
//
//         return () => clearInterval(timer);
//     }, [prayerTimes, nearestPrayer]);
//
//     return (
//         <div className="min-h-screen flex flex-col justify-between p-6 bg-gray-100">
//             {/* Верхняя часть с текущим временем, датой и информацией о городе и мечети */}
//             <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-lg relative">
//                 <div className="text-6xl font-bold text-gray-800">
//                     {new Date().toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}
//                 </div>
//                 <div className="text-3xl text-gray-600">
//                     {new Date().toLocaleDateString('ru-RU', {
//                         day: 'numeric',
//                         month: 'long',
//                         weekday: 'long',
//                     })}
//                 </div>
//                 {/* Информация о мечети и хиджре */}
//                 <div className="text-2xl text-gray-500">
//                     {mosqueName && <div>{mosqueName}</div>}
//                     {hijriDate && <div>{hijriDate}</div>}
//                 </div>
//                 {/* Клик по названию города открывает выпадающий список */}
//                 <div
//                     className="text-2xl text-gray-500 cursor-pointer relative"
//                     onClick={() => setDropdownOpen((prev) => !prev)}
//                 >
//                     Город: {selectedCity}
//                     {dropdownOpen && (
//                         <div
//                             className="absolute top-12 right-0 bg-white border rounded-lg shadow-lg w-62 max-h-96 overflow-y-auto z-10">
//                             {cities.map((city) => (
//                                 <div
//                                     key={city.id}
//                                     className="p-2 hover:bg-gray-200 cursor-pointer"
//                                     onClick={() => {
//                                         setSelectedCity(city.name); // Устанавливаем выбранный город
//                                         setDropdownOpen(false); // Закрываем выпадающий список
//                                     }}
//                                 >
//                                     {city.name}
//                                 </div>
//                             ))}
//                         </div>
//                     )}
//                 </div>
//                 {/* Выбор мечети */}
//                 <div className="relative">
//                     <select
//                         value={selectedMosque?.id || ''}
//                         onChange={(e) => {
//                             const mosqueId = Number(e.target.value);
//                             const selected = mosques.find((mosque) => mosque.id === mosqueId);
//                             setSelectedMosque(selected || null);
//                         }}
//                         className="p-2 border border-gray-300 rounded-lg"
//                     >
//                         {mosques.map((mosque) => (
//                             <option key={mosque.id} value={mosque.id}>
//                                 {mosque.name}
//                             </option>
//                         ))}
//                     </select>
//                 </div>
//             </div>
//
//             {/* Блок с логотипом мечети или гербом города */}
//             <div className="flex items-center justify-center mt-6">
//                 {selectedMosque?.logoUrl ? (
//                     <img src={`http://localhost:4400/${selectedMosque.logoUrl}`} alt="Логотип" className="h-20"/>
//                 ) : (
//                     <img src="/path/to/city-emblem.png" alt="Герб города" className="h-20"/>
//                 )}
//             </div>
//
//             {/* Блок с временем намазов */}
//             <div className="grid grid-cols-6 gap-6 mt-6">
//                 {prayerTimes &&
//                     Object.entries(prayerTimes).map(([prayerName, time]) => (
//                         <div
//                             key={prayerName}
//                             className={`relative p-4 border text-center rounded-lg shadow-md ${
//                                 nearestPrayer === prayerName ? 'bg-green-300 text-white' : 'bg-white'
//                             }`}
//                         >
//                             <div className="text-lg font-medium text-gray-600">
//                                 {prayerNames[prayerName as keyof PrayerTimes]}
//                             </div>
//                             <div className="text-4xl font-bold text-gray-800">{time}</div>
//
//                             {/* Если это ближайший намаз, показываем оставшееся время и прогресс */}
//                             {nearestPrayer === prayerName && (
//                                 <>
//                                     <div
//                                         className="absolute top-2 right-2 bg-transparent text-sm font-medium p-2 rounded-lg">
//                                         {formatTime(remainingTime)}
//                                     </div>
//
//                                     {/* Полоса прогресса */}
//                                     <div className="w-full h-2 bg-gray-500 mt-4">
//                                         <div
//                                             className="h-full bg-green-500"
//                                             style={{
//                                                 width: `${(1 - remainingTime / calculateTimeDifference(time)) * 100}%`,
//                                                 minWidth: "100px"
//                                             }}
//                                         />
//                                     </div>
//                                 </>
//                             )}
//                         </div>
//                     ))}
//             </div>
//
//             {/* Блок с предупреждением и QR-кодом */}
//             <div className="flex justify-between items-center bg-white p-6 rounded-lg shadow-lg mt-6">
//                 <div className="text-3xl font-bold text-red-600">Пожалуйста, соблюдайте меры профилактики!</div>
//                 <div className="text-xl text-gray-600">
//                     Используйте маски и только собственные молельные коврики для молитвы.
//                 </div>
//                 <div className="flex items-center bg-green-100 p-4 rounded-lg">
//                     <div className="mr-4 text-xl text-gray-700">Помощь мечети</div>
//                     <img src="/path/to/qrcode.png" alt="QR Код" className="h-20"/>
//                 </div>
//             </div>
//         </div>
//     );
// }
