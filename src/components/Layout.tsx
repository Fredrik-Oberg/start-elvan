import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import GroupIcon from '@mui/icons-material/Group';
import SportsSoccerIcon from '@mui/icons-material/SportsSoccer';
import ViewListIcon from '@mui/icons-material/ViewList';
import LanguageIcon from '@mui/icons-material/Language';
import ShareIcon from '@mui/icons-material/Share';
import PeopleIcon from '@mui/icons-material/People';
import { getShareUrl } from '../hooks/useTeam';
import { usePresence } from '../hooks/usePresence';

const DRAWER_WIDTH = 240;

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langAnchor, setLangAnchor] = useState<null | HTMLElement>(null);
  const [shareSnackOpen, setShareSnackOpen] = useState(false);
  const { activeUsers } = usePresence();

  const handleShareTeam = async () => {
    const url = getShareUrl();
    await navigator.clipboard.writeText(url);
    setShareSnackOpen(true);
  };

  const navItems = [
    { label: t('nav.myTeam'), path: '/', icon: <GroupIcon /> },
    { label: t('nav.matches'), path: '/matches', icon: <SportsSoccerIcon /> },
    { label: t('nav.lineups'), path: '/lineups', icon: <ViewListIcon /> },
  ];

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('start-elvan-lang', lang);
    setLangAnchor(null);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <SportsSoccerIcon sx={{ mr: 1 }} />
        <Typography variant="h6" noWrap>
          {t('app.title')}
        </Typography>
      </Toolbar>
      <List>
        {navItems.map((item) => (
          <ListItemButton
            key={item.path}
            selected={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            {t('app.title')} — {t('app.subtitle')}
          </Typography>
          {activeUsers > 1 && (
            <Tooltip title={t('share.activeUsers', { count: activeUsers })}>
              <Box sx={{ display: 'flex', alignItems: 'center', mr: 1, color: 'inherit' }}>
                <PeopleIcon fontSize="small" sx={{ mr: 0.5 }} />
                <Typography variant="body2">{activeUsers}</Typography>
              </Box>
            </Tooltip>
          )}
          <Tooltip title={t('share.team')}>
            <IconButton color="inherit" onClick={handleShareTeam}>
              <ShareIcon />
            </IconButton>
          </Tooltip>
          <IconButton color="inherit" onClick={(e) => setLangAnchor(e.currentTarget)}>
            <LanguageIcon />
          </IconButton>
          <Menu
            anchorEl={langAnchor}
            open={Boolean(langAnchor)}
            onClose={() => setLangAnchor(null)}
          >
            <MenuItem
              selected={i18n.language === 'en'}
              onClick={() => handleLanguageChange('en')}
            >
              English
            </MenuItem>
            <MenuItem
              selected={i18n.language === 'sv'}
              onClick={() => handleLanguageChange('sv')}
            >
              Svenska
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Mobile drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        {drawer}
      </Drawer>

      {/* Desktop drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
        }}
        open
      >
        {drawer}
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: 8,
          ml: { md: `${DRAWER_WIDTH}px` },
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        {children}
      </Box>

      <Snackbar
        open={shareSnackOpen}
        autoHideDuration={3000}
        onClose={() => setShareSnackOpen(false)}
      >
        <Alert severity="success" onClose={() => setShareSnackOpen(false)}>
          {t('share.linkCopied')}
        </Alert>
      </Snackbar>
    </Box>
  );
}
