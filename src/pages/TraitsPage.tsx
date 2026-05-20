import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CircularProgress from '@mui/material/CircularProgress';
import { useTraits } from '../hooks/useTraits';
import TraitDialog from '../components/TraitDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Trait } from '../types';

export default function TraitsPage() {
  const { t } = useTranslation();
  const { traits, loading, addTrait, updateTrait, deleteTrait } = useTraits();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTrait, setEditingTrait] = useState<Trait | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Trait | null>(null);

  const handleSave = async (data: Omit<Trait, 'id'>) => {
    if (editingTrait) {
      await updateTrait(editingTrait.id, data);
    } else {
      await addTrait(data);
    }
    setDialogOpen(false);
    setEditingTrait(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteTrait(deleteTarget.id);
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
        <Typography variant="h4">{t('traits.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingTrait(null);
            setDialogOpen(true);
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
                          setDialogOpen(true);
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setDeleteTarget(trait)}
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

      <TraitDialog
        open={dialogOpen}
        trait={editingTrait}
        onClose={() => {
          setDialogOpen(false);
          setEditingTrait(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('traits.deleteTrait')}
        message={`Delete trait "${deleteTarget?.label}"?`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
