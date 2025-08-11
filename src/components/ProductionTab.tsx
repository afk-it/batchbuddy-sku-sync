import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Package, Calendar } from 'lucide-react';

interface SKU {
  id: string;
  code: string;
  name: string;
}

const ProductionTab = () => {
  const [skus, setSKUs] = useState<SKU[]>([]);
  const [selectedSKU, setSelectedSKU] = useState('');
  const [quantity, setQuantity] = useState('');
  const [loading, setLoading] = useState(false);
  const [totalPieces, setTotalPieces] = useState(0);
  const [todayPieces, setTodayPieces] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchSKUs();
    fetchStats();
  }, []);

  const fetchSKUs = async () => {
    const { data, error } = await supabase
      .from('skus')
      .select('id, code, name')
      .order('name');

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

  const fetchStats = async () => {
    // Total pieces
    const { data: totalData } = await supabase
      .from('batches')
      .select('quantity');
    
    const total = totalData?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
    setTotalPieces(total);

    // Today's pieces
    const today = new Date().toISOString().split('T')[0];
    const { data: todayData } = await supabase
      .from('batches')
      .select('quantity')
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);
    
    const todayTotal = todayData?.reduce((sum, batch) => sum + batch.quantity, 0) || 0;
    setTodayPieces(todayTotal);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSKU || !quantity) return;

    setLoading(true);
    
    try {
      // Generate batch number
      const { data: batchNumber } = await supabase
        .rpc('generate_batch_number', { _sku_id: selectedSKU });

      // Create batch
      const { error } = await supabase
        .from('batches')
        .insert({
          sku_id: selectedSKU,
          batch_number: batchNumber,
          quantity: parseInt(quantity),
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Batch ${batchNumber} created successfully!`,
      });

      setQuantity('');
      setSelectedSKU('');
      fetchStats();
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

  return (
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Total Pieces</CardTitle>
            <Package className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg font-bold">{totalPieces.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">Today's Pieces</CardTitle>
            <Calendar className="h-3 w-3 text-muted-foreground" />
          </CardHeader>
          <CardContent className="pt-2">
            <div className="text-lg font-bold">{todayPieces.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Create New Batch</CardTitle>
          <CardDescription className="text-sm">
            Select a SKU and enter the quantity to create a new batch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sku" className="text-sm font-medium">SKU</Label>
              <Select value={selectedSKU} onValueChange={setSelectedSKU}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select a SKU" />
                </SelectTrigger>
                <SelectContent>
                  {skus.map((sku) => (
                    <SelectItem key={sku.id} value={sku.id}>
                      {sku.code} - {sku.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
                min="1"
                required
                className="h-12 text-base"
              />
            </div>
            
            <Button 
              type="submit" 
              disabled={loading || !selectedSKU || !quantity}
              className="w-full h-12 text-base font-medium"
            >
              {loading ? 'Creating...' : 'Create Batch'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionTab;