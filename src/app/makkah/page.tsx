import type { Metadata } from 'next'
import MakkahPage from './MakkahPage'

export const metadata: Metadata = {
	title: 'Прямая трансляция из Мекки',
	description: 'Онлайн трансляция из Мекки'
}

export default function MakkahPageRoute() {
	return <MakkahPage />
}

