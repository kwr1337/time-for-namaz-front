'use client';

import React, { useEffect, useState } from 'react';

const MakkahPage = () => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [streamUrl, setStreamUrl] = useState<string>('');

    // URL для видеопотока через прокси yt.nmzvrm.ru
    // Ильшат настроил проксирование на сервере 83.222.21.252
    const PROXY_BASE_URL = 'https://yt.nmzvrm.ru';
    
    // Возможные варианты путей для видеопотока (зависит от настройки сервера)
    const STREAM_PATHS = [
        '/stream',           // Прямой поток
        '/live',              // Live поток
        '/hls/stream.m3u8',  // HLS формат
        '/video',             // Видео поток
        '/youtube',           // Прокси YouTube
    ];

    useEffect(() => {
        // Определяем URL для потока
        // По умолчанию используем /stream, но можно попробовать другие варианты
        const defaultStreamPath = STREAM_PATHS[0];
        setStreamUrl(`${PROXY_BASE_URL}${defaultStreamPath}`);
        setIsLoading(false);
    }, []);

    return (
        <div className="min-h-screen bg-[#f6f6f6] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-[1920px]">
                {/* Заголовок */}
                <div className="text-center mb-6">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#17181d] mb-2">
                        Прямая трансляция из Мекки
                    </h1>
                </div>

                {/* Видео контейнер */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}> {/* 16:9 aspect ratio */}
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black rounded-lg">
                            <div className="text-white text-xl">Загрузка трансляции...</div>
                        </div>
                    )}
                    
                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black rounded-lg">
                            <div className="text-white text-xl text-center p-4">
                                {error}
                                <br />
                                <span className="text-sm mt-2 block">
                                    Пожалуйста, проверьте подключение к интернету
                                </span>
                            </div>
                        </div>
                    )}

                    {!error && streamUrl && (
                        <video
                            className="absolute top-0 left-0 w-full h-full rounded-lg shadow-2xl bg-black"
                            controls
                            autoPlay
                            playsInline
                            muted={false}
                            onLoadedData={() => setIsLoading(false)}
                            onError={(e) => {
                                console.error('Ошибка загрузки видео:', e);
                                setError('Ошибка загрузки трансляции. Проверьте подключение к yt.nmzvrm.ru');
                                setIsLoading(false);
                            }}
                        >
                            <source src={streamUrl} type="video/mp4" />
                            <source src={`${PROXY_BASE_URL}/hls/stream.m3u8`} type="application/x-mpegURL" />
                            <source src={`${PROXY_BASE_URL}/live`} type="video/mp4" />
                            Ваш браузер не поддерживает воспроизведение видео.
                        </video>
                    )}
                </div>

                {/* Информация */}
                <div className="mt-6 text-center text-[#a0a2b1] text-sm md:text-base">
                    <p>Трансляция предоставлена каналом Мекки</p>
                    <p className="mt-2 text-xs">
                        Видеопоток проксируется через yt.nmzvrm.ru (83.222.21.252)
                    </p>
                    {error && (
                        <div className="mt-4 p-4 bg-yellow-100 border border-yellow-400 rounded-lg text-yellow-800 text-sm">
                            <p className="font-semibold">Возможные причины ошибки:</p>
                            <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Сервер yt.nmzvrm.ru недоступен</li>
                                <li>Трансляция временно остановлена</li>
                                <li>Проблемы с DNS (проверьте A-запись для yt.nmzvrm.ru)</li>
                                <li>Не настроен SSL-сертификат для yt.nmzvrm.ru</li>
                            </ul>
                        </div>
                    )}
                </div>

                {/* Кнопка возврата */}
                <div className="mt-8 text-center">
                    <a
                        href="/"
                        className="inline-block px-6 py-3 bg-[#5ec262] text-white rounded-lg hover:bg-[#4fa854] transition-colors text-lg font-semibold"
                    >
                        Вернуться на главную
                    </a>
                </div>
            </div>
        </div>
    );
};

export default MakkahPage;

