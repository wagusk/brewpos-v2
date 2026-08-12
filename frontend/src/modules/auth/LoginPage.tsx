/**
 * LoginPage — PIN pad authentication.
 * Uses POSCard, POSButton, POSIcon for all rendering.
 * All styling driven by theme tokens.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../core/api';
import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSButton, POSIcon } from '../../components';
import CoffeeIcon from '@mui/icons-material/Coffee';
import BackspaceIcon from '@mui/icons-material/Backspace';

export default function LoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const c = useTheme();
  const nav = useNavigate();

  const tap = (n: string) => {
    setError(null);
    if (pin.length >= 8) return;
    setPin((p) => p + n);
  };

  const back = () => setPin((p) => p.slice(0, -1));

  const submit = async () => {
    if (pin.length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const r = await api.login(pin);
      localStorage.setItem('brewpos_token', r.access_token);
      localStorage.setItem('brewpos_user', JSON.stringify(r.user));
      nav('/tables');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'enter'];

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.page,
      padding: `${c.ui.spacingBase * 2}px`,
    }}>
      <POSCard
        variant="elevated"
        elevation="lg"
        padding="lg"
        style={{ width: '100%', maxWidth: 420 }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.cardGap}px` }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.cardGap}px` }}>
            <div style={{
              width: 44, height: 44,
              borderRadius: `${c.ui.inputRadius}px`,
              backgroundColor: c.button,
              color: c.buttonText,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <POSIcon icon={<CoffeeIcon />} size="md" />
            </div>
            <div>
              <div style={{ fontWeight: 700, lineHeight: 1.1, color: c.text, fontSize: c.fontSize('h5') }}>
                Brew-POS v2
              </div>
              <div style={{ color: c.subtext, fontSize: c.fontSize('caption') }}>
                Sign in to your terminal
              </div>
            </div>
          </div>

          {/* PIN display */}
          <div style={{
            width: '100%',
            paddingTop: `${c.ui.cardPadding}px`,
            paddingBottom: `${c.ui.cardPadding}px`,
            textAlign: 'center',
            letterSpacing: '8px',
            fontSize: '1.75rem',
            fontWeight: 700,
            minHeight: `${c.ui.cardMinHeight}px`,
            borderRadius: `${c.ui.buttonRadius}px`,
            border: `1px solid ${c.inputBorder}`,
            backgroundColor: c.input,
            color: c.inputText,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {pin ? '•'.repeat(pin.length) : '—'}
          </div>

          {/* Error */}
          {error && (
            <div style={{
              width: '100%',
              padding: `${c.ui.spacingBase}px`,
              borderRadius: `${c.ui.inputRadius}px`,
              border: `1px solid ${c.errorBorder}`,
              backgroundColor: c.errorBg,
              color: c.errorText,
              fontSize: c.fontSize('body2'),
              textAlign: 'center',
            }}>
              {error}
            </div>
          )}

          {/* Keypad grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: `${c.ui.cardGap}px`,
            width: '100%',
          }}>
            {keys.map((k) => {
              if (k === 'clear') {
                return (
                  <POSButton key={k} variant="outline" size="lg" onClick={() => setPin('')}>
                    Clear
                  </POSButton>
                );
              }
              if (k === 'enter') {
                return (
                  <POSButton
                    key={k}
                    variant="primary"
                    size="lg"
                    onClick={submit}
                    disabled={loading || pin.length < 3}
                    loading={loading}
                  >
                    Enter
                  </POSButton>
                );
              }
              return (
                <POSButton key={k} variant="secondary" size="lg" onClick={() => tap(k)}>
                  {k}
                </POSButton>
              );
            })}
          </div>

          {/* Backspace */}
          <POSButton variant="ghost" size="sm" icon={<BackspaceIcon />} onClick={back}
            style={{ alignSelf: 'center' }}>
            Backspace
          </POSButton>

          {/* Help text */}
          <div style={{ textAlign: 'center', color: c.muted, fontSize: c.fontSize('caption'), marginTop: `${c.ui.spacingBase}px` }}>
            Demo: admin 9999 · cashier 1111 · waiter 2222 · kitchen 3333
          </div>
        </div>
      </POSCard>
    </div>
  );
}
