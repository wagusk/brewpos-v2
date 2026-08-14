/**
 * OrderFlowTab — configure order approval gate.
 * Uses POSCard, POSButton, POSChip.
 */

import { useTheme } from '../../../core/theme/monoTheme';
import { POSCard, POSButton, POSChip } from '../../../components';
import { Save } from '@mui/icons-material';
import { api } from '../../../core/api';

interface Props {
  settings: any;
  setSettings: (s: any) => void;
  loading: boolean;
  setLoading: (l: boolean) => void;
  setSuccess: (s: string | null) => void;
  setError: (e: string | null) => void;
}

export default function OrderFlowTab({ settings, setSettings, loading, setLoading, setSuccess, setError }: Props) {
  const c = useTheme();

  const approvalRequired = settings.order_approval_required !== false;

  const save = async () => {
    setLoading(true);
    try {
      await api.updateOrderApproval({ order_approval_required: approvalRequired });
      setSuccess('Order flow settings saved');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <POSCard variant="default" padding="lg" style={{ maxWidth: 600 }}>
      <span style={{ fontSize: c.fontSize('h5'), fontWeight: 700, color: c.text, display: 'block', marginBottom: `${c.ui.cardGap}px` }}>
        Order Approval
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: `${c.ui.cardGap}px` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${c.ui.spacingBase}px 0` }}>
          <div style={{ flex: 1, paddingRight: `${c.ui.spacingBase}px` }}>
            <span style={{ fontSize: c.fontSize('body1'), fontWeight: 600, color: c.text, display: 'block', marginBottom: 4 }}>
              {approvalRequired ? 'Enabled' : 'Disabled'}
            </span>
            <span style={{ fontSize: c.fontSize('caption'), color: c.subtext, lineHeight: 1.4, display: 'block' }}>
              {approvalRequired
                ? 'Orders must be accepted by bar or kitchen before a bill can be closed.'
                : 'Bills can be closed immediately without station approval.'}
            </span>
          </div>
          <POSButton
            variant={approvalRequired ? 'outline' : 'primary'}
            size="md"
            onClick={() => setSettings({ ...settings, order_approval_required: false })}
            loading={loading}
            style={{ marginRight: `${c.ui.spacingBase / 2}px` }}
          >
            Disable
          </POSButton>
          <POSButton
            variant={!approvalRequired ? 'outline' : 'primary'}
            size="md"
            onClick={() => setSettings({ ...settings, order_approval_required: true })}
            loading={loading}
          >
            Enable
          </POSButton>
        </div>

        <POSChip variant="station" size="sm" stationType="kitchen">
          Bar or Kitchen approval
        </POSChip>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: `${c.ui.cardGap}px` }}>
        <POSButton variant="primary" size="md" icon={<Save />} loading={loading} onClick={save}>
          Save
        </POSButton>
      </div>
    </POSCard>
  );
}
