'use client';

import React from 'react';

interface TimePicker24hProps {
	value: string; // Формат: "HH:mm"
	onChange: (value: string) => void;
	name?: string;
	className?: string;
	disabled?: boolean;
}

export const TimePicker24h: React.FC<TimePicker24hProps> = ({
	value,
	onChange,
	name,
	className = '',
	disabled = false,
}) => {
	// Парсим значение времени
	const [hours, minutes] = value ? value.split(':') : ['00', '00'];
	const hoursNum = parseInt(hours || '0', 10);
	const minutesNum = parseInt(minutes || '0', 10);

	// Генерируем опции для часов (00-23)
	const hourOptions = Array.from({ length: 24 }, (_, i) => {
		const hour = i.toString().padStart(2, '0');
		return { value: hour, label: hour };
	});

	// Генерируем опции для минут (00-59)
	const minuteOptions = Array.from({ length: 60 }, (_, i) => {
		const minute = i.toString().padStart(2, '0');
		return { value: minute, label: minute };
	});

	const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newHours = e.target.value;
		onChange(`${newHours}:${minutes || '00'}`);
	};

	const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const newMinutes = e.target.value;
		onChange(`${hours || '00'}:${newMinutes}`);
	};

	return (
		<div className={`flex items-center gap-1 ${className}`}>
			<select
				name={name ? `${name}_hour` : undefined}
				value={hours || '00'}
				onChange={handleHourChange}
				disabled={disabled}
				className="border rounded px-2 py-1 text-black bg-white"
				style={{ minWidth: '60px' }}
			>
				{hourOptions.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			<span className="text-gray-700 font-bold">:</span>
			<select
				name={name ? `${name}_minute` : undefined}
				value={minutes || '00'}
				onChange={handleMinuteChange}
				disabled={disabled}
				className="border rounded px-2 py-1 text-black bg-white"
				style={{ minWidth: '60px' }}
			>
				{minuteOptions.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
		</div>
	);
};

