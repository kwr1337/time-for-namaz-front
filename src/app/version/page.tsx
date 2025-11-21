'use client';

import React from 'react';

const VersionPage = () => {
    const version = '1.2';
    
    const changes = [
        'Добавлена админка для управления именами Аллаха (99 имен)',
        'Имена Аллаха теперь загружаются из API для каждой мечети',
        'Добавлена поддержка переводов имен Аллаха на татарский язык',
        'Реализована админка для управления настройками языков мечети',
        'Добавлена поддержка автоматического переключения языков',
        'Обновлена система переводов - теперь переводы загружаются из БД вместо файла',
        'Добавлена страница настроек языков мечети в админке',
        'Исправлена логика работы икамата - теперь отталкивается от фиксированного времени',
        'Улучшена обработка ошибок при загрузке данных',
        'Добавлена функциональность икамата для намазов',
        'Реализована админка для настройки икамата отдельно от фиксированного времени',
        'Добавлено отображение икамата на публичной странице',
        'Карточка намаза подсвечивается желтым цветом во время икамата',
        'Исправлена ошибка с отображением времени на день позже',
        'Добавлена поддержка ролевого доступа для QR-кодов',
        'Реализована фильтрация мечетей по ролям в админке',
        'Улучшена система управления фиксированным временем намазов',
    ];

    return (
        <div className="fixed inset-0 overflow-y-auto bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="min-h-full py-8 px-4">
                <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12">
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-bold text-gray-800 mb-2">
                        Версия {version}
                    </h1>
                    <p className="text-gray-600 text-lg">
                        История изменений
                    </p>
                </div>

                <div className="bg-gray-50 border-l-4 border-indigo-500 p-6 rounded-lg">
                    <div className="flex items-center mb-4">
                        <div className="bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                            ✓
                        </div>
                        <h2 className="text-2xl font-semibold text-gray-800">
                            Список изменений
                        </h2>
                    </div>
                    <ul className="space-y-3 ml-11">
                        {changes.map((change, index) => (
                            <li key={index} className="flex items-start">
                                <span className="text-indigo-500 mr-2 mt-1">•</span>
                                <span className="text-gray-700 text-base leading-relaxed">
                                    {change}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
                </div>
            </div>
        </div>
    );
};

export default VersionPage;

