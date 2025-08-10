import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search } from 'lucide-react';

interface BatchHistory {
  id: string;
  batch_number: string;
  quantity: number;
  created_at: string;
  skus: {
    code: string;
    name: string;
  };
}

const HistoryTab = () => {
  const [batches, setBatches] = useState<BatchHistory[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<BatchHistory[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = batches.filter(batch => 
        batch.skus.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.skus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBatches(filtered);
    } else {
      setFilteredBatches(batches);
    }
  }, [searchTerm, batches]);

  const fetchBatches = async () => {
    setLoading(true);
    
      const { data, error } = await supabase
        .from('batches')
        .select(`
          id,
          batch_number,
          quantity,
          created_at,
          skus!batches_sku_id_fkey (
            code,
            name
          )
        `)
        .order('created_at', { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch batch history",
        variant: "destructive",
      });
    } else {
      setBatches(data || []);
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Batch History</CardTitle>
          <CardDescription>
            View all created batches with search functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by SKU code, name, or batch number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch Number</TableHead>
                <TableHead>SKU Code</TableHead>
                <TableHead>SKU Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filteredBatches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {searchTerm ? 'No batches found matching your search.' : 'No batches found.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBatches.map((batch) => (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">{batch.batch_number}</TableCell>
                    <TableCell>{batch.skus.code}</TableCell>
                    <TableCell>{batch.skus.name}</TableCell>
                    <TableCell>{batch.quantity.toLocaleString()}</TableCell>
                    <TableCell>
                      {new Date(batch.created_at).toLocaleDateString()} {new Date(batch.created_at).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoryTab;