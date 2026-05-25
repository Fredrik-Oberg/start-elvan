import { useState, useCallback, useMemo } from 'react';
import Checkbox from '@mui/material/Checkbox';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import WeekendIcon from '@mui/icons-material/Weekend';
import CircularProgress from '@mui/material/CircularProgress';
import { usePlayers } from '../hooks/usePlayers';
import { useTraits } from '../hooks/useTraits';
import { useMatches } from '../hooks/useMatches';
import { useLineup, useAllLineups } from '../hooks/useLineup';
import { useTeamId } from '../hooks/useTeam';
import { useUnavailability, getUnavailablePlayerIds } from '../hooks/useUnavailability';
import { getConflictingPlayerIds } from '../utils/conflicts';
import Pitch from '../components/Pitch';
import PlayerCard from '../components/PlayerCard';
import type { LineupPlayer } from '../types';

export default function LineupPage() {
  const { matchId, lineupId } = useParams<{ matchId?: string; lineupId?: string }>();
  const { t } = useTranslation();
  const teamId = useTeamId();
  const { players } = usePlayers();
  const { traits } = useTraits();
  const { matches } = useMatches();
  const { lineup, loading, createLineup, setPlayers, setBench, toggleShared, renameLineup } = useLineup(matchId || null, lineupId || null);
  const { lineups } = useAllLineups();
  const { unavailabilities } = useUnavailability();
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [traitFilter, setTraitFilter] = useState<string>('');
  const [snackbar, setSnackbar] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const currentMatch = matches.find((m) => m.id === (matchId || lineup?.matchId));

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
      // Exclude unavailable and conflicting players from the selectable list
      if (unavailableIds.has(p.id)) return false;
      if (conflictingIds.has(p.id)) return false;
      return true;
    });
  }, [players, assignedPlayerIds, traitFilter, unavailableIds, conflictingIds]);

  const handleToggleFieldSelect = useCallback(
    (playerId: string) => {
      setSelectedPlayerIds((prev) =>
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId]
      );
    },
    []
  );

  const handleSendToBench = useCallback(
    (playerId: string) => {
      if (!lineup) return;
      const newBench = [...lineup.bench.filter((id) => id !== playerId), playerId];
      // Remove from pitch if on pitch
      const newPlayers = lineup.players.filter((p) => p.playerId !== playerId);
      if (newPlayers.length !== lineup.players.length) setPlayers(newPlayers);
      setBench(newBench);
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

  const handleTapToPlace = useCallback(
    (x: number, y: number) => {
      if (!lineup || selectedPlayerIds.length === 0) return;
      const nextPlayerId = selectedPlayerIds[0];
      const newPlayers: LineupPlayer[] = lineup.players.filter((p) => p.playerId !== nextPlayerId);
      newPlayers.push({ playerId: nextPlayerId, x, y });
      const newBench = lineup.bench.filter((id) => id !== nextPlayerId);
      setPlayers(newPlayers);
      if (newBench.length !== lineup.bench.length) setBench(newBench);
      setSelectedPlayerIds((prev) => prev.slice(1));
    },
    [lineup, selectedPlayerIds, setPlayers, setBench]
  );

  const handleShare = async () => {
    if (!lineup) return;
    await toggleShared();
    const url = `${window.location.origin}/lineup/id/${lineup.id}?team=${teamId}`;
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

  if (!matchId && !lineupId) {
    return <Typography>No match selected</Typography>;
  }

  // Auto-create lineup if none exists (only when accessed via matchId)
  if (!lineup && matchId) {
    createLineup(matchId);
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!lineup) {
    return <Typography>Lineup not found</Typography>;
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          {editingName ? (
            <TextField
              size="small"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={() => {
                renameLineup(nameValue);
                setEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  renameLineup(nameValue);
                  setEditingName(false);
                }
              }}
              autoFocus
              placeholder={t('lineup.namePlaceholder')}
            />
          ) : (
            <>
              <Typography variant="h5">
                {lineup.name || t('lineup.title')} {currentMatch && `— vs ${currentMatch.opponent}`}
              </Typography>
              <IconButton
                size="small"
                onClick={() => {
                  setNameValue(lineup.name || '');
                  setEditingName(true);
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </>
          )}
        </Box>
        <Tooltip title={t('lineup.share')}>
          <IconButton onClick={handleShare}>
            <ShareIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Box display="flex" gap={2} flexDirection={{ xs: 'column', md: 'row' }}>
        {/* Sidebar - Available Players (shows after pitch on mobile) */}
        <Paper
          sx={{
            width: { xs: '100%', md: 280 },
            p: 2,
            maxHeight: { md: 'calc(100vh - 150px)' },
            overflow: 'auto',
            flexShrink: 0,
            order: { xs: 2, md: 0 },
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
              <Box display="flex" flexDirection="column" gap={0.5}>
                {availablePlayers.map((player) => {
                  const isSelected = selectedPlayerIds.includes(player.id);
                  return (
                  <Box
                    key={player.id}
                    sx={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={isSelected}
                      onChange={() => handleToggleFieldSelect(player.id)}
                      sx={{ p: 0.25 }}
                    />
                    <Box flex={1} minWidth={0}>
                      <PlayerCard player={player} traits={traits} />
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleSendToBench(player.id)}
                      sx={{ p: 0.5, flexShrink: 0 }}
                    >
                      <WeekendIcon fontSize="small" />
                    </IconButton>
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Show unavailable/conflicting players greyed out */}
          {players.filter((p) => !assignedPlayerIds.has(p.id) && (unavailableIds.has(p.id) || conflictingIds.has(p.id))).length > 0 && (
            <Box mt={2}>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                {t('lineup.unavailablePlayers')}
              </Typography>
              <Box display="flex" flexDirection="column" gap={0.5}>
                {players
                  .filter((p) => !assignedPlayerIds.has(p.id) && (unavailableIds.has(p.id) || conflictingIds.has(p.id)))
                  .map((player) => {
                    const isUnavailable = unavailableIds.has(player.id);
                    return (
                      <Box
                        key={player.id}
                        sx={{
                          opacity: 0.4,
                          filter: 'grayscale(100%)',
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        <Box flex={1} minWidth={0}>
                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ position: 'absolute', top: -2, right: 4, zIndex: 1 }}
                          >
                            {isUnavailable ? t('lineup.unavailable') : t('lineup.conflict')}
                          </Typography>
                          <PlayerCard player={player} traits={traits} />
                        </Box>
                      </Box>
                    );
                  })}
              </Box>
            </Box>
          )}
        </Paper>

        {/* Pitch */}
        <Box flexGrow={1} sx={{ order: { xs: 1, md: 0 } }}>
          {selectedPlayerIds.length > 0 && (
            <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography variant="caption" color="text.secondary">
                {t('lineup.tapToPlace')}:
              </Typography>
              {selectedPlayerIds.map((id) => {
                const p = players.find((pl) => pl.id === id);
                return p ? (
                  <Chip
                    key={id}
                    label={p.name}
                    size="small"
                    onDelete={() => setSelectedPlayerIds((prev) => prev.filter((pid) => pid !== id))}
                  />
                ) : null;
              })}
            </Box>
          )}
          <Pitch
            players={lineup.players}
            allPlayers={players}
            traits={traits}
            onDrop={handlePitchDrop}
            onRemove={handleRemoveFromPitch}
            selectedPlayerId={selectedPlayerIds[0] || null}
            selectedPlayerName={selectedPlayerIds.length > 0 ? `${players.find((p) => p.id === selectedPlayerIds[0])?.name || ''} (+${selectedPlayerIds.length - 1})` : undefined}
            onTapToPlace={handleTapToPlace}
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
                    onClick={() => handleToggleFieldSelect(playerId)}
                    clickable
                  />
                );
              })}
              {lineup.bench.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  {t('lineup.benchEmpty')}
                </Typography>
              )}
            </Box>
          </Paper>
        </Box>
      </Box>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar('')}
      >
        <Alert severity="success" onClose={() => setSnackbar('')}>
          {snackbar}
        </Alert>
      </Snackbar>
    </Box>
  );
}
