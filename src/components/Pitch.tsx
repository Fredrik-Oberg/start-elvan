import { useCallback, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import type { LineupPlayer, Player, Trait } from '../types';

interface PitchProps {
  players: LineupPlayer[];
  allPlayers: Player[];
  traits: Trait[];
  onDrop: (playerId: string, x: number, y: number) => void;
  onRemove: (playerId: string) => void;
}

export default function Pitch({ players, allPlayers, traits, onDrop, onRemove }: PitchProps) {
  const pitchRef = useRef<HTMLDivElement>(null);
  const { setNodeRef, isOver } = useDroppable({ id: 'pitch' });

  const handlePitchClick = useCallback(
    (_e: React.MouseEvent) => {
      // Only handle if we have the pitch element
      if (!pitchRef.current) return;
    },
    []
  );

  // Handle repositioning players already on pitch via mouse
  const handlePlayerDrag = useCallback(
    (playerId: string, e: React.MouseEvent) => {
      e.preventDefault();
      if (!pitchRef.current) return;

      const pitchRect = pitchRef.current.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const player = players.find((p) => p.playerId === playerId);
      if (!player) return;

      const handleMove = (moveE: MouseEvent) => {
        const deltaX = ((moveE.clientX - startX) / pitchRect.width) * 100;
        const deltaY = ((moveE.clientY - startY) / pitchRect.height) * 100;
        const newX = Math.max(5, Math.min(95, player.x + deltaX));
        const newY = Math.max(5, Math.min(95, player.y + deltaY));
        onDrop(playerId, newX, newY);
      };

      const handleUp = () => {
        document.removeEventListener('mousemove', handleMove);
        document.removeEventListener('mouseup', handleUp);
      };

      document.addEventListener('mousemove', handleMove);
      document.addEventListener('mouseup', handleUp);
    },
    [players, onDrop]
  );

  return (
    <Box
      ref={(node: HTMLDivElement | null) => {
        pitchRef.current = node;
        setNodeRef(node);
      }}
      id="pitch-drop-zone"
      onClick={handlePitchClick}
      sx={{
        position: 'relative',
        width: '100%',
        paddingTop: '66.67%', // 3:2 aspect ratio
        backgroundColor: '#2e7d32',
        borderRadius: 2,
        border: isOver ? '3px dashed #fff' : '3px solid #1b5e20',
        overflow: 'hidden',
        cursor: 'crosshair',
        transition: 'border-color 0.2s',
      }}
    >
      {/* Pitch markings */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Center line */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: 'rgba(255,255,255,0.4)',
          }}
        />
        {/* Center circle */}
        <Box
          sx={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 120,
            height: 120,
            transform: 'translate(-50%, -50%)',
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        />
        {/* Left penalty area */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            top: '20%',
            width: '16%',
            height: '60%',
            border: '2px solid rgba(255,255,255,0.4)',
            borderLeft: 'none',
          }}
        />
        {/* Right penalty area */}
        <Box
          sx={{
            position: 'absolute',
            right: 0,
            top: '20%',
            width: '16%',
            height: '60%',
            border: '2px solid rgba(255,255,255,0.4)',
            borderRight: 'none',
          }}
        />
        {/* Outer border */}
        <Box
          sx={{
            position: 'absolute',
            inset: '3%',
            border: '2px solid rgba(255,255,255,0.4)',
          }}
        />
      </Box>

      {/* Players on pitch */}
      {players.map((lp) => {
        const player = allPlayers.find((p) => p.id === lp.playerId);
        if (!player) return null;
        const primaryTrait = player.traits[0];
        const traitColor = traits.find((t) => t.id === primaryTrait)?.color || '#1565c0';

        return (
          <Box
            key={lp.playerId}
            onMouseDown={(e) => handlePlayerDrag(lp.playerId, e)}
            sx={{
              position: 'absolute',
              left: `${lp.x}%`,
              top: `${lp.y}%`,
              transform: 'translate(-50%, -50%)',
              cursor: 'grab',
              userSelect: 'none',
              zIndex: 10,
              '&:active': { cursor: 'grabbing' },
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: traitColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: '2px solid #fff',
                position: 'relative',
              }}
            >
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(lp.playerId);
                }}
                sx={{
                  position: 'absolute',
                  top: -8,
                  right: -8,
                  width: 18,
                  height: 18,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  '&:hover': { backgroundColor: 'rgba(200,0,0,0.8)' },
                }}
              >
                <CloseIcon sx={{ fontSize: 12 }} />
              </IconButton>
            </Box>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                color: '#fff',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                fontWeight: 'bold',
                mt: 0.25,
                whiteSpace: 'nowrap',
              }}
            >
              {player.name}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
