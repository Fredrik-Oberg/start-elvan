import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import type { Player, Trait } from '../types';

interface PlayerDialogProps {
  open: boolean;
  player: Player | null;
  traits: Trait[];
  onClose: () => void;
  onSave: (data: Omit<Player, 'id' | 'createdAt'>) => void;
}

export default function PlayerDialog({ open, player, traits, onClose, onSave }: PlayerDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [number, setNumber] = useState<number>(0);
  const [selectedTraits, setSelectedTraits] = useState<string[]>([]);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setNumber(player.number);
      setSelectedTraits(player.traits);
    } else {
      setName('');
      setNumber(0);
      setSelectedTraits([]);
    }
  }, [player, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), number, traits: selectedTraits });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {player ? t('roster.editPlayer') : t('roster.addPlayer')}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label={t('roster.name')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label={t('roster.number')}
              type="number"
              value={number}
              onChange={(e) => setNumber(parseInt(e.target.value) || 0)}
              inputProps={{ min: 0, max: 99 }}
            />
            <FormControl>
              <InputLabel>{t('roster.traits')}</InputLabel>
              <Select
                multiple
                value={selectedTraits}
                onChange={(e) => setSelectedTraits(e.target.value as string[])}
                input={<OutlinedInput label={t('roster.traits')} />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const trait = traits.find((t) => t.id === id);
                      return (
                        <Chip
                          key={id}
                          label={trait?.label || id}
                          size="small"
                          sx={{
                            backgroundColor: trait?.color || '#999',
                            color: '#fff',
                          }}
                        />
                      );
                    })}
                  </Box>
                )}
              >
                {traits.map((trait) => (
                  <MenuItem key={trait.id} value={trait.id}>
                    <Chip
                      size="small"
                      label={trait.label}
                      sx={{ backgroundColor: trait.color, color: '#fff', mr: 1 }}
                    />
                    {trait.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
