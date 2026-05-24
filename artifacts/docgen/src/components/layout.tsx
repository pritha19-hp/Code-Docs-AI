import { Link, useLocation } from "wouter";
import { Terminal, LayoutDashboard, Sparkles, History, Github, FileCode, BookOpen } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/generate", label: "Generate", icon: Sparkles },
    { href: "/history", label: "History", icon: History },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col hidden md:flex">
        <div className="h-14 flex items-center px-6 border-b border-border">
          <Terminal className="w-5 h-5 mr-2 text-primary" />
          <span className="font-bold text-lg tracking-tight">DocuAI</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Menu</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm font-medium ${
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border">
          <div className="bg-card border border-border rounded-lg p-4 flex flex-col items-center justify-center text-center">
             <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-3">
               <BookOpen className="w-5 h-5 text-primary" />
             </div>
             <p className="text-xs text-muted-foreground">DocuAI Pro</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <header className="h-14 border-b border-border bg-background flex items-center px-4 md:hidden shrink-0">
          <Terminal className="w-5 h-5 mr-2 text-primary" />
          <span className="font-bold">DocuAI</span>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <div className="max-w-6xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
