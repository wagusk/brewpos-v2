/**
 * EmptyState - centered icon + title + subtitle.
 * Uses POSCard for container, POSIcon for visual hierarchy.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSIcon } from '../../components';
import { Inbox as InboxIcon } from '@mui/icons-material';

interface Props {
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  height?: string | number;
}

export default function EmptyState({ title = 'Nothing here yet', subtitle, icon, height = '100%' }: Props) {
  const c = useTheme();
  return (
    <POSCard
      variant="default"
      padding="lg"
      style={{
        height,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: `${c.ui.spacingBase}px`,
        opacity: 0.7,
      }}
    >
      <POSIcon icon={icon ?? <InboxIcon />} size="lg" variant="muted" />
      <span style={{ color: c.text, fontSize: c.fontSize('body1'), fontWeight: 600 }}>
        {title}
      </span>
      {subtitle && (
        <span style={{ color: c.subtext, fontSize: c.fontSize('body2'), textAlign: 'center', maxWidth: 360 }}>
          {subtitle}
        </span>
      )}
    </POSCard>
  );
}
