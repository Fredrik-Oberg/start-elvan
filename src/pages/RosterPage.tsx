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
  const { traits, addTrait } = useTraits();
  const { unavailabilities, addUnavailability, updateUnavailability, deleteUnavailability } = useUnavailability();
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
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getTraitLabel = (traitId: string) => {
    const trait = traits.find((t) => t.id === traitId);
    return trait?.label || traitId;
  };

  const getTraitColor = (traitId: string) => {
    const trait = traits.find((t) => t.id === traitId);
    return trait?.color || '#999';
  };

  const handleSavePlayer = async (data: Omit<Player, 'id' | 'createdAt' | 'version'>) => {
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>{t('roster.title')}</Typography>
        <Stack direction="row" spacing={0.5}>
          <IconButton
            color="primary"
            onClick={() => setImportOpen(true)}
            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
          >
            <FileUploadIcon />
          </IconButton>
          <IconButton
            color="primary"
            onClick={() => {
              setEditingPlayer(null);
              setDialogOpen(true);
            }}
            sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
          >
            <AddIcon />
          </IconButton>
          <Button
            variant="outlined"
            size="small"
            startIcon={<FileUploadIcon />}
            onClick={() => setImportOpen(true)}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
          >
            {t('roster.importPlayers')}
          </Button>
          <Button
            variant="contained"
            size="small"
            startIcon={<AddIcon />}
            onClick={() => {
              setEditingPlayer(null);
              setDialogOpen(true);
            }}
            sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
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
        sx={{ mb: 2 }}
        size="small"
      />

      {filteredPlayers.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          {t('roster.noPlayers')}
        </Typography>
      ) : (
        <Stack spacing={1}>
          {filteredPlayers.map((player) => (
            <Card key={player.id} sx={{ opacity: isCurrentlyUnavailable(player.id) ? 0.7 : 1 }}>
              <CardContent sx={{ py: 1, px: 1.5, '&:last-child': { pb: 1 } }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box flex={1} minWidth={0}>
                    <Box display="flex" alignItems="center" gap={0.5} flexWrap="wrap">
                      <Typography variant="body1" fontWeight="bold" noWrap>
                        {player.name}
                      </Typography>
                      {isCurrentlyUnavailable(player.id) && (
                        <Chip
                          label={t('unavailability.reasons.' + (unavailabilities.find(u => u.playerId === player.id && u.startDate <= new Date().toISOString().split('T')[0] && u.endDate >= new Date().toISOString().split('T')[0])?.reason || 'other'))}
                          size="small"
                          color="error"
                          sx={{ height: 20, fontSize: '0.7rem' }}
                        />
                      )}
                    </Box>
                    <Stack direction="row" spacing={0.5} mt={0.5} flexWrap="wrap" useFlexGap>
                      {player.traits.map((traitId) => (
                        <Chip
                          key={traitId}
                          label={getTraitLabel(traitId)}
                          size="small"
                          sx={{
                            height: 20,
                            fontSize: '0.65rem',
                            backgroundColor: getTraitColor(traitId),
                            color: '#fff',
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                  <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      onClick={() => setUnavailPlayer(player)}
                      color={isCurrentlyUnavailable(player.id) ? 'error' : 'default'}
                      sx={{ p: 0.5 }}
                    >
                      <PersonOffIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingPlayer(player);
                        setDialogOpen(true);
                      }}
                      sx={{ p: 0.5 }}
                    >
                      <EditIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => setDeleteTarget(player)}
                      sx={{ p: 0.5 }}
                    >
                      <DeleteIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
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
        onCreateTrait={addTrait}
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
        onEdit={updateUnavailability}
        onDelete={deleteUnavailability}
      />
    </Box>
  );
}
