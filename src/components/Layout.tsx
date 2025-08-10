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

  // PWA install functionality
  useState(() => {
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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">SKU Manager</h1>
            {isAdmin && (
              <Badge variant="secondary">Admin</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {deferredPrompt && (
              <Button variant="outline" size="sm" onClick={handleInstall}>
                <Download className="h-4 w-4 mr-2" />
                Install App
              </Button>
            )}
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="production" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="skus">SKUs</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            {isAdmin && <TabsTrigger value="admin">Admin</TabsTrigger>}
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