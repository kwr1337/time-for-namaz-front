import type { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'
import MosquePage from '@/app/admin/dashboard/mosque/MosquePage'



export const metadata: Metadata = {
	title: 'Mosque',
	...NO_INDEX_PAGE
}

export default function AuthPage() {
	return <MosquePage />
}
