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
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import type { Player, Unavailability, UnavailabilityReason } from '../types';

interface UnavailabilityDialogProps {
  open: boolean;
  player: Player | null;
  unavailabilities: Unavailability[];
  onClose: () => void;
  onAdd: (entry: Omit<Unavailability, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

const REASON_COLORS: Record<UnavailabilityReason, string> = {
  injured: '#e53935',
  sick: '#ff9800',
  personal: '#7b1fa2',
  other: '#757575',
};

export default function UnavailabilityDialog({
  open,
  player,
  unavailabilities,
  onClose,
  onAdd,
  onDelete,
}: UnavailabilityDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState<UnavailabilityReason>('injured');
  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [wholeDay, setWholeDay] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  useEffect(() => {
    if (open) {
      const today = new Date().toISOString().split('T')[0];
      setReason('injured');
      setNote('');
      setStartDate(today);
      setEndDate(today);
      setWholeDay(true);
      setStartTime('');
      setEndTime('');
    }
  }, [open]);

  const playerUnavailabilities = unavailabilities.filter(
    (u) => u.playerId === player?.id
  );

  const handleAdd = () => {
    if (!player || !startDate || !endDate) return;
    onAdd({
      playerId: player.id,
      reason,
      note: note.trim() || undefined,
      startDate,
      endDate,
      startTime: wholeDay ? undefined : startTime || undefined,
      endTime: wholeDay ? undefined : endTime || undefined,
    });
    // Reset form but keep dialog open
    setNote('');
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('unavailability.title')} — {player?.name}
      </DialogTitle>
      <DialogContent>
        {/* Existing unavailabilities */}
        {playerUnavailabilities.length > 0 && (
          <Box mb={3}>
            <Typography variant="subtitle2" gutterBottom>
              {t('unavailability.current')}
            </Typography>
            <List dense>
              {playerUnavailabilities.map((u) => (
                <ListItem
                  key={u.id}
                  secondaryAction={
                    <IconButton edge="end" size="small" onClick={() => onDelete(u.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Chip
                          label={t(`unavailability.reasons.${u.reason}`)}
                          size="small"
                          sx={{ backgroundColor: REASON_COLORS[u.reason], color: '#fff' }}
                        />
                        <Typography variant="body2">
                          {u.startDate === u.endDate
                            ? u.startDate
                            : `${u.startDate} → ${u.endDate}`}
                          {u.startTime && u.endTime && ` (${u.startTime}–${u.endTime})`}
                        </Typography>
                      </Box>
                    }
                    secondary={u.note}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* Add new unavailability */}
        <Typography variant="subtitle2" gutterBottom>
          {t('unavailability.addNew')}
        </Typography>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('unavailability.reason')}</InputLabel>
            <Select
              value={reason}
              onChange={(e) => setReason(e.target.value as UnavailabilityReason)}
              label={t('unavailability.reason')}
            >
              <MenuItem value="injured">{t('unavailability.reasons.injured')}</MenuItem>
              <MenuItem value="sick">{t('unavailability.reasons.sick')}</MenuItem>
              <MenuItem value="personal">{t('unavailability.reasons.personal')}</MenuItem>
              <MenuItem value="other">{t('unavailability.reasons.other')}</MenuItem>
            </Select>
          </FormControl>

          <Box display="flex" gap={2}>
            <TextField
              label={t('unavailability.startDate')}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
            <TextField
              label={t('unavailability.endDate')}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>

          <FormControlLabel
            control={
              <Switch checked={wholeDay} onChange={(e) => setWholeDay(e.target.checked)} />
            }
            label={t('unavailability.wholeDay')}
          />

          {!wholeDay && (
            <Box display="flex" gap={2}>
              <TextField
                label={t('unavailability.startTime')}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <TextField
                label={t('unavailability.endTime')}
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                size="small"
                fullWidth
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>
          )}

          <TextField
            label={t('unavailability.note')}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            size="small"
            multiline
            rows={2}
          />

          <Button variant="outlined" onClick={handleAdd} disabled={!startDate || !endDate}>
            {t('unavailability.add')}
          </Button>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
