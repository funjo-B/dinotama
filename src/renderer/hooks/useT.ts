import { useSettingsStore } from '../stores/settingsStore';
import { translations } from '../i18n';

/** 현재 언어 설정에 맞는 번역 객체를 반환합니다 */
export function useT() {
  const { language } = useSettingsStore();
  return translations[language];
}

/** 공룡 종 이름을 현재 언어로 반환합니다 */
export function useSpeciesName() {
  const { language } = useSettingsStore();
  return (def: { nameKo: string; nameEn: string } | undefined, fallback = '???') => {
    if (!def) return fallback;
    return language === 'en' ? def.nameEn : def.nameKo;
  };
}
