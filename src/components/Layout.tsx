import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Download } from 'lucide-react';
import ProductionTab from '@/components/ProductionTab';
import SKUTab from '@/components/SKUTab';
import HistoryTab from '@/components/HistoryTab';
import AdminTab from '@/components/AdminTab';
import { useToast } from '@/hooks/use-toast';

const Layout = () => {
  const { user, signOut, isAdmin } = useAuth();
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // PWA install functionality
  useState(() => {
    // Check if device is iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);
    
    // Check if already in standalone mode
    const standalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsStandalone(standalone);

    // Android/Desktop PWA install
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  });

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast({
          title: "App Installed",
          description: "SKU Manager has been installed on your device!",
        });
      }
      setDeferredPrompt(null);
    } else if (isIOS && !isStandalone) {
      // Show iOS install instructions
      toast({
        title: "Install App",
        description: "Tap the Share button and select 'Add to Home Screen'",
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-50">
        <div className="container mx-auto px-3 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-foreground">SKU Manager</h1>
            {isAdmin && (
              <Badge variant="secondary" className="text-xs">Admin</Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {(deferredPrompt || (isIOS && !isStandalone)) && (
              <Button variant="outline" size="sm" onClick={handleInstall} className="text-xs px-2">
                <Download className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Install</span>
              </Button>
            )}
            <span className="text-xs text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut} className="text-xs px-2">
              <LogOut className="h-3 w-3 sm:mr-1" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 py-4">
        <Tabs defaultValue="production" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="production" className="text-xs">Production</TabsTrigger>
            <TabsTrigger value="skus" className="text-xs">SKUs</TabsTrigger>
            <TabsTrigger value="history" className="text-xs">History</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin" className="text-xs">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="production" className="space-y-6">
            <ProductionTab />
          </TabsContent>

          <TabsContent value="skus" className="space-y-6">
            <SKUTab />
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <HistoryTab />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              <AdminTab />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Layout;