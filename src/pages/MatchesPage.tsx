import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Grid2 from '@mui/material/Grid2';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CircularProgress from '@mui/material/CircularProgress';
import { useMatches } from '../hooks/useMatches';
import { useLineup } from '../hooks/useLineup';
import MatchDialog from '../components/MatchDialog';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Match } from '../types';

export default function MatchesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { matches, loading, addMatch, updateMatch, deleteMatch } = useMatches();
  const { createLineup } = useLineup(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Match | null>(null);
  const [showPast, setShowPast] = useState(false);

  const handleSave = async (data: Omit<Match, 'id' | 'createdAt' | 'version'>) => {
    if (editingMatch) {
      await updateMatch(editingMatch.id, data);
    } else {
      await addMatch(data);
    }
    setDialogOpen(false);
    setEditingMatch(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      await deleteMatch(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  const handleCreateLineup = async (matchId: string) => {
    await createLineup(matchId);
    navigate(`/lineup/${matchId}`);
  };

  const today = new Date().toISOString().split('T')[0];

  // Split into upcoming and past, sort upcoming by nearest first
  const upcomingMatches = matches
    .filter((m) => m.date >= today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const pastMatches = matches
    .filter((m) => m.date < today)
    .sort((a, b) => b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime));

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const renderMatchCard = (match: Match, isPast: boolean) => (
    <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={match.id}>
      <Card sx={{ opacity: isPast ? 0.5 : 1 }}>
        <CardContent>
          <Typography variant="h6">{match.opponent}</Typography>
          <Stack direction="row" spacing={1} mt={1}>
            <Chip
              label={`${match.startTime} - ${match.endTime}`}
              size="small"
              variant="outlined"
            />
            {match.location && (
              <Chip label={match.location} size="small" variant="outlined" />
            )}
          </Stack>
        </CardContent>
        <CardActions>
          <Button
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={() => handleCreateLineup(match.id)}
          >
            {t('matches.createLineup')}
          </Button>
          <Box flexGrow={1} />
          <IconButton
            size="small"
            onClick={() => {
              setEditingMatch(match);
              setDialogOpen(true);
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => setDeleteTarget(match)}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </CardActions>
      </Card>
    </Grid2>
  );

  // Group matches by date
  const groupByDate = (matchList: Match[]) =>
    matchList.reduce<Record<string, Match[]>>((acc, match) => {
      if (!acc[match.date]) acc[match.date] = [];
      acc[match.date].push(match);
      return acc;
    }, {});

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('matches.title')}</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingMatch(null);
            setDialogOpen(true);
          }}
        >
          {t('matches.addMatch')}
        </Button>
      </Box>

      {matches.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          {t('matches.noMatches')}
        </Typography>
      ) : (
        <>
          {/* Upcoming matches */}
          {upcomingMatches.length === 0 ? (
            <Typography color="text.secondary" mb={2}>
              {t('matches.noUpcoming')}
            </Typography>
          ) : (
            Object.entries(groupByDate(upcomingMatches)).map(([date, dateMatches]) => (
              <Box key={date} mb={3}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {date}
                </Typography>
                <Grid2 container spacing={2}>
                  {dateMatches.map((match) => renderMatchCard(match, false))}
                </Grid2>
              </Box>
            ))
          )}

          {/* Past matches - collapsible */}
          {pastMatches.length > 0 && (
            <Box mt={4}>
              <Button
                onClick={() => setShowPast(!showPast)}
                startIcon={showPast ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                color="inherit"
                sx={{ mb: 1 }}
              >
                {t('matches.pastMatches')} ({pastMatches.length})
              </Button>
              <Collapse in={showPast}>
                {Object.entries(groupByDate(pastMatches)).map(([date, dateMatches]) => (
                  <Box key={date} mb={3}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      {date}
                    </Typography>
                    <Grid2 container spacing={2}>
                      {dateMatches.map((match) => renderMatchCard(match, true))}
                    </Grid2>
                  </Box>
                ))}
              </Collapse>
            </Box>
          )}
        </>
      )}

      <MatchDialog
        open={dialogOpen}
        match={editingMatch}
        onClose={() => {
          setDialogOpen(false);
          setEditingMatch(null);
        }}
        onSave={handleSave}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('matches.deleteMatch')}
        message={t('matches.deleteConfirm', { opponent: deleteTarget?.opponent })}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
