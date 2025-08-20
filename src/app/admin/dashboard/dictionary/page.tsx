import type { Metadata } from 'next'

import { NO_INDEX_PAGE } from '@/constants/seo.constants'
import DictionaryPage from './DictionaryPage'

export const metadata: Metadata = {
    title: 'Dictionary',
    ...NO_INDEX_PAGE,
}

export default function DictionaryRoute() {
    return <DictionaryPage />
}


