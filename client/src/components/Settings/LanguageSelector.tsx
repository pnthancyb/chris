import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '@/lib/languages';

export function LanguageSelector() {
  const { currentLanguage, setLanguage, t } = useLanguage();

  return (
    <div className="space-y-2">
      <Label>{t('language')}</Label>
      <Select value={currentLanguage} onValueChange={(value: LanguageCode) => setLanguage(value)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, lang]) => (
            <SelectItem key={code} value={code}>
              {lang.nativeName} ({lang.name})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}