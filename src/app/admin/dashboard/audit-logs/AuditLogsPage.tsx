'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '@/config/config';
import { DASHBOARD_PAGES } from '@/config/pages-url.config';

interface AuditLog {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId: number | null;
  oldValue: any;
  newValue: any;
  createdAt: string;
  user: {
    id: number;
    email: string;
    role: string;
  };
}

interface FormattedChanges {
  mainContent: JSX.Element | string;
  oldImage: JSX.Element | string;
  newImage: JSX.Element | string;
  cityName?: string;
  mosqueName?: string;
  timeShift?: string;
  prayerName?: string;
  timeShiftDisplay: JSX.Element | string;
}

// Интерфейс для города
interface CityRef {
  id: number;
  name: string;
}

// На начало файла после импортов добавим функцию для форматирования количества элементов
const formatElementCount = (count: number): string => {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;
  
  if (lastTwoDigits >= 11 && lastTwoDigits <= 19) {
    return `${count} элементов`;
  } else if (lastDigit === 1) {
    return `${count} элемент`;
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    return `${count} элемента`;
  } else {
    return `${count} элементов`;
  }
};

// Вспомогательная функция для форматирования изменений
const formatChanges = (log: AuditLog, cities?: CityRef[], expandState?: {expanded: boolean, setExpanded: (v: boolean) => void}): FormattedChanges => {
  // Вспомогательная функция для отображения изображений
  const renderImage = (imageUrl: string | null | undefined): JSX.Element | string => {
    if (!imageUrl) return '-';
    // Проверка, является ли URL полным или относительным
    const src = imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}/${imageUrl.replace(/\\/g, '/')}`;
    return <img src={src} alt="изображение" className="w-16 h-16 object-contain" />;
  };

  const renderValue = (value: any): JSX.Element | string => {
    if (value === null) return '-';
    if (typeof value === 'object') return <pre className="text-xs overflow-x-auto max-w-[300px]">{JSON.stringify(value, null, 2)}</pre>;
    return String(value);
  };

  // Извлекаем URL изображений, если они есть
  const oldImageUrl = log.oldValue?.logoUrl || log.oldValue?.imageUrl;
  const newImageUrl = log.newValue?.logoUrl || log.newValue?.imageUrl;

  // Определяем имена города и мечети
  let cityName: string | undefined;
  if (log.entity === 'City') {
    cityName = log.oldValue?.name || log.newValue?.name || '-';
  } else if (log.entity === 'Mosque') {
    cityName = log.newValue?.cityInfo?.name || log.oldValue?.cityInfo?.name;
    if (!cityName && cities && (log.newValue?.cityId || log.oldValue?.cityId)) {
      const cityId = log.newValue?.cityId || log.oldValue?.cityId;
      const found = cities.find(c => c.id === cityId);
      cityName = found ? found.name : '-';
    }
    cityName = cityName || '-';
  } else if (log.entity === 'Prayer' && (log.action === 'bulk-update' || log.action === 'bulk-import')) {
    cityName = log.newValue?.cityInfo?.name || log.oldValue?.cityInfo?.name || '-';
  } else if (log.entity === 'FixedPrayerTime') {
    cityName = log.newValue?.cityName || log.oldValue?.cityName;
    if (!cityName && cities) {
      const cityId = log.newValue?.cityId || log.oldValue?.cityId;
      const found = cities.find(c => c.id === cityId);
      cityName = found ? found.name : '-';
    }
  }

  const mosqueName = log.entity === 'Mosque' 
    ? (log.oldValue?.name || log.newValue?.name || '-') 
    : undefined;

  // Проверяем, были ли изменения только в изображениях
  const isOnlyImageChange = log.action === 'update' &&
                           Object.keys(log.oldValue || {}).length === Object.keys(log.newValue || {}).length &&
                           Object.keys(log.oldValue || {}).every(key =>
                             (key === 'logoUrl' || key === 'imageUrl') || (log.oldValue[key] === log.newValue[key])
                           ) &&
                           (oldImageUrl !== newImageUrl);

  // Проверяем, был ли массовый сдвиг времени
  let timeShift: string | undefined;
  let prayerName: string | undefined;

  if (log.entity === 'Prayer') {
    // Для bulk-update: берём данные из первого элемента массива prayers
    if (log.action === 'bulk-update' && log.newValue?.prayers && log.oldValue?.prayers && Array.isArray(log.newValue.prayers) && Array.isArray(log.oldValue.prayers) && log.newValue.prayers.length > 0 && log.oldValue.prayers.length > 0) {
      const newPrayer = log.newValue.prayers[0];
      const oldPrayer = log.oldValue.prayers[0];
      if (newPrayer && oldPrayer && newPrayer.newTime && oldPrayer.oldTime) {
        try {
          const oldTime = new Date(`2000-01-01T${oldPrayer.oldTime}`);
          const newTime = new Date(`2000-01-01T${newPrayer.newTime}`);
          if (!isNaN(oldTime.getTime()) && !isNaN(newTime.getTime())) {
            const diffMinutes = Math.round((newTime.getTime() - oldTime.getTime()) / 60000);
            const shiftSign = diffMinutes > 0 ? '+' : '';
            timeShift = `${shiftSign}${diffMinutes} мин.`;
          }
        } catch (e) {}
      }
      prayerName = newPrayer.prayerType || oldPrayer.prayerType || '';
    } else if (log.action === 'update' || log.action === 'create') {
      prayerName = log.oldValue?.type || log.newValue?.type || 
                  log.oldValue?.prayer_type || log.newValue?.prayer_type || '';
    }
    
    // Для массовых обновлений
    if (log.action === 'bulk-update') {
      // Сначала определяем сдвиг времени непосредственно из разницы между старыми и новыми значениями
      if (log.oldValue && log.newValue) {
        // Проверяем варианты наличия времени в разных форматах данных
        
        // 1. Прямые поля time
        if (log.oldValue.time && log.newValue.time) {
          try {
            const oldTime = new Date(`2000-01-01T${log.oldValue.time}`);
            const newTime = new Date(`2000-01-01T${log.newValue.time}`);
            
            if (!isNaN(oldTime.getTime()) && !isNaN(newTime.getTime())) {
              const diffMinutes = Math.round((newTime.getTime() - oldTime.getTime()) / 60000);
              const shiftSign = diffMinutes > 0 ? '+' : '';
              timeShift = `${shiftSign}${diffMinutes} мин.`;
              
              // Определяем тип намаза
              prayerName = log.oldValue.type || log.newValue.type || 
                           log.oldValue.prayer_type || log.newValue.prayer_type || '';
            }
          } catch (e) {
            console.error('Ошибка при обработке прямых полей time:', e);
          }
        }
        
        // 2. Конкретные типы намазов (Fajr, Asr и т.д.)
        if (!timeShift) {
          const prayerTypes = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
          
          for (const type of prayerTypes) {
            if (log.oldValue[type] && log.newValue[type]) {
              try {
                const oldTime = new Date(`2000-01-01T${log.oldValue[type]}`);
                const newTime = new Date(`2000-01-01T${log.newValue[type]}`);
                
                if (!isNaN(oldTime.getTime()) && !isNaN(newTime.getTime())) {
                  const diffMinutes = Math.round((newTime.getTime() - oldTime.getTime()) / 60000);
                  const shiftSign = diffMinutes > 0 ? '+' : '';
                  timeShift = `${shiftSign}${diffMinutes} мин.`;
                  prayerName = type;
                  break; // Нашли первый тип намаза с изменением
                }
              } catch (e) {
                console.error(`Ошибка при обработке времени для ${type}:`, e);
              }
            }
          }
        }
        
        // 3. Массив prayers
        if (!timeShift && log.newValue.prayers && Array.isArray(log.newValue.prayers) && log.newValue.prayers.length > 0) {
          // Пытаемся найти тип намаза в первой записи или определить общий тип
          if (!prayerName) {
            // Проверяем, все ли молитвы одного типа
            const prayerTypes = log.newValue.prayers
              .map((p: any) => p.type || p.prayer_type || p.prayerType)
              .filter((type: string) => type);
            
            const uniquePrayerTypes = Array.from(new Set(prayerTypes));
            
            if (uniquePrayerTypes.length === 1) {
              prayerName = uniquePrayerTypes[0] as string;
            } else if (uniquePrayerTypes.length > 1) {
              prayerName = 'Разные типы';
            } else {
              // Если не удалось определить из типов, берем из первой молитвы
              const firstPrayer = log.newValue.prayers[0];
              prayerName = firstPrayer.type || firstPrayer.prayer_type || firstPrayer.prayerType || '';
            }
          }
          
          // Если у первой молитвы есть shift, используем его
          const firstPrayer = log.newValue.prayers[0];
          if (firstPrayer.shift !== undefined) {
            const shift = parseInt(firstPrayer.shift);
            if (!isNaN(shift)) {
              const shiftSign = shift > 0 ? '+' : '';
              timeShift = `${shiftSign}${shift} мин.`;
            }
          }
          
          // Если у самой записи есть shift, используем его в качестве резерва
          if (!timeShift && log.newValue.shift !== undefined) {
            const shift = parseInt(log.newValue.shift);
            if (!isNaN(shift)) {
              const shiftSign = shift > 0 ? '+' : '';
              timeShift = `${shiftSign}${shift} мин.`;
            }
          }
        }
        
        // 4. Явное поле shift в самом логе
        if (!timeShift && log.newValue.shift !== undefined) {
          const shift = parseInt(log.newValue.shift);
          if (!isNaN(shift)) {
            const shiftSign = shift > 0 ? '+' : '';
            timeShift = `${shiftSign}${shift} мин.`;
            
            // Если не определили тип намаза выше, пытаемся найти его здесь
            if (!prayerName) {
              prayerName = log.newValue.prayer_type || log.newValue.prayerType || '';
            }
          }
        }
      }
    }
  } else if (log.entity === 'FixedPrayerTime') {
    // Определяем тип намаза
    if (log.newValue?.prayerType || log.oldValue?.prayerType) {
      prayerName = log.newValue?.prayerType || log.oldValue?.prayerType;
    }
  }

  let mainContent: JSX.Element | string;

  switch (log.action) {
    case 'create':
      mainContent = (
        <div className="flex items-center">
          <span className="text-green-600 mr-2">➕</span>
          <div>
            <div className="font-semibold">Создано:</div>
            {renderValue(log.newValue)}
          </div>
        </div>
      );
      break;

    case 'update':
      if (isOnlyImageChange) {
        mainContent = (
          <div className="flex items-center">
            <span className="text-purple-600 mr-2">🖼️</span>
            <span>Изменено изображение</span>
          </div>
        );
      } else if (log.oldValue && log.newValue) {
        const changes: JSX.Element[] = [];
        // Сравниваем поля и выводим только изменённые, кроме изображений
        for (const key in log.newValue) {
          if ((key !== 'logoUrl' && key !== 'imageUrl') &&
              log.oldValue.hasOwnProperty(key) && log.oldValue[key] !== log.newValue[key]) {
            changes.push(
              <div key={key} className="mb-1">
                <span className="font-semibold mr-1">{key}:</span>
                {renderValue(log.oldValue[key])} &rarr; {renderValue(log.newValue[key])}
              </div>
            );
          }
        }
        // Если есть новые поля, которых не было в oldValue (кроме изображений)
         for (const key in log.newValue) {
          if ((key !== 'logoUrl' && key !== 'imageUrl') && !log.oldValue.hasOwnProperty(key)) {
             changes.push(
              <div key={key} className="mb-1 text-green-700">
                <span className="font-semibold mr-1">{key}:</span>
                 (добавлено) {renderValue(log.newValue[key])}
              </div>
            );
          }
        }
         // Если были удалены поля, которые были в oldValue, но нет в newValue (кроме изображений)
         for (const key in log.oldValue) {
          if ((key !== 'logoUrl' && key !== 'imageUrl') && !log.newValue.hasOwnProperty(key)) {
             changes.push(
              <div key={key} className="mb-1 text-red-700">
                <span className="font-semibold mr-1">{key}:</span>
                 (удалено) {renderValue(log.oldValue[key])}
              </div>
            );
          }
        }

        mainContent = changes.length > 0 ? (
          <div className="flex items-start">
            <span className="text-blue-600 mr-2 mt-1">✏️</span>
            <div>{changes}</div>
          </div>
        ) : (
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">ℹ️</span>
            <div>Прочих изменений не найдено</div>
          </div>
        );
      } else {
        mainContent = (
          <div className="flex items-start">
            <span className="text-blue-600 mr-2 mt-1">✏️</span>
            <div>
              <div className="font-semibold">Старое:</div>
              {renderValue(log.oldValue)}
              <div className="font-semibold mt-2">Новое:</div>
              {renderValue(log.newValue)}
            </div>
          </div>
        );
      }
      break;

    case 'delete':
      mainContent = (
        <div className="flex items-center">
          <span className="text-red-600 mr-2">❌</span>
          <div>
            <div className="font-semibold">Удалено:</div>
            {renderValue(log.oldValue)}
          </div>
        </div>
      );
      break;

    case 'bulk-update':
      if (timeShift && prayerName) {
        mainContent = (
          <div className="flex items-center">
            <span className={`text-${timeShift.includes('+') ? 'blue' : 'red'}-600 mr-2`}>↔️</span>
            <span>
              Сдвиг времени на <strong className={timeShift.includes('+') ? 'text-green-600' : 'text-red-600'}>{timeShift}</strong> для {' '}
              {prayerName === 'Разные типы' ? 'разных намазов' : <strong>{prayerName}</strong>}
              {' '}
              {log.newValue?.prayers?.length 
                ? `(${formatElementCount(log.newValue.prayers.length)})`
                : log.newValue?.count 
                  ? `(${formatElementCount(log.newValue.count)})`
                  : ''}
            </span>
          </div>
        );
      } else if (timeShift) {
        mainContent = (
          <div className="flex items-center">
            <span className={`text-${timeShift.includes('+') ? 'blue' : 'red'}-600 mr-2`}>↔️</span>
            <span>
              Сдвиг времени на <strong className={timeShift.includes('+') ? 'text-green-600' : 'text-red-600'}>{timeShift}</strong>
              {' '}
              {log.newValue?.prayers?.length 
                ? `(${formatElementCount(log.newValue.prayers.length)})`
                : log.newValue?.count 
                  ? `(${formatElementCount(log.newValue.count)})`
                  : ''}
            </span>
          </div>
        );
      } else if (log.newValue && Array.isArray(log.newValue[log.entity.toLowerCase() + 's'])) {
        const items = log.newValue[log.entity.toLowerCase() + 's'];
        mainContent = (
          <div className="flex items-center">
            <span className="text-green-600 mr-2">🔄</span>
            <span>Обработано <strong>{formatElementCount(items.length)}</strong></span>
          </div>
        );
      } else if (log.newValue && log.newValue.count !== undefined) {
        mainContent = (
          <div className="flex items-center">
            <span className="text-green-600 mr-2">🔄</span>
            <span>Обработано <strong>{formatElementCount(log.newValue.count)}</strong></span>
          </div>
        );
      } else {
        // Пытаемся определить количество обработанных элементов из разных источников
        let count = 0;
        if (log.newValue?.prayers && Array.isArray(log.newValue.prayers)) {
          count = log.newValue.prayers.length;
        } else if (log.entity === 'Prayer' && log.newValue && typeof log.newValue === 'object') {
          // Считаем, сколько записей о намазах могло быть обработано
          const prayerKeys = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
          const prayerCount = prayerKeys.filter(key => log.newValue[key] !== undefined).length;
          if (prayerCount > 0) {
            count = prayerCount;
          } else {
            // Считаем количество ключей, которые могут быть записями
            count = Object.keys(log.newValue).length;
          }
        } else if (log.entity === 'Prayer' && log.newValue && typeof log.newValue === 'number') {
          // Если напрямую передано число
          count = log.newValue;
        }
        
        if (count > 0) {
          mainContent = (
            <div className="flex items-center">
              <span className="text-green-600 mr-2">🔄</span>
              <span>Обработано <strong>{formatElementCount(count)}</strong></span>
            </div>
          );
        } else {
          mainContent = (
            <div>
              <div className="font-semibold">Старое:</div>
              {renderValue(log.oldValue)}
              <div className="font-semibold mt-2">Новое:</div>
              {renderValue(log.newValue)}
            </div>
          );
        }
      }
      break;

    case 'bulk-import':
      if (log.entity === 'City' && log.newValue && Array.isArray(log.newValue.cities)) {
        const cityList = log.newValue.cities as {id: number, name: string, action?: string}[];
        const count = cityList.length;
        mainContent = (
          <div>
            <div className="flex items-center">
              <span className="text-green-600 mr-2">📥</span>
              <span>Импортировано <strong>{formatElementCount(count)}</strong></span>
              {count > 0 && expandState && (
                <button
                  className="ml-2 px-2 py-1 text-xs border rounded hover:bg-gray-100"
                  onClick={() => expandState.setExpanded(!expandState.expanded)}
                  type="button"
                >
                  {expandState.expanded ? 'Скрыть' : 'Показать'}
                </button>
              )}
            </div>
            {expandState && expandState.expanded && (
              <ul className="mt-2 ml-6 list-disc text-sm">
                {cityList.map(city => (
                  <li key={city.id}>
                    <span className="font-semibold">{city.name}</span>
                    {city.action ? <span className="text-gray-500 ml-2">({city.action})</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      } else if (log.newValue && Array.isArray(log.newValue[log.entity.toLowerCase() + 's'])) {
        const items = log.newValue[log.entity.toLowerCase() + 's'];
        mainContent = (
          <div className="flex items-center">
            <span className="text-green-600 mr-2">📥</span>
            <span>Импортировано <strong>{formatElementCount(items.length)}</strong></span>
          </div>
        );
      } else {
        mainContent = (
          <div className="flex items-start">
            <span className="text-green-600 mr-2 mt-1">📥</span>
            <div>
              <div className="font-semibold">Старое:</div>
              {renderValue(log.oldValue)}
              <div className="font-semibold mt-2">Новое:</div>
              {renderValue(log.newValue)}
            </div>
          </div>
        );
      }
      break;

    default:
      mainContent = (
        <div className="flex items-start">
          <span className="text-gray-600 mr-2 mt-1">📄</span>
          <div>
            <div className="font-semibold">Старое:</div>
            {renderValue(log.oldValue)}
            <div className="font-semibold mt-2">Новое:</div>
            {renderValue(log.newValue)}
          </div>
        </div>
      );
  }

  // Специальная обработка для FixedPrayerTime после объявления mainContent
  if (log.entity === 'FixedPrayerTime') {
    // Если это запись об изменении активности намаза
    if (log.action === 'update' && (log.newValue?.isActive !== undefined || log.oldValue?.isActive !== undefined)) {
      const oldActive = log.oldValue?.isActive;
      const newActive = log.newValue?.isActive;
      
      if (oldActive !== newActive) {
        const statusText = newActive ? 'активировано' : 'деактивировано';
        const prayerTypeText = prayerName ? `намаза "${prayerName}"` : 'намаза';
        
        mainContent = (
          <div className="flex items-center">
            <span className={`text-${newActive ? 'green' : 'red'}-600 mr-2`}>{newActive ? '✅' : '❌'}</span>
            <span>Время {prayerTypeText} {statusText}</span>
          </div>
        );
      }
    }
    
    // Если это запись об изменении времени намаза
    else if (log.action === 'update' && log.oldValue && log.newValue) {
      // Проверяем изменения времени для всех типов намазов
      const prayerTypes = ['fajr', 'shuruk', 'zuhr', 'asr', 'maghrib', 'isha', 'mechet'];
      const changes: JSX.Element[] = [];
      
      prayerTypes.forEach(type => {
        if (log.oldValue[type] !== log.newValue[type]) {
          const oldTime = log.oldValue[type] || '00:00';
          const newTime = log.newValue[type] || '00:00';
          
          // Переводим названия намазов на русский
          let prayerRussianName = '';
          switch(type) {
            case 'fajr': prayerRussianName = 'Фаджр'; break;
            case 'shuruk': prayerRussianName = 'Шурук'; break;
            case 'zuhr': prayerRussianName = 'Зухр'; break;
            case 'asr': prayerRussianName = 'Аср'; break;
            case 'maghrib': prayerRussianName = 'Магриб'; break;
            case 'isha': prayerRussianName = 'Иша'; break;
            case 'mechet': prayerRussianName = 'Мечеть'; break;
            default: prayerRussianName = type;
          }
          
          changes.push(
            <div key={type} className="mb-1">
              <span className="font-semibold mr-1">{prayerRussianName}:</span>
              <span className="text-red-600">{oldTime}</span> &rarr; <span className="text-green-600">{newTime}</span>
            </div>
          );
        }
      });
      
      // Проверяем изменения активности для всех типов намазов
      prayerTypes.forEach(type => {
        const activeKey = `${type}Active`;
        if (log.oldValue[activeKey] !== log.newValue[activeKey]) {
          const oldActive = log.oldValue[activeKey];
          const newActive = log.newValue[activeKey];
          
          // Переводим названия намазов на русский
          let prayerRussianName = '';
          switch(type) {
            case 'fajr': prayerRussianName = 'Фаджр'; break;
            case 'shuruk': prayerRussianName = 'Шурук'; break;
            case 'zuhr': prayerRussianName = 'Зухр'; break;
            case 'asr': prayerRussianName = 'Аср'; break;
            case 'maghrib': prayerRussianName = 'Магриб'; break;
            case 'isha': prayerRussianName = 'Иша'; break;
            case 'mechet': prayerRussianName = 'Мечеть'; break;
            default: prayerRussianName = type;
          }
          
          changes.push(
            <div key={`${type}-active`} className="mb-1">
              <span className="font-semibold mr-1">{prayerRussianName} активность:</span>
              <span className={oldActive ? 'text-green-600' : 'text-red-600'}>{oldActive ? 'Активно' : 'Неактивно'}</span> &rarr; 
              <span className={newActive ? 'text-green-600' : 'text-red-600'}>{newActive ? 'Активно' : 'Неактивно'}</span>
            </div>
          );
        }
      });
      
      if (changes.length > 0) {
        mainContent = (
          <div className="flex items-start">
            <span className="text-blue-600 mr-2 mt-1">✏️</span>
            <div>{changes}</div>
          </div>
        );
      } else {
        mainContent = (
          <div className="flex items-center">
            <span className="text-gray-500 mr-2">ℹ️</span>
            <div>Изменений не найдено</div>
          </div>
        );
      }
    }
  }

  return {
    mainContent,
    oldImage: renderImage(oldImageUrl),
    newImage: renderImage(newImageUrl),
    cityName,
    mosqueName,
    timeShift,
    prayerName,
    timeShiftDisplay: timeShift ? (
      <span className={`font-semibold ${timeShift.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
        {timeShift}
      </span>
    ) : '-'
  };
};

const AuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cities, setCities] = useState<CityRef[]>([]);
  const [expandedCities, setExpandedCities] = useState<{[logId: number]: boolean}>({});

  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get<AuditLog[]>(`${API_BASE_URL}/api/audit-logs`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setLogs(response.data);
      } catch (err: any) {
        console.error('Ошибка при загрузке логов аудита:', err);
        setError('Не удалось загрузить логи аудита.');
      } finally {
        setLoading(false);
      }
    };

    const fetchCities = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get<CityRef[]>(`${API_BASE_URL}/api/cities`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCities(response.data);
      } catch (err) {
        // Не критично, если не загрузили справочник
        setCities([]);
      }
    };

    fetchAuditLogs();
    fetchCities();
  }, []);

  const handleBack = () => {
    window.location.href = DASHBOARD_PAGES.DASHBOARD;
  };

  // Передаём cities в formatChanges
  const formatChangesWithCities = (log: AuditLog, expandState?: {expanded: boolean, setExpanded: (v: boolean) => void}) => formatChanges(log, cities, expandState);

  return (
    <div className="h-screen w-full overflow-y-auto bg-gray-100 p-4">
      <div className="flex flex-col items-center p-4 w-full">
        <div className="w-full max-w-full p-8 bg-white rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-700">Логи аудита</h2>
            <button onClick={handleBack} className="text-blue-600">Назад</button>
          </div>

          {loading && <p>Загрузка логов...</p>}
          {error && <p className="text-red-500">{error}</p>}

          {!loading && !error && (logs.length === 0 ? (
            <p>Логов аудита нет.</p>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: '70vh' }}>
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="sticky top-0 bg-gray-200 text-black">
                    <th className="p-2 text-left">ID</th>
                    <th className="p-2 text-left">Действие</th>
                    <th className="p-2 text-left">Сущность</th>
                    <th className="p-2 text-left">ID сущности</th>
                    <th className="p-2 text-left">Город</th>
                    <th className="p-2 text-left">Мечеть</th>
                    <th className="p-2 text-left">Намаз</th>
                    <th className="p-2 text-left">Сдвиг времени</th>
                    <th className="p-2 text-left">Пользователь</th>
                    <th className="p-2 text-left">Дата и время</th>
                    <th className="p-2 text-left">Старое изображение</th>
                    <th className="p-2 text-left">Новое изображение</th>
                    <th className="p-2 text-left">Прочие изменения</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => {
                    const expandState = log.action === 'bulk-import' && log.entity === 'City' ? {
                      expanded: !!expandedCities[log.id],
                      setExpanded: (v: boolean) => setExpandedCities(prev => ({...prev, [log.id]: v}))
                    } : undefined;
                    const formatted = formatChangesWithCities(log, expandState);
                    return (
                      <tr key={log.id} className="border-b">
                        <td className="p-2 text-black text-left text-sm">{log.id}</td>
                        <td className="p-2 text-black text-left text-sm">{log.action}</td>
                        <td className="p-2 text-black text-left text-sm">{log.entity}</td>
                        <td className="p-2 text-black text-left text-sm">{log.entityId ?? '-'}</td>
                        <td className="p-2 text-black text-left text-sm">{formatted.cityName || '-'}</td>
                        <td className="p-2 text-black text-left text-sm">{formatted.mosqueName || '-'}</td>
                        <td className="p-2 text-black text-left text-sm">{formatted.prayerName || '-'}</td>
                        <td className="p-2 text-black text-left text-sm">{formatted.timeShiftDisplay}</td>
                        <td className="p-2 text-black text-left text-sm">{log.user?.email || 'N/A'} ({log.user?.role || 'N/A'})</td>
                        <td className="p-2 text-black text-left text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                        <td className="p-2 text-black text-left text-sm">{formatted.oldImage}</td>
                        <td className="p-2 text-black text-left text-sm">{formatted.newImage}</td>
                        <td className="p-2 text-black text-left text-sm">{formatted.mainContent}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage; 