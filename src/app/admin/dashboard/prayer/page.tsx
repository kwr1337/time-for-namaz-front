import type { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'
import PrayerPage from '@/app/admin/dashboard/prayer/PrayerPage'



export const metadata: Metadata = {
	title: 'Prayer',
	...NO_INDEX_PAGE
}

export default function AuthPage() {
	return <PrayerPage />
}
