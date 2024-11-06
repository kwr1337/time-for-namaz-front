import type { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'
import DashboardPage from '@/app/admin/dashboard/DashboardPage'



export const metadata: Metadata = {
	title: 'Dashboard',
	...NO_INDEX_PAGE
}

export default function AuthPage() {
	return <DashboardPage />
}
