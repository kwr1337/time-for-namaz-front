import type { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'

import QRCodePage from '@/app/admin/dashboard/qrcode/QRCodePage'
import CityPage from '@/app/admin/dashboard/cities/CityPage'



export const metadata: Metadata = {
	title: 'City',
	...NO_INDEX_PAGE
}

export default function AuthPage() {
	return <CityPage />
}
