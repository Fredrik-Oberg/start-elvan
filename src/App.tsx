import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import './i18n';
import { TeamContext, getOrCreateTeamId } from './hooks/useTeam';
import Layout from './components/Layout';
import MyTeamPage from './pages/MyTeamPage';
import MatchesPage from './pages/MatchesPage';
import LineupPage from './pages/LineupPage';
import LineupsListPage from './pages/LineupsListPage';

const teamId = getOrCreateTeamId();

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TeamContext.Provider value={{ teamId }}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<MyTeamPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/lineups" element={<LineupsListPage />} />
              <Route path="/lineup/:matchId" element={<LineupPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TeamContext.Provider>
    </ThemeProvider>
  );
}
