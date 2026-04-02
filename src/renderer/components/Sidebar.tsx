import { LayoutDashboard, FolderOpen, RefreshCw, Settings, Download, Sun, Moon } from 'lucide-react';

interface Props {
  currentPage: string;
  onNavigate: (route: any) => void;
  dark: boolean;
  onToggleDark: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'Панель', icon: LayoutDashboard, route: { page: 'dashboard' } },
  { id: 'projects', label: 'Проекты', icon: FolderOpen, route: { page: 'projects' } },
  { id: 'rerun', label: 'Повторы ПЦР', icon: RefreshCw, route: { page: 'rerun' } },
  { id: 'settings', label: 'Настройки', icon: Settings, route: { page: 'settings' } },
  { id: 'export', label: 'Экспорт / Бэкап', icon: Download, route: { page: 'export' } },
];

export default function Sidebar({ currentPage, onNavigate, dark, onToggleDark }: Props) {
  return (
    <aside className="w-56 flex-shrink-0 bg-sidebar border-r border-sidebar-border flex flex-col h-screen">
      {/* Header */}
      <div className="px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold text-sidebar-foreground">🧬</span>
          <div>
            <h1 className="text-sm font-semibold text-sidebar-foreground leading-tight">Salmon Tracker</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">выборка × локус</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        {menuItems.map(item => {
          const active = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors
                ${active
                  ? 'bg-sidebar-active text-primary font-medium'
                  : 'text-sidebar-foreground hover:bg-sidebar-active/50'
                }`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Theme toggle */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <button
          onClick={onToggleDark}
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {dark ? <Sun size={14} /> : <Moon size={14} />}
          <span>{dark ? 'Светлая тема' : 'Тёмная тема'}</span>
        </button>
      </div>
    </aside>
  );
}
