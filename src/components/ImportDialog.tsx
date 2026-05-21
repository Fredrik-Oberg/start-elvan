import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Box from '@mui/material/Box';
import type { Player, Trait } from '../types';

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (players: Omit<Player, 'id' | 'createdAt' | 'version'>[]) => Promise<void>;
  traits: Trait[];
}

interface ParsedPlayer {
  name: string;
  traits: string[];
}

export default function ImportDialog({ open, onClose, onImport, traits }: ImportDialogProps) {
  const { t } = useTranslation();
  const [parsed, setParsed] = useState<ParsedPlayer[]>([]);
  const [error, setError] = useState('');
  const [importing, setImporting] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const content = ev.target?.result as string;
        if (file.name.endsWith('.json')) {
          parseJSON(content);
        } else if (file.name.endsWith('.csv')) {
          parseCSV(content);
        } else {
          setError('Unsupported file format');
        }
      } catch (err) {
        setError((err as Error).message);
      }
    };
    reader.readAsText(file);
  };

  const parseJSON = (content: string) => {
    const data = JSON.parse(content);
    if (!Array.isArray(data)) throw new Error('JSON must be an array');
    const players: ParsedPlayer[] = data.map((item) => ({
      name: String(item.name || ''),
      traits: resolveTraits(item.traits || []),
    }));
    setParsed(players);
  };

  const parseCSV = (content: string) => {
    const lines = content.trim().split('\n');
    const players: ParsedPlayer[] = lines
      .filter((line) => line.trim())
      .map((line) => {
        const parts = line.split(',').map((s) => s.trim());
        return {
          name: parts[0] || '',
          traits: resolveTraits(parts.slice(1)),
        };
      });
    setParsed(players);
  };

  const resolveTraits = (traitLabels: string[]): string[] => {
    return traitLabels
      .map((label) => {
        const found = traits.find(
          (t) => t.label.toLowerCase() === label.toLowerCase()
        );
        return found?.id || '';
      })
      .filter(Boolean);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      await onImport(parsed);
      setParsed([]);
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setParsed([]);
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('import.title')}</DialogTitle>
      <DialogContent>
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {t('import.supportedFormats')}
          </Typography>
          <Typography variant="caption" display="block">
            {t('import.csvFormat')}
          </Typography>
          <Typography variant="caption" display="block">
            {t('import.jsonFormat')}
          </Typography>
        </Box>

        <Button variant="outlined" component="label">
          {t('import.selectFile')}
          <input type="file" hidden accept=".csv,.json" onChange={handleFileSelect} />
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {parsed.length > 0 && (
          <Box mt={2}>
            <Typography variant="subtitle2" gutterBottom>
              {t('import.preview')} ({parsed.length} players)
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('roster.name')}</TableCell>
                  <TableCell>{t('roster.traits')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {parsed.slice(0, 20).map((p, i) => (
                  <TableRow key={i}>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>{p.traits.length} traits</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>{t('common.cancel')}</Button>
        <Button
          onClick={handleImport}
          variant="contained"
          disabled={parsed.length === 0 || importing}
        >
          {importing ? t('import.importing') : `Import ${parsed.length} players`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
