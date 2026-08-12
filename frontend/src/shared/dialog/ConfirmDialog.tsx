/**
 * ConfirmDialog - reusable confirm prompt.
 * Uses POSCard for container, POSButton for actions, POSIcon for visual hierarchy.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSButton, POSIcon } from '../../components';
import { Warning as WarningIcon, Info as InfoIcon } from '@mui/icons-material';

interface Props {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm',
  cancelLabel = 'Cancel', destructive, onConfirm, onCancel,
}: Props) {
  const c = useTheme();
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
      onClick={onCancel}
    >
      <div onClick={(e: React.MouseEvent) => e.stopPropagation()} style={{ maxWidth: 420, width: '100%' }}>
        <POSCard
          variant="elevated"
          elevation="lg"
          padding="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.cardGap}px` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px` }}>
              <POSIcon
                icon={destructive ? <WarningIcon /> : <InfoIcon />}
                variant={destructive ? 'error' : 'info'}
                size="md"
              />
              <span style={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text }}>
                {title}
              </span>
            </div>
            {message && (
              <span style={{ color: c.subtext, fontSize: c.fontSize('body2'), lineHeight: 1.5 }}>
                {message}
              </span>
            )}
            <div style={{ display: 'flex', gap: `${c.ui.spacingBase}px`, justifyContent: 'flex-end', marginTop: `${c.ui.spacingBase}px` }}>
              <POSButton variant="ghost" size="md" onClick={onCancel}>
                {cancelLabel}
              </POSButton>
              <POSButton
                variant={destructive ? 'danger' : 'primary'}
                size="md"
                onClick={onConfirm}
              >
                {confirmLabel}
              </POSButton>
            </div>
          </div>
        </POSCard>
      </div>
    </div>
  );
}
