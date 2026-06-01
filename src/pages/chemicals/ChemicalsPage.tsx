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
import { chemicalsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

interface Chemical {
  id: string;
  casNumber: string;
  chemicalName: string;
  currentStock: number;
  unit: string;
  expiryDate: string;
  storageLocation: string;
  status: string;
}

export default function ChemicalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentBranchId } = useUIStore();

  const placeholderData: Chemical[] = [
    {
      id: '1',
      casNumber: '7732-18-5',
      chemicalName: 'Water (Purified)',
      currentStock: 500,
      unit: 'L',
      expiryDate: '2027-12-31',
      storageLocation: 'Storage A1',
      status: 'In Stock',
    },
    {
      id: '2',
      casNumber: '7647-14-5',
      chemicalName: 'Hydrochloric Acid',
      currentStock: 25,
      unit: 'L',
      expiryDate: '2026-08-15',
      storageLocation: 'Hazmat Storage B2',
      status: 'In Stock',
    },
    {
      id: '3',
      casNumber: '1310-73-2',
      chemicalName: 'Sodium Hydroxide',
      currentStock: 10,
      unit: 'kg',
      expiryDate: '2026-06-30',
      storageLocation: 'Hazmat Storage B3',
      status: 'Low Stock',
    },
    {
      id: '4',
      casNumber: '71-43-2',
      chemicalName: 'Benzene',
      currentStock: 2,
      unit: 'L',
      expiryDate: '2025-12-31',
      storageLocation: 'Flammable Cabinet C1',
      status: 'Expired',
    },
    {
      id: '5',
      casNumber: '64-17-5',
      chemicalName: 'Ethanol (95%)',
      currentStock: 150,
      unit: 'L',
      expiryDate: '2027-06-15',
      storageLocation: 'Flammable Cabinet C2',
      status: 'In Stock',
    },
    {
      id: '6',
      casNumber: '75-05-8',
      chemicalName: 'Acetonitrile',
      currentStock: 5,
      unit: 'L',
      expiryDate: '2026-09-20',
      storageLocation: 'Fume Hood D1',
      status: 'Low Stock',
    },
    {
      id: '7',
      casNumber: '110-54-3',
      chemicalName: 'n-Hexane',
      currentStock: 20,
      unit: 'L',
      expiryDate: '2027-03-10',
      storageLocation: 'Flammable Cabinet C3',
      status: 'In Stock',
    },
    {
      id: '8',
      casNumber: '7732-18-5',
      chemicalName: 'Deionized Water',
      currentStock: 300,
      unit: 'L',
      expiryDate: '2026-12-31',
      storageLocation: 'Storage A2',
      status: 'In Stock',
    },
    {
      id: '9',
      casNumber: '67-68-5',
      chemicalName: 'Dimethyl Sulfoxide',
      currentStock: 15,
      unit: 'L',
      expiryDate: '2027-01-25',
      storageLocation: 'Storage A3',
      status: 'In Stock',
    },
    {
      id: '10',
      casNumber: '298-14-6',
      chemicalName: 'Potassium Phosphate Monobasic',
      currentStock: 8,
      unit: 'kg',
      expiryDate: '2026-05-15',
      storageLocation: 'Storage A4',
      status: 'Expired',
    },
  ];

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ['chemicals-stock', currentBranchId],
    queryFn: () => chemicalsApi.getStock(currentBranchId),
  });

  const apiRows: Chemical[] = Array.isArray(apiData)
    ? apiData.map((c: any) => ({
        id: String(c.id ?? c.registrationId),
        casNumber: c.casNumber ?? c.cas ?? 'N/A',
        chemicalName: c.chemicalName ?? c.name ?? 'Unknown',
        currentStock: c.currentQuantity ?? c.currentStock ?? 0,
        unit: c.unit ?? c.uom ?? 'N/A',
        expiryDate: c.expiryDate?.split('T')[0] ?? c.expiresAt?.split('T')[0] ?? 'N/A',
        storageLocation: c.locationName ?? c.storageLocation ?? 'N/A',
        status: c.status ?? (c.currentQuantity <= 0 ? 'Out of Stock' : 'In Stock'),
      }))
    : [];

  const rows = apiRows.length > 0 ? apiRows : placeholderData;

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'In Stock':
        return 'success';
      case 'Low Stock':
        return 'warning';
      case 'Expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'casNumber',
      headerName: 'CAS Number',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'chemicalName',
      headerName: 'Chemical Name',
      flex: 1.5,
      minWidth: 180,
    },
    {
      field: 'currentStock',
      headerName: 'Current Stock',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => `${params.value}`,
    },
    {
      field: 'unit',
      headerName: 'Unit',
      flex: 0.8,
      minWidth: 80,
    },
    {
      field: 'expiryDate',
      headerName: 'Expiry Date',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'storageLocation',
      headerName: 'Storage Location',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
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
      field: 'actions',
      headerName: 'Actions',
      flex: 0.8,
      minWidth: 100,
      sortable: false,
      renderCell: () => (
        <Button variant="text" size="small" color="primary">
          Edit
        </Button>
      ),
    },
  ];

  const filteredRows = rows.filter(
    (item) =>
      item.casNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.chemicalName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 2 }}>
          Chemicals & Inventory
        </Typography>

        <Card sx={{ padding: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ marginBottom: 2 }}
          >
            <TextField
              placeholder="Search chemicals..."
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
              New Chemical
            </Button>
          </Stack>

          {isError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
              {(error as Error)?.message ?? 'Failed to load chemicals'}
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
