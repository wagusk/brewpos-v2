/**
 * ConfirmDialog - reusable confirm prompt.
 * Replaces ad-hoc window.confirm() and inline MUI Dialogs across pages.
 */

import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useTheme } from '../../core/theme/monoTheme';

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
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: c.text, fontWeight: 700 }}>
        {title}
 </DialogTitle>
      {message && (
        <DialogContent>
          <Typography sx={{ color: c.subtext, fontSize: c.fontSize('body2') }}>
            {message}
     </Typography>
   </DialogContent>
      )}
      <DialogActions>
        <Button onClick={onCancel} sx={{ color: c.subtext }}>
          {cancelLabel}
   </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          sx={{
            backgroundImage: 'none',
            bgcolor: destructive ? c.errorBorder : c.button,
            color: c.bg,
            '&:hover': {
              backgroundImage: 'none',
              bgcolor: destructive ? c.errorText : c.buttonHover,
            },
          }}
        >
          {confirmLabel}
   </Button>
 </DialogActions>
</Dialog>
  );
}
