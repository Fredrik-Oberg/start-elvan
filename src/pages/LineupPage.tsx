import { useState, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CircularProgress from '@mui/material/CircularProgress';
import { usePlayers } from '../hooks/usePlayers';
import { useTraits } from '../hooks/useTraits';
import { useMatches } from '../hooks/useMatches';
import { useLineup, useAllLineups } from '../hooks/useLineup';
import { useUnavailability, getUnavailablePlayerIds } from '../hooks/useUnavailability';
import { getConflictingPlayerIds } from '../utils/conflicts';
import Pitch from '../components/Pitch';
import DraggablePlayer from '../components/DraggablePlayer';
import PlayerCard from '../components/PlayerCard';
import type { LineupPlayer } from '../types';

export default function LineupPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const { t } = useTranslation();
  const { players } = usePlayers();
  const { traits } = useTraits();
  const { matches } = useMatches();
  const { lineup, loading, createLineup, setPlayers, setBench, toggleShared } = useLineup(matchId || null);
  const { lineups } = useAllLineups();
  const { unavailabilities } = useUnavailability();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [traitFilter, setTraitFilter] = useState<string>('');
  const [snackbar, setSnackbar] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const currentMatch = matches.find((m) => m.id === matchId);

  const conflictingIds = useMemo(() => {
    if (!currentMatch) return new Set<string>();
    return getConflictingPlayerIds(currentMatch, matches, lineups);
  }, [currentMatch, matches, lineups]);

  const unavailableIds = useMemo(() => {
    if (!currentMatch) return new Set<string>();
    return getUnavailablePlayerIds(
      currentMatch.date,
      currentMatch.startTime,
      currentMatch.endTime,
      unavailabilities
    );
  }, [currentMatch, unavailabilities]);

  const assignedPlayerIds = useMemo(() => {
    if (!lineup) return new Set<string>();
    const ids = new Set(lineup.players.map((p) => p.playerId));
    lineup.bench.forEach((id) => ids.add(id));
    return ids;
  }, [lineup]);

  const availablePlayers = useMemo(() => {
    return players.filter((p) => {
      if (assignedPlayerIds.has(p.id)) return false;
      if (traitFilter && !p.traits.includes(traitFilter)) return false;
      return true;
    });
  }, [players, assignedPlayerIds, traitFilter]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      if (!lineup || !event.over) return;

      const playerId = event.active.id as string;
      const target = event.over.id as string;

      if (target === 'pitch') {
        // Dropped on pitch - calculate position from the drop coordinates
        const pitchRect = document.getElementById('pitch-drop-zone')?.getBoundingClientRect();
        if (!pitchRect) return;

        // Use the delta from dnd-kit to calculate position
        const delta = event.delta;
        const activeRect = event.active.rect.current.translated;
        if (!activeRect) return;

        const x = ((activeRect.left + activeRect.width / 2 - pitchRect.left) / pitchRect.width) * 100;
        const y = ((activeRect.top + activeRect.height / 2 - pitchRect.top) / pitchRect.height) * 100;

        const clampedX = Math.max(5, Math.min(95, x));
        const clampedY = Math.max(5, Math.min(95, y));

        // Remove from bench if was there
        const newBench = lineup.bench.filter((id) => id !== playerId);
        // Remove from existing pitch position
        const newPlayers = lineup.players.filter((p) => p.playerId !== playerId);
        newPlayers.push({ playerId, x: clampedX, y: clampedY });

        setPlayers(newPlayers);
        if (newBench.length !== lineup.bench.length) setBench(newBench);
      } else if (target === 'bench') {
        // Move to bench
        const newPlayers = lineup.players.filter((p) => p.playerId !== playerId);
        const newBench = [...lineup.bench.filter((id) => id !== playerId), playerId];
        setPlayers(newPlayers);
        setBench(newBench);
      }
    },
    [lineup, setPlayers, setBench]
  );

  const handlePitchDrop = useCallback(
    (playerId: string, x: number, y: number) => {
      if (!lineup) return;
      const newPlayers: LineupPlayer[] = lineup.players.filter((p) => p.playerId !== playerId);
      newPlayers.push({ playerId, x, y });
      // Remove from bench if needed
      const newBench = lineup.bench.filter((id) => id !== playerId);
      setPlayers(newPlayers);
      if (newBench.length !== lineup.bench.length) setBench(newBench);
    },
    [lineup, setPlayers, setBench]
  );

  const handleRemoveFromPitch = useCallback(
    (playerId: string) => {
      if (!lineup) return;
      const newPlayers = lineup.players.filter((p) => p.playerId !== playerId);
      const newBench = lineup.bench.filter((id) => id !== playerId);
      setPlayers(newPlayers);
      setBench(newBench);
    },
    [lineup, setPlayers, setBench]
  );

  const handleShare = async () => {
    if (!lineup) return;
    await toggleShared();
    const url = `${window.location.origin}/lineup/${matchId}`;
    await navigator.clipboard.writeText(url);
    setSnackbar(t('lineup.linkCopied'));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!matchId) {
    return <Typography>No match selected</Typography>;
  }

  // Auto-create lineup if none exists
  if (!lineup) {
    createLineup(matchId);
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const activePlayer = players.find((p) => p.id === activeId);

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h5">
            {t('lineup.title')} {currentMatch && `— vs ${currentMatch.opponent}`}
          </Typography>
          <Tooltip title={t('lineup.share')}>
            <IconButton onClick={handleShare}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
        </Box>

        <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
          {/* Sidebar - Available Players */}
          <Paper
            sx={{
              width: { xs: '100%', md: 280 },
              p: 2,
              maxHeight: { md: 'calc(100vh - 150px)' },
              overflow: 'auto',
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              {t('lineup.availablePlayers')}
            </Typography>

            <FormControl size="small" fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('lineup.filterByTrait')}</InputLabel>
              <Select
                value={traitFilter}
                onChange={(e) => setTraitFilter(e.target.value)}
                label={t('lineup.filterByTrait')}
              >
                <MenuItem value="">All</MenuItem>
                {traits.map((trait) => (
                  <MenuItem key={trait.id} value={trait.id}>
                    {trait.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {availablePlayers.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t('lineup.noPlayers')}
              </Typography>
            ) : (
              <Box display="flex" flexDirection="column" gap={1}>
                {availablePlayers.map((player) => {
                  const isConflicting = conflictingIds.has(player.id);
                  const isUnavailable = unavailableIds.has(player.id);
                  const disabled = isConflicting || isUnavailable;
                  let message: string | undefined;
                  if (isUnavailable) message = t('lineup.unavailable');
                  else if (isConflicting) message = t('lineup.conflict');
                  return (
                    <DraggablePlayer
                      key={player.id}
                      player={player}
                      traits={traits}
                      disabled={disabled}
                      conflictMessage={message}
                    />
                  );
                })}
              </Box>
            )}
          </Paper>

          {/* Pitch */}
          <Box flexGrow={1}>
            <Pitch
              players={lineup.players}
              allPlayers={players}
              traits={traits}
              onDrop={handlePitchDrop}
              onRemove={handleRemoveFromPitch}
            />

            {/* Bench */}
            <Paper sx={{ mt: 2, p: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('lineup.bench')}
              </Typography>
              <Box display="flex" gap={1} flexWrap="wrap">
                {lineup.bench.map((playerId) => {
                  const player = players.find((p) => p.id === playerId);
                  if (!player) return null;
                  return (
                    <Chip
                      key={playerId}
                      label={`${player.name}`}
                      onDelete={() => handleRemoveFromPitch(playerId)}
                    />
                  );
                })}
                {lineup.bench.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {t('lineup.dragHint')}
                  </Typography>
                )}
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>

      <DragOverlay>
        {activePlayer && <PlayerCard player={activePlayer} traits={traits} />}
      </DragOverlay>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
      >
        <Alert severity="success" onClose={() => setSnackbar('')}>
          {snackbar}
        </Alert>
      </Snackbar>
    </DndContext>
  );
}
