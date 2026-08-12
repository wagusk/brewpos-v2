/**
 * ErrorState - centered error message with retry button.
 * Uses POSCard, POSButton, POSIcon.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSButton, POSIcon } from '../../components';
import { ErrorOutline as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material';

interface Props {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  height?: string | number;
}

export default function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Retry',
  height = '100%',
}: Props) {
  const c = useTheme();
  return (
    <POSCard
      variant="default"
      padding="lg"
      style={{
        height,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: `${c.ui.spacingBase * 1.5}px`,
      }}
    >
      <POSIcon icon={<ErrorIcon />} size="lg" variant="error" />
      <span style={{ color: c.text, fontSize: c.fontSize('h6'), fontWeight: 700 }}>
        {title}
      </span>
      {message && (
        <span style={{ color: c.subtext, fontSize: c.fontSize('body2'), textAlign: 'center', maxWidth: 480 }}>
          {message}
        </span>
      )}
      {onRetry && (
        <POSButton variant="outline" size="md" icon={<RefreshIcon />} onClick={onRetry}>
          {retryLabel}
        </POSButton>
      )}
    </POSCard>
  );
}
