/**
 * LanguagePage — pick UI language.
 * Uses POSCard, POSButton, POSIcon.
 * Stores selection in localStorage('brewpos_locale').
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSButton, POSIcon } from '../../components';
import { Language as LanguageIcon, Check as CheckIcon } from '@mui/icons-material';
import { getStoredLocale, setStoredLocale, type Locale } from './i18n';

const LANGS: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'English',  native: 'English' },
  { code: 'id', label: 'Indonesian', native: 'Bahasa Indonesia' },
];

export default function LanguagePage() {
  const c = useTheme();
  const current = getStoredLocale();

  const pick = (code: Locale) => {
    setStoredLocale(code);
    window.location.reload();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', backgroundColor: c.page }}>
      {/* Header */}
      <POSCard variant="default" padding="md" style={{
        display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px`,
        borderBottom: `1px solid ${c.divider}`,
        borderRadius: 0, boxShadow: 'none',
      }}>
        <POSIcon icon={<LanguageIcon />} size="md" variant="info" />
        <span style={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
          Language
        </span>
      </POSCard>

      {/* Language options */}
      <div style={{ padding: `${c.ui.cardGap * 1.5}px`, display: 'flex', flexDirection: 'column', gap: `${c.ui.cardGap}px`, maxWidth: 600 }}>
        <POSCard variant="default" padding="md">
          <span style={{ fontSize: c.fontSize('body1'), color: c.text, display: 'block', marginBottom: `${c.ui.spacingBase / 2}px`, fontWeight: 600 }}>
            Display language
          </span>
          <span style={{ fontSize: c.fontSize('caption'), color: c.subtext, display: 'block', marginBottom: `${c.ui.cardGap}px` }}>
            Sets the language used across every page. Changes apply after a quick reload.
          </span>

          <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase}px` }}>
            {LANGS.map((l) => {
              const active = current === l.code;
              return (
                <POSButton
                  key={l.code}
                  variant={active ? 'primary' : 'outline'}
                  size="lg"
                  fullWidth
                  onClick={() => pick(l.code)}
                  icon={active ? <CheckIcon /> : undefined}
                  style={{ justifyContent: 'flex-start' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: c.fontSize('body1') }}>
                      {l.label}
                    </span>
                    <span style={{ fontSize: c.fontSize('caption'), opacity: 0.85 }}>
                      {l.native}
                    </span>
                  </div>
                </POSButton>
              );
            })}
          </div>
        </POSCard>
      </div>
    </div>
  );
}
