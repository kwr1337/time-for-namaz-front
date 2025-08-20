import type { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'

import QRCodePage from '@/app/admin/dashboard/qrcode/QRCodePage'



export const metadata: Metadata = {
	title: 'QRCode',
	...NO_INDEX_PAGE
}

export default function AuthPage() {
	return <QRCodePage />
}
