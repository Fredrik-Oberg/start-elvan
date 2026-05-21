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
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import CircularProgress from '@mui/material/CircularProgress';
import { usePlayers } from '../hooks/usePlayers';
import { useTraits } from '../hooks/useTraits';
import { useUnavailability } from '../hooks/useUnavailability';
import PlayerDialog from '../components/PlayerDialog';
import ImportDialog from '../components/ImportDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import UnavailabilityDialog from '../components/UnavailabilityDialog';
import TraitDialog from '../components/TraitDialog';
import type { Player, Trait } from '../types';

export default function MyTeamPage() {
  const { t } = useTranslation();
  const { players, loading, addPlayer, updatePlayer, deletePlayer } = usePlayers();
  const { traits, loading: traitsLoading, addTrait, updateTrait, deleteTrait } = useTraits();
  const { unavailabilities, addUnavailability, deleteUnavailability } = useUnavailability();

  const [tab, setTab] = useState(0);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Player | null>(null);
  const [unavailPlayer, setUnavailPlayer] = useState<Player | null>(null);

  // Trait tab state
  const [traitDialogOpen, setTraitDialogOpen] = useState(false);
  const [editingTrait, setEditingTrait] = useState<Trait | null>(null);
  const [deleteTraitTarget, setDeleteTraitTarget] = useState<Trait | null>(null);

  const isCurrentlyUnavailable = (playerId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return unavailabilities.some(
      (u) => u.playerId === playerId && u.startDate <= today && u.endDate >= today
    );
  };

  const filteredPlayers = players.filter(
    (p) => p.name.toLowerCase().includes(search.toLowerCase())
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

  const handleSaveTrait = async (data: Omit<Trait, 'id'>) => {
    if (editingTrait) {
      await updateTrait(editingTrait.id, data);
    } else {
      await addTrait(data);
    }
    setTraitDialogOpen(false);
    setEditingTrait(null);
  };

  const handleDeleteTraitConfirm = async () => {
    if (deleteTraitTarget) {
      await deleteTrait(deleteTraitTarget.id);
      setDeleteTraitTarget(null);
    }
  };

  const handleExportCSV = () => {
    const header = 'name,' + traits.map((t) => t.label).join(',');
    const rows = players.map((player) => {
      const traitCols = traits.map((t) => (player.traits.includes(t.id) ? 'x' : ''));
      return `${player.name},${traitCols.join(',')}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'players.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading || traitsLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" mb={2}>{t('nav.myTeam')}</Typography>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={t('roster.title')} />
        <Tab label={t('traits.title')} />
      </Tabs>

      {tab === 0 && (
        <Box>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <TextField
              placeholder={t('roster.search')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              size="small"
              sx={{ minWidth: 200 }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<FileDownloadIcon />}
                onClick={handleExportCSV}
                disabled={players.length === 0}
              >
                {t('roster.exportPlayers')}
              </Button>
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
                            {player.name}
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
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Box display="flex" justifyContent="flex-end" mb={2}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingTrait(null);
                setTraitDialogOpen(true);
              }}
            >
              {t('traits.addTrait')}
            </Button>
          </Box>

          {traits.length === 0 ? (
            <Typography color="text.secondary" textAlign="center" mt={4}>
              {t('traits.noTraits')}
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {traits.map((trait) => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={trait.id}>
                  <Card>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Chip
                          label={trait.label}
                          sx={{
                            backgroundColor: trait.color,
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '1rem',
                          }}
                        />
                        <Stack direction="row">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingTrait(trait);
                              setTraitDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => setDeleteTraitTarget(trait)}
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
        </Box>
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
        onCreateTrait={addTrait}
      />

      <ImportDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImport={async (importedPlayers) => {
          for (const p of importedPlayers) {
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

      <TraitDialog
        open={traitDialogOpen}
        trait={editingTrait}
        onClose={() => {
          setTraitDialogOpen(false);
          setEditingTrait(null);
        }}
        onSave={handleSaveTrait}
      />

      <ConfirmDialog
        open={!!deleteTraitTarget}
        title={t('traits.deleteTrait')}
        message={`Delete trait "${deleteTraitTarget?.label}"?`}
        onConfirm={handleDeleteTraitConfirm}
        onCancel={() => setDeleteTraitTarget(null)}
      />
    </Box>
  );
}
