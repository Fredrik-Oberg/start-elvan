import { useDraggable } from '@dnd-kit/core';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import WarningIcon from '@mui/icons-material/Warning';
import PlayerCard from './PlayerCard';
import type { Player, Trait } from '../types';

interface DraggablePlayerProps {
  player: Player;
  traits: Trait[];
  disabled?: boolean;
  conflictMessage?: string;
  selected?: boolean;
  onSelect?: () => void;
}

export default function DraggablePlayer({
  player,
  traits,
  disabled,
  conflictMessage,
  selected,
  onSelect,
}: DraggablePlayerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: player.id,
    disabled,
  });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={!disabled ? onSelect : undefined}
      sx={{
        opacity: isDragging ? 0.5 : disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'grab',
        position: 'relative',
        borderRadius: 1,
        outline: selected ? '2px solid #ffeb3b' : 'none',
        outlineOffset: 2,
      }}
    >
      {disabled && conflictMessage && (
        <Tooltip title={conflictMessage} placement="top">
          <WarningIcon
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              zIndex: 1,
              color: 'warning.main',
              fontSize: 18,
            }}
          />
        </Tooltip>
      )}
      <PlayerCard player={player} traits={traits} />
    </Box>
  );
}
