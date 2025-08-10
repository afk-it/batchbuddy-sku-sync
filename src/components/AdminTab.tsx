import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

const AdminTab = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExportToday = async () => {
    const today = new Date().toISOString().split('T')[0];
    await exportToExcel(today, today, 'today');
  };

  const handleExportRange = async () => {
    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please select both start and end dates",
        variant: "destructive",
      });
      return;
    }
    
    if (new Date(startDate) > new Date(endDate)) {
      toast({
        title: "Error",
        description: "Start date must be before end date",
        variant: "destructive",
      });
      return;
    }

    await exportToExcel(startDate, endDate, 'range');
  };

  const exportToExcel = async (start: string, end: string, type: 'today' | 'range') => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('batches')
        .select(`
          batch_number,
          quantity,
          created_at,
          skus!batches_sku_id_fkey (
            code,
            name
          )
        `)
        .gte('created_at', `${start}T00:00:00`)
        .lte('created_at', `${end}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        toast({
          title: "No Data",
          description: "No batches found for the selected date range",
        });
        return;
      }

      // Transform data for Excel
      const excelData = data.map((batch) => ({
        'Batch Number': batch.batch_number,
        'SKU Code': batch.skus?.code || '',
        'SKU Name': batch.skus?.name || '',
        'Quantity': batch.quantity,
        'Created Date': new Date(batch.created_at).toLocaleDateString(),
        'Created Time': new Date(batch.created_at).toLocaleTimeString(),
      }));

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Auto-size columns
      const colWidths = [
        { wch: 15 }, // Batch Number
        { wch: 12 }, // SKU Code
        { wch: 30 }, // SKU Name
        { wch: 10 }, // Quantity
        { wch: 12 }, // Created Date
        { wch: 12 }, // Created Time
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'Batches');

      // Generate filename
      const filename = type === 'today' 
        ? `batches_${start}.xlsx`
        : `batches_${start}_to_${end}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      toast({
        title: "Success",
        description: `Exported ${data.length} batches to ${filename}`,
      });

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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Excel Export</CardTitle>
          <CardDescription>
            Export batch data to Excel files for reporting and analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Today's Export */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Export Today's Batches</h3>
            <Button 
              onClick={handleExportToday} 
              disabled={loading}
              className="w-full md:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Exporting...' : 'Export Today'}
            </Button>
          </div>

          {/* Date Range Export */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Export Date Range</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
            <Button 
              onClick={handleExportRange} 
              disabled={loading || !startDate || !endDate}
              className="w-full md:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Exporting...' : 'Export Range'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTab;