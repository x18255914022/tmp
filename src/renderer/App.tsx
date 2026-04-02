import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import BatchDetail from './pages/BatchDetail';
import RerunNotes from './pages/RerunNotes';
import Settings from './pages/Settings';
import ExportBackup from './pages/ExportBackup';

type Route =
  | { page: 'dashboard' }
  | { page: 'projects' }
  | { page: 'project'; projectId: number }
  | { page: 'batch'; groupId: number; projectId: number }
  | { page: 'rerun' }
  | { page: 'settings' }
  | { page: 'export' };

export default function App() {
  const [route, setRoute] = useState<Route>({ page: 'dashboard' });
  const [dark, setDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

  const navigate = useCallback((r: Route) => setRoute(r), []);

  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar
        currentPage={route.page}
        onNavigate={navigate}
        dark={dark}
        onToggleDark={() => setDark(d => !d)}
      />
      <main className="flex-1 overflow-auto p-6">
        {route.page === 'dashboard' && <Dashboard key={refreshKey} onNavigate={navigate} />}
        {route.page === 'projects' && <Projects key={refreshKey} onNavigate={navigate} onRefresh={refresh} />}
        {route.page === 'project' && (
          <ProjectDetail
            key={`${route.projectId}-${refreshKey}`}
            projectId={route.projectId}
            onNavigate={navigate}
            onRefresh={refresh}
          />
        )}
        {route.page === 'batch' && (
          <BatchDetail
            key={`${route.groupId}-${refreshKey}`}
            groupId={route.groupId}
            projectId={route.projectId}
            onNavigate={navigate}
            onRefresh={refresh}
          />
        )}
        {route.page === 'rerun' && <RerunNotes key={refreshKey} onRefresh={refresh} />}
        {route.page === 'settings' && <Settings key={refreshKey} onRefresh={refresh} />}
        {route.page === 'export' && <ExportBackup key={refreshKey} onRefresh={refresh} />}
      </main>
    </div>
  );
}
