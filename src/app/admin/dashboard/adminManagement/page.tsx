import type { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'

import AdminManagementPage from '@/app/admin/dashboard/adminManagement/AdminManagementPage'



export const metadata: Metadata = {
	title: 'QRCode',
	...NO_INDEX_PAGE
}

export default function AuthPage() {
	return <AdminManagementPage />
}
