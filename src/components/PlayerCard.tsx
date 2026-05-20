import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import type { Player, Trait } from '../types';

interface PlayerCardProps {
  player: Player;
  traits: Trait[];
}

export default function PlayerCard({ player, traits }: PlayerCardProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        '&:hover': { elevation: 4, backgroundColor: 'action.hover' },
      }}
    >
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          backgroundColor: 'primary.main',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 'bold',
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        {player.number}
      </Box>
      <Box overflow="hidden">
        <Typography variant="body2" fontWeight="bold" noWrap>
          {player.name}
        </Typography>
        <Box display="flex" gap={0.25} flexWrap="wrap">
          {player.traits.slice(0, 2).map((traitId) => {
            const trait = traits.find((t) => t.id === traitId);
            return trait ? (
              <Chip
                key={traitId}
                label={trait.label}
                size="small"
                sx={{
                  height: 18,
                  fontSize: 10,
                  backgroundColor: trait.color,
                  color: '#fff',
                }}
              />
            ) : null;
          })}
        </Box>
      </Box>
    </Paper>
  );
}
