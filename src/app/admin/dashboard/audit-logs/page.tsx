import type { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'
import AuditLogsPage from './AuditLogsPage'



export const metadata: Metadata = {
	title: 'AuditLogsPage',
	...NO_INDEX_PAGE
}

export default function AuthPage() {
	return <AuditLogsPage />
}
