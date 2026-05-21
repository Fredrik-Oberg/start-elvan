import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import Autocomplete from '@mui/material/Autocomplete';
import type { Player, Trait } from '../types';

interface TraitOption {
  id: string;
  label: string;
  color: string;
  isNew?: boolean;
}

interface PlayerDialogProps {
  open: boolean;
  player: Player | null;
  traits: Trait[];
  onClose: () => void;
  onSave: (data: Omit<Player, 'id' | 'createdAt' | 'version'>) => void;
  onCreateTrait?: (data: Omit<Trait, 'id'>) => Promise<void>;
}

const DEFAULT_COLORS = ['#2196f3', '#4caf50', '#ff9800', '#e91e63', '#9c27b0', '#00bcd4', '#ff5722', '#607d8b'];

export default function PlayerDialog({ open, player, traits, onClose, onSave, onCreateTrait }: PlayerDialogProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [selectedTraits, setSelectedTraits] = useState<TraitOption[]>([]);

  useEffect(() => {
    if (player) {
      setName(player.name);
      setSelectedTraits(
        player.traits
          .map((id) => traits.find((t) => t.id === id))
          .filter(Boolean)
          .map((t) => ({ id: t!.id, label: t!.label, color: t!.color }))
      );
    } else {
      setName('');
      setSelectedTraits([]);
    }
  }, [player, open]);

  // Resolve pending trait IDs when traits list updates from Firestore
  useEffect(() => {
    setSelectedTraits((prev) =>
      prev.map((opt) => {
        if (opt.isNew) {
          const found = traits.find((t) => t.label.toLowerCase() === opt.label.toLowerCase());
          if (found) return { id: found.id, label: found.label, color: found.color };
        }
        return opt;
      })
    );
  }, [traits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Resolve trait IDs — pending traits should have been created already via onChange
    // Find their real IDs by matching labels against the latest traits list
    const traitIds: string[] = [];
    for (const opt of selectedTraits) {
      if (opt.isNew) {
        const found = traits.find((t) => t.label.toLowerCase() === opt.label.toLowerCase());
        if (found) traitIds.push(found.id);
      } else {
        traitIds.push(opt.id);
      }
    }

    onSave({ name: name.trim(), traits: traitIds });
  };

  const traitOptions: TraitOption[] = traits.map((t) => ({
    id: t.id,
    label: t.label,
    color: t.color,
  }));

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
            <Autocomplete
              multiple
              freeSolo
              options={traitOptions}
              value={selectedTraits}
              getOptionLabel={(opt) => (typeof opt === 'string' ? opt : opt.label)}
              isOptionEqualToValue={(opt, val) => opt.id === val.id}
              onChange={async (_e, newValue) => {
                const processed: TraitOption[] = [];
                for (const item of newValue) {
                  if (typeof item === 'string') {
                    // User typed a new trait name and pressed Enter
                    const existing = traits.find(
                      (t) => t.label.toLowerCase() === item.toLowerCase()
                    );
                    if (existing) {
                      processed.push({ id: existing.id, label: existing.label, color: existing.color });
                    } else if (onCreateTrait) {
                      const color = DEFAULT_COLORS[traits.length % DEFAULT_COLORS.length];
                      await onCreateTrait({ label: item, color });
                      // Trait will appear via real-time listener; add placeholder
                      processed.push({ id: `pending-${item}`, label: item, color, isNew: true });
                    }
                  } else {
                    processed.push(item);
                  }
                }
                setSelectedTraits(processed);
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    {...getTagProps({ index })}
                    key={option.id}
                    label={option.label}
                    size="small"
                    sx={{ backgroundColor: option.color, color: '#fff' }}
                  />
                ))
              }
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Chip
                    size="small"
                    label={option.label}
                    sx={{ backgroundColor: option.color, color: '#fff', mr: 1 }}
                  />
                  {option.label}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t('roster.traits')}
                  placeholder={t('traits.createInline')}
                />
              )}
            />
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
