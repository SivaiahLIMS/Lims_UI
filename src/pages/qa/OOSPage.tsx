import React, { useState } from 'react';
import {
  Box,
  Card,
  Button,
  Typography,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Add, Search, FilterList } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { qaApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

interface OOS {
  id: string;
  oosId: string;
  sample: string;
  test: string;
  result: string;
  specification: string;
  status: string;
  date: string;
}

export default function OOSPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentBranchId } = useUIStore();

  const placeholderData: OOS[] = [
    {
      id: '1',
      oosId: 'OOS-2024-001',
      sample: 'SM-0045',
      test: 'Assay',
      result: '89.2%',
      specification: '95.0 - 105.0%',
      status: 'Under Investigation',
      date: '2026-05-20',
    },
    {
      id: '2',
      oosId: 'OOS-2024-002',
      sample: 'SM-0056',
      test: 'Impurity A',
      result: '3.5%',
      specification: '<2.0%',
      status: 'Rejected',
      date: '2026-05-22',
    },
    {
      id: '3',
      oosId: 'OOS-2024-003',
      sample: 'SM-0067',
      test: 'Dissolution',
      result: '78%',
      specification: '>80% in 30 min',
      status: 'Under Investigation',
      date: '2026-05-18',
    },
    {
      id: '4',
      oosId: 'OOS-2024-004',
      sample: 'SM-0078',
      test: 'Hardness',
      result: '15.2 kP',
      specification: '10-15 kP',
      status: 'Accepted',
      date: '2026-05-25',
    },
    {
      id: '5',
      oosId: 'OOS-2024-005',
      sample: 'SM-0089',
      test: 'Moisture',
      result: '8.5%',
      specification: '<5.0%',
      status: 'Under Investigation',
      date: '2026-05-23',
    },
    {
      id: '6',
      oosId: 'OOS-2024-006',
      sample: 'SM-0090',
      test: 'Microbial Count',
      result: '>1000 CFU/g',
      specification: '<100 CFU/g',
      status: 'Rejected',
      date: '2026-05-24',
    },
    {
      id: '7',
      oosId: 'OOS-2024-007',
      sample: 'SM-0101',
      test: 'pH',
      result: '5.8',
      specification: '6.0 - 7.5',
      status: 'Accepted',
      date: '2026-05-10',
    },
    {
      id: '8',
      oosId: 'OOS-2024-008',
      sample: 'SM-0112',
      test: 'Water Content',
      result: '6.2%',
      specification: '<2.0%',
      status: 'Under Investigation',
      date: '2026-05-15',
    },
  ];

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ['oos', currentBranchId],
    queryFn: () => qaApi.getOos(currentBranchId),
  });

  const apiRows: OOS[] = Array.isArray(apiData)
    ? apiData.map((o: any) => ({
        id: String(o.id ?? o.oosId),
        oosId: o.oosCode ?? o.code ?? `OOS-${o.id}`,
        sample: o.sampleCode ?? o.sample ?? 'Unknown',
        test: o.testName ?? o.test ?? 'Unknown',
        result: o.result ?? 'N/A',
        specification: o.specification ?? 'N/A',
        status: o.status ?? 'Under Investigation',
        date: o.createdAt?.split('T')[0] ?? o.date ?? '',
      }))
    : [];

  const rows = apiRows.length > 0 ? apiRows : placeholderData;

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'Accepted':
        return 'success';
      case 'Rejected':
        return 'error';
      case 'Under Investigation':
        return 'warning';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'oosId',
      headerName: 'ID',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'sample',
      headerName: 'Sample',
      flex: 1,
      minWidth: 110,
    },
    {
      field: 'test',
      headerName: 'Test',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'result',
      headerName: 'Result',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'specification',
      headerName: 'Specification',
      flex: 1.2,
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 140,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getStatusColor(params.value)}
          variant="filled"
          size="small"
        />
      ),
    },
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      renderCell: () => (
        <Button variant="text" size="small" color="primary">
          View
        </Button>
      ),
    },
  ];

  const filteredRows = rows.filter(
    (item) =>
      item.oosId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sample.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 2 }}>
          Out of Specification / Out of Trend (OOS/OOT)
        </Typography>

        <Card sx={{ padding: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ marginBottom: 2 }}
          >
            <TextField
              placeholder="Search OOS/OOT records..."
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />
            <Button
              startIcon={<FilterList />}
              variant="outlined"
              size="small"
            >
              Filter
            </Button>
            <Button
              startIcon={<Add />}
              variant="contained"
              size="small"
              sx={{ backgroundColor: '#1976d2' }}
            >
              New OOS
            </Button>
          </Stack>

          {isError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
              {(error as Error)?.message ?? 'Failed to load OOS records'}
            </Alert>
          )}
          <Box sx={{ height: 500, width: '100%' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <CircularProgress />
              </Box>
            ) : (
              <DataGrid
                rows={filteredRows}
                columns={columns}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 10,
                    },
                  },
                }}
                disableRowSelectionOnClick
              />
            )}
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
