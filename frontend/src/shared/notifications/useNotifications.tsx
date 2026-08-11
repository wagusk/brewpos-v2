/**
 * useNotifications - shared hook for error/success toasts.
 *
 * Every page that previously had its own Snackbar + Alert pair now uses
 * this hook. It manages a small queue of messages; the helper component
 * <Toasts /> renders them as MUI Snackbars. Theme-driven.
 */

import { useState, useCallback } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useTheme } from '../../core/theme/monoTheme';

export interface NotificationItem {
  id: number;
  message: string;
  severity: 'error' | 'success' | 'warning' | 'info';
}

let _id = 0;
const _nextId = () => ++_id;

export interface UseNotifications {
  error: (msg: string) => void;
  success: (msg: string) => void;
  warning: (msg: string) => void;
  info: (msg: string) => void;
  notify: (msg: string, severity?: NotificationItem['severity']) => void;
  items: NotificationItem[];
  dismiss: (id: number) => void;
}

export function useNotifications(): UseNotifications {
  const [items, setItems] = useState<NotificationItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notify = useCallback((message: string, severity: NotificationItem['severity'] = 'info') => {
    setItems((prev) => [...prev, { id: _nextId(), message, severity }]);
  }, []);

  return {
    error: (m) => notify(m, 'error'),
    success: (m) => notify(m, 'success'),
    warning: (m) => notify(m, 'warning'),
    info: (m) => notify(m, 'info'),
    notify,
    items,
    dismiss,
  };
}

interface ToastsProps {
  controller: UseNotifications;
}

/**
 * Renders the queue managed by useNotifications as MUI Snackbars.
 * Mount once near the top of a page (after main content, before close).
 */
export function Toasts({ controller }: ToastsProps) {
  const c = useTheme();
  return (
    <>
      {controller.items.map((n) => {
        const sx =
          n.severity === 'error'
            ? { bgcolor: c.errorBg, color: c.errorText, border: '1px solid ' + c.errorBorder }
            : n.severity === 'success'
              ? { bgcolor: c.chip, color: c.success, border: '1px solid ' + c.success }
              : n.severity === 'warning'
                ? { bgcolor: c.input, color: c.warning, border: '1px solid ' + c.warning }
                : { bgcolor: c.input, color: c.text, border: '1px solid ' + c.divider };
        return (
          <Snackbar
            key={n.id}
            open
            autoHideDuration={n.severity === 'error' ? 5000 : 3000}
            onClose={() => controller.dismiss(n.id)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert severity={n.severity} onClose={() => controller.dismiss(n.id)} sx={sx}>
              {n.message}
          </Alert>
      </Snackbar>
        );
      })}
    </>
  );
}
