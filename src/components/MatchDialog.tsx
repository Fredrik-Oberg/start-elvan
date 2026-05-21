import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import type { Match } from '../types';

interface MatchDialogProps {
  open: boolean;
  match: Match | null;
  onClose: () => void;
  onSave: (data: Omit<Match, 'id' | 'createdAt' | 'version'>) => void;
}

export default function MatchDialog({ open, match, onClose, onSave }: MatchDialogProps) {
  const { t } = useTranslation();
  const [opponent, setOpponent] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [timeError, setTimeError] = useState('');

  useEffect(() => {
    if (match) {
      setOpponent(match.opponent);
      setDate(match.date);
      setStartTime(match.startTime);
      setEndTime(match.endTime);
      setLocation(match.location || '');
    } else {
      setOpponent('');
      setDate(new Date().toISOString().split('T')[0]);
      setStartTime('10:00');
      setEndTime('11:30');
      setLocation('');
    }
    setTimeError('');
  }, [match, open]);

  const validateTimes = (start: string, end: string) => {
    if (start && end && end <= start) {
      setTimeError(t('matches.endTimeError'));
    } else {
      setTimeError('');
    }
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    validateTimes(value, endTime);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    validateTimes(startTime, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!opponent.trim() || !date || !startTime || !endTime) return;
    if (endTime <= startTime) return;
    onSave({
      opponent: opponent.trim(),
      date,
      startTime,
      endTime,
      location: location.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>
          {match ? t('matches.editMatch') : t('matches.addMatch')}
        </DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label={t('matches.opponent')}
              value={opponent}
              onChange={(e) => setOpponent(e.target.value)}
              required
              autoFocus
            />
            <TextField
              label={t('matches.date')}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              slotProps={{ inputLabel: { shrink: true }, htmlInput: { lang: 'sv-SE' } }}
            />
            <Box display="flex" gap={2}>
              <TextField
                label={t('matches.startTime')}
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                required
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { lang: 'sv-SE' } }}
                fullWidth
              />
              <TextField
                label={t('matches.endTime')}
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                required
                error={!!timeError}
                helperText={timeError}
                slotProps={{ inputLabel: { shrink: true }, htmlInput: { lang: 'sv-SE' } }}
                fullWidth
              />
            </Box>
            <TextField
              label={t('matches.location')}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={!!timeError}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
