import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2 } from 'lucide-react';

interface SKU {
  id: string;
  code: string;
  name: string;
  created_at: string;
}

const SKUTab = () => {
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  useEffect(() => {
    fetchSKUs();
  }, []);

  const fetchSKUs = async () => {
    const { data, error } = await supabase
      .from('skus')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch SKUs",
        variant: "destructive",
      });
    } else {
      setSKUs(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;

    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('skus')
        .insert({
          code: code.trim(),
          name: name.trim(),
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "SKU created successfully!",
      });

      setCode('');
      setName('');
      fetchSKUs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isAdmin) return;
    
    try {
      const { error } = await supabase
        .from('skus')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "SKU deleted successfully!",
      });

      fetchSKUs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* SKU Form */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Add New SKU</CardTitle>
            <CardDescription>
              Create a new SKU with a unique code and name
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">SKU Code</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Enter SKU code"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="name">SKU Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter SKU name"
                    required
                  />
                </div>
              </div>
              
              <Button type="submit" disabled={loading || !code || !name}>
                {loading ? 'Creating...' : 'Create SKU'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* SKUs List */}
      <Card>
        <CardHeader>
          <CardTitle>SKUs List</CardTitle>
          <CardDescription>
            All available SKUs in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Created</TableHead>
                {isAdmin && <TableHead className="w-[100px]">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {skus.map((sku) => (
                <TableRow key={sku.id}>
                  <TableCell className="font-medium">{sku.code}</TableCell>
                  <TableCell>{sku.name}</TableCell>
                  <TableCell>{new Date(sku.created_at).toLocaleDateString()}</TableCell>
                  {isAdmin && (
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(sku.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SKUTab;