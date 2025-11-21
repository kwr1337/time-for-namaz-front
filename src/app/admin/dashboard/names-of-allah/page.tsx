import type { Metadata } from 'next';
import { NO_INDEX_PAGE } from '@/constants/seo.constants';
import NamesOfAllahPage from './NamesOfAllahPage';

export const metadata: Metadata = {
    title: 'Управление именами Аллаха',
    ...NO_INDEX_PAGE
};

export default function NamesOfAllahPageRoute() {
    return <NamesOfAllahPage />;
}

