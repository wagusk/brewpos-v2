/**
 * PageHeader - consistent page title bar.
 * Uses POSCard for container, POSChip for badge, POSIcon for visual hierarchy.
 */

import { useTheme } from '../../core/theme/monoTheme';
import { POSCard, POSChip, POSIcon } from '../../components';

interface Props {
  title: string;
  subtitle?: string;
  badge?: { label: string; color?: string };
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, badge, actions, icon }: Props) {
  const c = useTheme();
  return (
    <POSCard
      variant="default"
      padding="md"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: `${c.ui.cardGap}px`,
        borderBottom: `1px solid ${c.divider}`,
        borderRadius: 0,
        boxShadow: 'none',
        border: 'none',
        borderBottomWidth: 1,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.spacingBase / 2}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: `${c.ui.spacingBase}px` }}>
          {icon && <POSIcon icon={icon} size="md" />}
          <span style={{ fontSize: c.fontSize('h4'), fontWeight: 700, color: c.text }}>
            {title}
          </span>
          {badge && (
            <POSChip variant="default" size="sm">
              {badge.label}
            </POSChip>
          )}
        </div>
        {subtitle && (
          <span style={{ color: c.subtext, fontSize: c.fontSize('body2') }}>
            {subtitle}
          </span>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: `${c.ui.spacingBase}px`, alignItems: 'center' }}>
          {actions}
        </div>
      )}
    </POSCard>
  );
}
