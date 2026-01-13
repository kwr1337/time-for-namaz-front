import type { Metadata } from 'next'
import { NO_INDEX_PAGE } from '@/constants/seo.constants'
import HolidaysPage from './HolidaysPage'

export const metadata: Metadata = {
	title: 'Праздники мечети',
	...NO_INDEX_PAGE
}

export default function HolidaysPageRoute() {
	return <HolidaysPage />
}

