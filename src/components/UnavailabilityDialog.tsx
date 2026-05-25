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
import EditIcon from '@mui/icons-material/Edit';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import type { Player, Unavailability, UnavailabilityReason } from '../types';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { parse, format, isValid } from 'date-fns';

interface UnavailabilityDialogProps {
  open: boolean;
  player: Player | null;
  unavailabilities: Unavailability[];
  onClose: () => void;
  onAdd: (entry: Omit<Unavailability, 'id' | 'createdAt'>) => void;
  onEdit: (id: string, entry: Omit<Unavailability, 'id' | 'createdAt'>) => void;
  onDelete: (id: string) => void;
}

const REASON_COLORS: Record<UnavailabilityReason, string> = {
  injured: '#e53935',
  sick: '#ff9800',
  personal: '#7b1fa2',
  other: '#757575',
};

const parseDateStr = (s: string): Date | null => {
  if (!s) return null;
  const d = parse(s, 'yyyy-MM-dd', new Date());
  return isValid(d) ? d : null;
};

const parseTimeStr = (s: string): Date | null => {
  if (!s) return null;
  const d = parse(s, 'HH:mm', new Date());
  return isValid(d) ? d : null;
};

export default function UnavailabilityDialog({
  open,
  player,
  unavailabilities,
  onClose,
  onAdd,
  onEdit,
  onDelete,
}: UnavailabilityDialogProps) {
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [reason, setReason] = useState<UnavailabilityReason>('other');
  const [note, setNote] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [wholeDay, setWholeDay] = useState(true);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');

  const resetForm = () => {
    const today = new Date().toISOString().split('T')[0];
    setEditingId(null);
    setReason('other');
    setNote('');
    setStartDate(today);
    setEndDate(today);
    setWholeDay(true);
    setStartTime('');
    setEndTime('');
    setDateError('');
    setTimeError('');
  };

  useEffect(() => {
    if (open) resetForm();
  }, [open]);

  const validateDates = (start: string, end: string) => {
    if (start && end && end < start) {
      setDateError(t('unavailability.endDateError'));
    } else {
      setDateError('');
    }
  };

  const validateTimes = (start: string, end: string) => {
    if (start && end && end <= start) {
      setTimeError(t('matches.endTimeError'));
    } else {
      setTimeError('');
    }
  };

  const handleStartDateChange = (value: string) => {
    setStartDate(value);
    validateDates(value, endDate);
  };

  const handleEndDateChange = (value: string) => {
    setEndDate(value);
    validateDates(startDate, value);
  };

  const handleStartTimeChange = (value: string) => {
    setStartTime(value);
    validateTimes(value, endTime);
  };

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    validateTimes(startTime, value);
  };

  const playerUnavailabilities = unavailabilities.filter(
    (u) => u.playerId === player?.id
  );

  const handleEditStart = (u: Unavailability) => {
    setEditingId(u.id);
    setReason(u.reason);
    setNote(u.note || '');
    setStartDate(u.startDate);
    setEndDate(u.endDate);
    const hasTime = !!(u.startTime && u.endTime);
    setWholeDay(!hasTime);
    setStartTime(u.startTime || '');
    setEndTime(u.endTime || '');
    setDateError('');
    setTimeError('');
  };

  const handleSave = () => {
    if (!player || !startDate || !endDate) return;
    if (dateError || timeError) return;
    const entry: Omit<Unavailability, 'id' | 'createdAt'> = {
      playerId: player.id,
      reason,
      note: note.trim() || undefined,
      startDate,
      endDate,
      startTime: wholeDay ? undefined : startTime || undefined,
      endTime: wholeDay ? undefined : endTime || undefined,
    };
    if (editingId) {
      onEdit(editingId, entry);
    } else {
      onAdd(entry);
    }
    resetForm();
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
                    <Box>
                      <IconButton edge="end" size="small" onClick={() => handleEditStart(u)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton edge="end" size="small" onClick={() => onDelete(u.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
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

        {/* Add / Edit unavailability */}
        <Typography variant="subtitle2" gutterBottom>
          {editingId ? t('unavailability.editEntry') : t('unavailability.addNew')}
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
            <DatePicker
              label={t('unavailability.startDate')}
              value={parseDateStr(startDate)}
              onChange={(date) => handleStartDateChange(date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')}
              format="dd-MM-yyyy"
              slotProps={{ textField: { size: 'small', fullWidth: true } }}
            />
            <DatePicker
              label={t('unavailability.endDate')}
              value={parseDateStr(endDate)}
              onChange={(date) => handleEndDateChange(date && isValid(date) ? format(date, 'yyyy-MM-dd') : '')}
              format="dd-MM-yyyy"
              slotProps={{ textField: { size: 'small', fullWidth: true, error: !!dateError, helperText: dateError } }}
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
              <TimePicker
                label={t('unavailability.startTime')}
                value={parseTimeStr(startTime)}
                onChange={(time) => handleStartTimeChange(time && isValid(time) ? format(time, 'HH:mm') : '')}
                ampm={false}
                slotProps={{ textField: { size: 'small', fullWidth: true } }}
              />
              <TimePicker
                label={t('unavailability.endTime')}
                value={parseTimeStr(endTime)}
                onChange={(time) => handleEndTimeChange(time && isValid(time) ? format(time, 'HH:mm') : '')}
                ampm={false}
                slotProps={{ textField: { size: 'small', fullWidth: true, error: !!timeError, helperText: timeError } }}
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

          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              onClick={handleSave}
              disabled={!startDate || !endDate || !!dateError || !!timeError}
            >
              {editingId ? t('common.save') : t('unavailability.add')}
            </Button>
            {editingId && (
              <Button variant="text" onClick={resetForm}>
                {t('common.cancel')}
              </Button>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.close')}</Button>
      </DialogActions>
    </Dialog>
  );
}
