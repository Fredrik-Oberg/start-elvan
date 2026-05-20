import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CircularProgress from '@mui/material/CircularProgress';
import { usePlayers } from '../hooks/usePlayers';
import { useTraits } from '../hooks/useTraits';
import { useUnavailability } from '../hooks/useUnavailability';
import PlayerDialog from '../components/PlayerDialog';
import ImportDialog from '../components/ImportDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import UnavailabilityDialog from '../components/UnavailabilityDialog';
import type { Player } from '../types';

export default function RosterPage() {
  const { t } = useTranslation();
  const { players, loading, addPlayer, updatePlayer, deletePlayer } = usePlayers();
  const { traits } = useTraits();
  const { unavailabilities, addUnavailability, deleteUnavailability } = useUnavailability();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [unavailPlayer, setUnavailPlayer] = useState<Player | null>(null);

  const isCurrentlyUnavailable = (playerId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return unavailabilities.some(
      (u) => u.playerId === playerId && u.startDate <= today && u.endDate >= today
    );
  };

  const filteredPlayers = players.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.number.toString().includes(search)
  );

  const getTraitLabel = (traitId: string) => {
    const trait = traits.find((t) => t.id === traitId);
    return trait?.label || traitId;
  };

  const getTraitColor = (traitId: string) => {
    const trait = traits.find((t) => t.id === traitId);
    return trait?.color || '#999';
  };

  const handleSavePlayer = async (data: Omit<Player, 'id' | 'createdAt'>) => {
    if (editingPlayer) {
      await updatePlayer(editingPlayer.id, data);
    } else {
      await addPlayer(data);
    }
    setDialogOpen(false);
    setEditingPlayer(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deletePlayer(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('roster.title')}</Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<FileUploadIcon />}
            onClick={() => setImportOpen(true)}
          >
            {t('roster.importPlayers')}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingPlayer(null);
              setDialogOpen(true);
            }}
          >
            {t('roster.addPlayer')}
          </Button>
        </Stack>
      </Box>

      <TextField
        fullWidth
        placeholder={t('roster.search')}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 3 }}
        size="small"
      />

      {filteredPlayers.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          {t('roster.noPlayers')}
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {filteredPlayers.map((player) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={player.id}>
              <Card sx={{ opacity: isCurrentlyUnavailable(player.id) ? 0.7 : 1 }}>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="h6">
                        #{player.number} {player.name}
                        {isCurrentlyUnavailable(player.id) && (
                          <Chip
                            label={t('unavailability.reasons.' + (unavailabilities.find(u => u.playerId === player.id && u.startDate <= new Date().toISOString().split('T')[0] && u.endDate >= new Date().toISOString().split('T')[0])?.reason || 'other'))}
                            size="small"
                            color="error"
                            sx={{ ml: 1, verticalAlign: 'middle' }}
                          />
                        )}
                      </Typography>
                      <Stack direction="row" spacing={0.5} mt={1} flexWrap="wrap" useFlexGap>
                        {player.traits.map((traitId) => (
                          <Chip
                            key={traitId}
                            label={getTraitLabel(traitId)}
                            size="small"
                            sx={{
                              backgroundColor: getTraitColor(traitId),
                              color: '#fff',
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                    <Stack direction="row">
                      <Tooltip title={t('unavailability.title')}>
                        <IconButton
                          size="small"
                          onClick={() => setUnavailPlayer(player)}
                          color={isCurrentlyUnavailable(player.id) ? 'error' : 'default'}
                        >
                          <PersonOffIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setEditingPlayer(player);
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(player)}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <PlayerDialog
        open={dialogOpen}
        player={editingPlayer}
        traits={traits}
        onClose={() => {
          setDialogOpen(false);
          setEditingPlayer(null);
        }}
        onSave={handleSavePlayer}
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={async (players) => {
          for (const p of players) {
            await addPlayer(p);
          }
        }}
        traits={traits}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('roster.deletePlayer')}
        message={t('roster.deleteConfirm', { name: deleteTarget?.name })}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />

      <UnavailabilityDialog
        open={!!unavailPlayer}
        player={unavailPlayer}
        unavailabilities={unavailabilities}
        onClose={() => setUnavailPlayer(null)}
        onAdd={addUnavailability}
        onDelete={deleteUnavailability}
      />
    </Box>
  );
}
