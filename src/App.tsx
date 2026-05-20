import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import './i18n';
import { TeamContext, getOrCreateTeamId } from './hooks/useTeam';
import Layout from './components/Layout';
import RosterPage from './pages/RosterPage';
import MatchesPage from './pages/MatchesPage';
import LineupPage from './pages/LineupPage';
import LineupsListPage from './pages/LineupsListPage';
import TraitsPage from './pages/TraitsPage';

const teamId = getOrCreateTeamId();

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <TeamContext.Provider value={{ teamId }}>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<RosterPage />} />
              <Route path="/matches" element={<MatchesPage />} />
              <Route path="/lineups" element={<LineupsListPage />} />
              <Route path="/lineup/:matchId" element={<LineupPage />} />
              <Route path="/traits" element={<TraitsPage />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </TeamContext.Provider>
    </ThemeProvider>
  );
}
