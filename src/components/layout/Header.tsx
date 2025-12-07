import { Bell, Search, Settings, Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCRMStore } from '@/store/crmStore';
import { Badge } from '@/components/ui/badge';

export function Header() {
  const { currentUser } = useCRMStore();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-6 bg-card/80 backdrop-blur-md border-b border-border">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()}</p>
          <h1 className="text-lg font-heading font-semibold text-foreground">
            {currentUser?.name}
          </h1>
        </div>
      </div>

      {/* Center - Search */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-8">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search leads, customers, tasks..."
            className="pl-10 bg-secondary/50 border-transparent focus:border-primary focus:bg-background"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full animate-pulse" />
        </Button>

        {/* Settings */}
        <Button variant="ghost" size="icon">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </Button>

        {/* Role Badge */}
        {currentUser && (
          <Badge variant="secondary" className="ml-2 hidden sm:flex">
            {currentUser.role}
          </Badge>
        )}
      </div>
    </header>
  );
}
