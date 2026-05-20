import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { useMatches } from '../hooks/useMatches';
import { useAllLineups } from '../hooks/useLineup';

export default function LineupsListPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { matches, loading: matchesLoading } = useMatches();
  const { lineups, loading: lineupsLoading } = useAllLineups();

  if (matchesLoading || lineupsLoading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  const lineupsWithMatch = lineups.map((lineup) => ({
    ...lineup,
    match: matches.find((m) => m.id === lineup.matchId),
  }));

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
        <Grid container spacing={2}>
          {lineupsWithMatch.map((lineup) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={lineup.id}>
              <Card>
                <CardActionArea onClick={() => navigate(`/lineup/${lineup.matchId}`)}>
                  <CardContent>
                    <Typography variant="h6">
                      vs {lineup.match?.opponent || 'Unknown'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {lineup.match?.date} • {lineup.match?.startTime}–{lineup.match?.endTime}
                    </Typography>
                    <Box mt={1}>
                      <Chip
                        label={`${lineup.players.length} on pitch`}
                        size="small"
                        color="primary"
                        sx={{ mr: 0.5 }}
                      />
                      <Chip
                        label={`${lineup.bench.length} on bench`}
                        size="small"
                        variant="outlined"
                      />
                      {lineup.shared && (
                        <Chip label="Shared" size="small" color="secondary" sx={{ ml: 0.5 }} />
                      )}
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
