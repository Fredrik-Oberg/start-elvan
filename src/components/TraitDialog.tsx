import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Trait } from '../types';

const PRESET_COLORS = [
  '#e53935', '#d81b60', '#8e24aa', '#5e35b1',
  '#3949ab', '#1e88e5', '#039be5', '#00acc1',
  '#00897b', '#43a047', '#7cb342', '#c0ca33',
  '#fdd835', '#ffb300', '#fb8c00', '#f4511e',
];

interface TraitDialogProps {
  open: boolean;
  trait: Trait | null;
  onClose: () => void;
  onSave: (data: Omit<Trait, 'id'>) => void;
}

export default function TraitDialog({ open, trait, onClose, onSave }: TraitDialogProps) {
  const { t } = useTranslation();
  const [label, setLabel] = useState('');
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    if (trait) {
      setLabel(trait.label);
      setColor(trait.color);
    } else {
      setLabel('');
      setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    }
  }, [trait, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onSave({ label: label.trim(), color });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {trait ? t('traits.editTrait') : t('traits.addTrait')}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label={t('traits.label')}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              autoFocus
            />
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('traits.color')}
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={1}>
                {PRESET_COLORS.map((c) => (
                  <Box
                    key={c}
                    onClick={() => setColor(c)}
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      backgroundColor: c,
                      cursor: 'pointer',
                      border: color === c ? '3px solid #000' : '3px solid transparent',
                      transition: 'border-color 0.2s',
                    }}
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
