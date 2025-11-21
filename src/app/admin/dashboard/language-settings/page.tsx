import type { Metadata } from 'next';
import { NO_INDEX_PAGE } from '@/constants/seo.constants';
import LanguageSettingsPage from './LanguageSettingsPage';

export const metadata: Metadata = {
    title: 'Настройки языков мечети',
    ...NO_INDEX_PAGE
};

export default function LanguageSettingsPageRoute() {
    return <LanguageSettingsPage />;
}

