import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import CardActions from '@mui/material/CardActions';
import Grid2 from '@mui/material/Grid2';
import Chip from '@mui/material/Chip';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CircularProgress from '@mui/material/CircularProgress';
import { useMatches } from '../hooks/useMatches';
import { useAllLineups, useLineup } from '../hooks/useLineup';
import ConfirmDialog from '../components/ConfirmDialog';
import type { Lineup, Match } from '../types';

export default function LineupsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { matches, loading: matchesLoading } = useMatches();
  const { lineups, loading: lineupsLoading } = useAllLineups();
  const [showPast, setShowPast] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<(Lineup & { match?: Match }) | null>(null);

  if (matchesLoading || lineupsLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const today = new Date().toISOString().split('T')[0];

  const lineupsWithMatch = lineups.map((lineup) => ({
    ...lineup,
    match: matches.find((m) => m.id === lineup.matchId),
  }));

  // Split into upcoming and past based on match date
  const upcomingLineups = lineupsWithMatch
    .filter((l) => !l.match || l.match.date >= today)
    .sort((a, b) => (a.match?.date || '').localeCompare(b.match?.date || '') || (a.match?.startTime || '').localeCompare(b.match?.startTime || ''));

  const pastLineups = lineupsWithMatch
    .filter((l) => l.match && l.match.date < today)
    .sort((a, b) => (b.match?.date || '').localeCompare(a.match?.date || '') || (b.match?.startTime || '').localeCompare(a.match?.startTime || ''));

  const renderLineupCard = (lineup: typeof lineupsWithMatch[number], isPast: boolean) => (
    <Grid2 size={{ xs: 12, sm: 6, md: 4 }} key={lineup.id}>
      <Card sx={{ opacity: isPast ? 0.5 : 1 }}>
        <CardActionArea onClick={() => navigate(`/lineup/id/${lineup.id}`)}>
          <CardContent>
            <Typography variant="h6">
              {lineup.name || `vs ${lineup.match?.opponent || 'Unknown'}`}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {lineup.match?.date} • {lineup.match?.startTime}–{lineup.match?.endTime}
            </Typography>
            <Box mt={1}>
              <Chip
                label={`${(lineup.playerIds || []).length} on pitch`}
                size="small"
                color="primary"
                sx={{ mr: 0.5 }}
              />
              <Chip
                label={`${(lineup.bench || []).length} on bench`}
                size="small"
                variant="outlined"
              />
              {lineup.shared && (
                <Chip label="Shared" size="small" color="secondary" sx={{ ml: 0.5 }} />
              )}
            </Box>
          </CardContent>
        </CardActionArea>
        {isPast && (
          <CardActions>
            <Box flexGrow={1} />
            <IconButton size="small" onClick={() => setDeleteTarget(lineup)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </CardActions>
        )}
      </Card>
    </Grid2>
  );

  return (
    <Box>
      <Typography variant="h4" mb={3}>
        {t('nav.lineups')}
      </Typography>

      {lineupsWithMatch.length === 0 ? (
        <Typography color="text.secondary" textAlign="center" mt={4}>
          No lineups created yet. Go to Matches and create a lineup for a match.
        </Typography>
      ) : (
        <>
          {upcomingLineups.length === 0 ? (
            <Typography color="text.secondary" mb={2}>
              {t('matches.noUpcoming')}
            </Typography>
          ) : (
            <Grid2 container spacing={2}>
              {upcomingLineups.map((lineup) => renderLineupCard(lineup, false))}
            </Grid2>
          )}

          {pastLineups.length > 0 && (
            <Box mt={4}>
              <Button
                onClick={() => setShowPast(!showPast)}
                startIcon={showPast ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                color="inherit"
                sx={{ mb: 1 }}
              >
                {t('matches.pastMatches')} ({pastLineups.length})
              </Button>
              <Collapse in={showPast}>
                <Grid2 container spacing={2}>
                  {pastLineups.map((lineup) => renderLineupCard(lineup, true))}
                </Grid2>
              </Collapse>
            </Box>
          )}
        </>
      )}

      <DeleteLineupDialog target={deleteTarget} onClose={() => setDeleteTarget(null)} />
    </Box>
  );
}

function DeleteLineupDialog({ target, onClose }: { target: (Lineup & { match?: Match }) | null; onClose: () => void }) {
  const { t } = useTranslation();
  const { lineup, deleteLineup } = useLineup(null, target?.id || null);

  const handleConfirm = async () => {
    if (lineup) {
      await deleteLineup();
    }
    onClose();
  };

  return (
    <ConfirmDialog
      open={!!target}
      title={t('common.delete')}
      message={`Delete lineup for "${target?.match?.opponent || 'Unknown'}"?`}
      onConfirm={handleConfirm}
      onCancel={onClose}
    />
  );
}
