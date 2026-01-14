'use client';

import React, { useEffect, useState, useRef } from 'react';
import Script from 'next/script';

const MakkahPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hlsLoaded, setHlsLoaded] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<any>(null);

    // URL для HLS потока через прокси yt.nmzvrm.ru
    const VIDEO_SRC = 'https://yt.nmzvrm.ru/index.m3u8';

    useEffect(() => {
        // Ждем загрузки HLS.js библиотеки
        if (!hlsLoaded || !videoRef.current) {
            return;
        }

        const video = videoRef.current;

        // Проверяем поддержку HLS
        if ((window as any).Hls && (window as any).Hls.isSupported()) {
            // Используем HLS.js для браузеров с поддержкой MSE
            // Настройки для максимального качества видео
            const hls = new (window as any).Hls({
                enableWorker: true,
                lowLatencyMode: false, // Отключаем для лучшего качества
                maxBufferLength: 30, // Увеличиваем буфер для плавности
                maxMaxBufferLength: 60, // Максимальный размер буфера
                maxBufferSize: 60 * 1000 * 1000, // 60MB буфер
                maxBufferHole: 0.5,
                highBufferWatchdogPeriod: 2,
                nudgeOffset: 0.1,
                nudgeMaxRetry: 3,
                maxFragLoadingTimeOut: 200000,
                fragLoadingTimeOut: 200000,
                manifestLoadingTimeOut: 10000,
                levelLoadingTimeOut: 10000,
                // Настройки для лучшего качества
                abrEwmaDefaultEstimate: 500000, // Высокая оценка битрейта для выбора лучшего качества
                abrEwmaSlowVoD: 3, // Медленное переключение качества для стабильности
                abrEwmaFastVoD: 3,
                abrEwmaDefaultVoD: 3,
                capLevelToPlayerSize: false, // Не ограничиваем качество размером плеера
                startLevel: -1, // Автоматический выбор, но можно указать индекс уровня (0 = самый высокий)
            });

            hlsRef.current = hls;

            hls.loadSource(VIDEO_SRC);
            hls.attachMedia(video);

            hls.on((window as any).Hls.Events.MANIFEST_PARSED, (event: any, data: any) => {
                console.log('Доступные уровни качества:', data.levels);
                
                // Пытаемся выбрать самый высокий уровень качества
                if (data.levels && data.levels.length > 0) {
                    // Находим уровень с максимальным разрешением
                    let maxLevel = 0;
                    let maxResolution = 0;
                    data.levels.forEach((level: any, index: number) => {
                        const resolution = (level.width || 0) * (level.height || 0);
                        if (resolution > maxResolution) {
                            maxResolution = resolution;
                            maxLevel = index;
                        }
                    });
                    
                    console.log(`Выбран уровень качества: ${maxLevel} (${data.levels[maxLevel].width}x${data.levels[maxLevel].height})`);
                    hls.currentLevel = maxLevel; // Устанавливаем максимальное качество
                }
                
                setIsLoading(false);
                setError(null);
                video.play().catch((err) => {
                    console.error('Ошибка автовоспроизведения:', err);
                });
            });

            // Отслеживаем переключения качества
            hls.on((window as any).Hls.Events.LEVEL_SWITCHED, (event: any, data: any) => {
                const level = hls.levels[data.level];
                if (level) {
                    console.log(`Переключено на уровень: ${data.level} (${level.width}x${level.height}, битрейт: ${level.bitrate})`);
                }
            });

            hls.on((window as any).Hls.Events.ERROR, (event: any, data: any) => {
                console.error('HLS ошибка:', data);
                if (data.fatal) {
                    switch (data.type) {
                        case (window as any).Hls.ErrorTypes.NETWORK_ERROR:
                            setError('Ошибка сети. Проверьте подключение к интернету.');
                            setIsLoading(false);
                            break;
                        case (window as any).Hls.ErrorTypes.MEDIA_ERROR:
                            setError('Ошибка воспроизведения видео.');
                            setIsLoading(false);
                            hls.recoverMediaError();
                            break;
                        default:
                            setError('Ошибка загрузки трансляции.');
                            setIsLoading(false);
                            hls.destroy();
                            break;
                    }
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            // Нативная поддержка HLS (Safari)
            video.src = VIDEO_SRC;
            video.addEventListener('loadedmetadata', () => {
                setIsLoading(false);
                setError(null);
            });
            video.addEventListener('error', () => {
                setError('Ошибка загрузки трансляции.');
                setIsLoading(false);
            });
        } else {
            setError('Ваш браузер не поддерживает воспроизведение HLS потоков.');
            setIsLoading(false);
        }

        // Очистка при размонтировании
        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
            }
        };
    }, [hlsLoaded]);

    return (
        <>
            {/* Загружаем HLS.js библиотеку */}
            <Script
                src="https://cdn.jsdelivr.net/npm/hls.js@latest"
                strategy="lazyOnload"
                onLoad={() => setHlsLoaded(true)}
                onError={() => {
                    setError('Не удалось загрузить библиотеку HLS.js');
                    setIsLoading(false);
                }}
            />

            <div className="min-h-screen bg-[#f6f6f6] flex flex-col p-2 sm:p-3">
                <div className="w-full h-full flex flex-col flex-1 max-h-screen">
                    {/* Заголовок - компактный */}
                    <div className="text-center mb-2 sm:mb-3 flex-shrink-0">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#17181d]">
                            Прямая трансляция из Мекки
                        </h1>
                    </div>

                    {/* Видео контейнер - с фиксированным соотношением сторон 16:9 */}
                    <div className="relative w-full flex-1 min-h-0 flex items-center justify-center overflow-hidden">
                        <div 
                            className="relative rounded shadow-lg bg-black"
                            style={{ 
                                aspectRatio: '16/9',
                                width: 'min(100%, calc((100vh - 200px) * 16 / 9))',
                                maxHeight: 'calc(100vh - 200px)',
                                height: 'auto'
                            }}
                        >
                            {isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black rounded z-10">
                                    <div className="text-white text-lg sm:text-xl">Загрузка трансляции...</div>
                                </div>
                            )}
                            
                            {error && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black rounded z-10">
                                    <div className="text-white text-lg sm:text-xl text-center p-4">
                                        {error}
                                        <br />
                                        <span className="text-sm mt-2 block">
                                            Пожалуйста, проверьте подключение к интернету
                                        </span>
                                    </div>
                                </div>
                            )}

                            <video
                                ref={videoRef}
                                className="absolute top-0 left-0 w-full h-full rounded"
                                controls
                                autoPlay
                                playsInline
                                muted={false}
                                preload="auto"
                            />
                        </div>
                    </div>

                    {/* Информация - компактная */}
                    <div className="mt-2 sm:mt-3 text-center text-[#a0a2b1] text-xs sm:text-sm flex-shrink-0">
                        <p>Трансляция предоставлена каналом Мекки</p>
                        {error && (
                            <div className="mt-2 p-2 sm:p-3 bg-yellow-100 border border-yellow-400 rounded text-yellow-800 text-xs sm:text-sm">
                                <p className="font-semibold">Возможные причины ошибки:</p>
                                <ul className="list-disc list-inside mt-1 space-y-0.5">
                                    <li>Сервер yt.nmzvrm.ru недоступен</li>
                                    <li>Трансляция временно остановлена</li>
                                    <li>Проблемы с DNS (проверьте A-запись для yt.nmzvrm.ru)</li>
                                    <li>Не настроен SSL-сертификат для yt.nmzvrm.ru</li>
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Кнопка возврата - компактная */}
                    <div className="mt-2 sm:mt-3 text-center flex-shrink-0">
                        <a
                            href="/"
                            className="inline-block px-4 py-2 sm:px-6 sm:py-3 bg-[#5ec262] text-white rounded-lg hover:bg-[#4fa854] transition-colors text-sm sm:text-base font-semibold"
                        >
                            Вернуться на главную
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MakkahPage;

