/**
 * LanguagePage — pick UI language.
 *
 * Stores selection in localStorage('brewpos_locale'). The i18n `t()`
 * function reads this on every call, so the change is immediate.
 *
 * Lives in the multilingual module because that's where i18n lives.
 */

import { Box, Typography, Paper, Button } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useTheme } from '../../core/theme/monoTheme';
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
    // Force a re-render of the whole tree by reloading. The translation
    // system reads from localStorage on every t() call but components
    // won't re-render unless we trigger one. Reload is the simplest,
    // most reliable way; locale choice is rare and short.
    window.location.reload();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto', bgcolor: c.page }}>
      <Box sx={{
        height: 64, px: 2, display: 'flex', alignItems: 'center',
        borderBottom: '1px solid ' + c.divider, bgcolor: c.card,
        backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      }}>
        <LanguageIcon sx={{ color: c.button, mr: 1 }} />
        <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('h6'), color: c.text }}>
          Language
      </Typography>
    </Box>

      <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 600 }}>
        <Paper sx={{
          p: 2,
          bgcolor: c.card, border: '1px solid ' + c.cardBorder,
          borderRadius: `${c.ui.cardRadius}px`, boxShadow: c.ui.cardShadow,
        }}>
          <Typography sx={{ fontSize: c.fontSize('body1'), color: c.text, mb: 0.5, fontWeight: 600 }}>
            Display language
        </Typography>
          <Typography sx={{ fontSize: c.fontSize('caption'), color: c.subtext, mb: 2 }}>
            Sets the language used across every page. Changes apply after a quick reload.
         </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {LANGS.map((l) => {
              const active = current === l.code;
              return (
                <Button
                  key={l.code}
                  onClick={() => pick(l.code)}
                  variant={active ? 'contained' : 'outlined'}
                  sx={{
                    justifyContent: 'flex-start',
                    minHeight: c.ui.minTouchTarget,
                    bgcolor: active ? c.button : c.input,
                    color: active ? c.buttonText : c.text,
                    borderColor: c.buttonBorder,
                    borderRadius: `${c.ui.inputRadius}px`,
                    backgroundImage: 'none',
                    boxShadow: 'none',
                    px: 2,
                    textTransform: 'none',
                    fontSize: c.fontSize('body1'),
                    fontWeight: active ? 700 : 500,
                    '&:hover': {
                      bgcolor: active ? c.buttonHover : c.cardHover,
                      borderColor: c.button,
                      backgroundImage: 'none',
                      boxShadow: 'none',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: c.fontSize('body1'), color: 'inherit' }}>
                      {l.label}
                  </Typography>
                    <Typography sx={{ fontSize: c.fontSize('caption'), color: 'inherit', opacity: 0.85 }}>
                      {l.native}
                  </Typography>
               </Box>
                  {active && (
                    <Typography sx={{ fontSize: c.fontSize('caption'), fontWeight: 700, color: 'inherit', ml: 1 }}>
                      ✓
                 </Typography>
                  )}
              </Button>
              );
            })}
    </Box>
    </Paper>
  </Box>
   </Box>
  );
}
