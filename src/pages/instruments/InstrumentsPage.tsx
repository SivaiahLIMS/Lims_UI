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
import { instrumentsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

interface Instrument {
  id: string;
  instrumentId: string;
  name: string;
  type: string;
  status: string;
  lastCalibration: string;
  nextCalibrationDue: string;
  location: string;
}

export default function InstrumentsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentBranchId } = useUIStore();

  const placeholderData: Instrument[] = [
    {
      id: '1',
      instrumentId: 'HPLC-01',
      name: 'HPLC System Alpha',
      type: 'HPLC',
      status: 'Active',
      lastCalibration: '2026-04-15',
      nextCalibrationDue: '2026-07-15',
      location: 'Lab 1',
    },
    {
      id: '2',
      instrumentId: 'GC-01',
      name: 'Gas Chromatograph GC-2030',
      type: 'GC',
      status: 'Active',
      lastCalibration: '2026-03-20',
      nextCalibrationDue: '2026-06-20',
      location: 'Lab 2',
    },
    {
      id: '3',
      instrumentId: 'MS-01',
      name: 'Mass Spectrometer Q-TOF',
      type: 'MS',
      status: 'Under Maintenance',
      lastCalibration: '2026-02-10',
      nextCalibrationDue: '2026-05-10',
      location: 'Lab 3',
    },
    {
      id: '4',
      instrumentId: 'UV-VIS-01',
      name: 'UV-Vis Spectrophotometer',
      type: 'Spectrophotometer',
      status: 'Active',
      lastCalibration: '2026-05-01',
      nextCalibrationDue: '2026-08-01',
      location: 'Lab 1',
    },
    {
      id: '5',
      instrumentId: 'ICP-OES-01',
      name: 'ICP-OES Spectrometer',
      type: 'ICP-OES',
      status: 'Inactive',
      lastCalibration: '2025-12-15',
      nextCalibrationDue: '2026-03-15',
      location: 'Lab 4',
    },
    {
      id: '6',
      instrumentId: 'FTIR-01',
      name: 'FTIR Spectrometer',
      type: 'FTIR',
      status: 'Active',
      lastCalibration: '2026-04-01',
      nextCalibrationDue: '2026-07-01',
      location: 'Lab 2',
    },
    {
      id: '7',
      instrumentId: 'pH-METER-01',
      name: 'pH Meter Calibrated',
      type: 'pH Meter',
      status: 'Active',
      lastCalibration: '2026-05-20',
      nextCalibrationDue: '2026-06-20',
      location: 'Lab 1',
    },
    {
      id: '8',
      instrumentId: 'BALANCE-01',
      name: 'Analytical Balance',
      type: 'Balance',
      status: 'Active',
      lastCalibration: '2026-05-15',
      nextCalibrationDue: '2026-08-15',
      location: 'Lab 1',
    },
    {
      id: '9',
      instrumentId: 'CENTRIFUGE-01',
      name: 'Refrigerated Centrifuge',
      type: 'Centrifuge',
      status: 'Active',
      lastCalibration: '2026-03-10',
      nextCalibrationDue: '2026-09-10',
      location: 'Lab 3',
    },
    {
      id: '10',
      instrumentId: 'OVEN-01',
      name: 'Vacuum Oven',
      type: 'Oven',
      status: 'Inactive',
      lastCalibration: '2025-11-20',
      nextCalibrationDue: '2026-02-20',
      location: 'Lab 4',
    },
  ];

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ['instruments', currentBranchId],
    queryFn: () => instrumentsApi.list(currentBranchId),
  });

  const apiRows: Instrument[] = Array.isArray(apiData)
    ? apiData.map((i: any) => ({
        id: String(i.id ?? i.instrumentId),
        instrumentId: i.instrumentCode ?? i.code ?? `INST-${i.id}`,
        name: i.instrumentName ?? i.name ?? 'Unknown',
        type: i.instrumentType ?? i.type ?? 'General',
        status: i.status ?? 'Inactive',
        lastCalibration: i.lastCalibrationDate?.split('T')[0] ?? i.lastCalibration ?? '',
        nextCalibrationDue: i.nextCalibrationDate?.split('T')[0] ?? i.nextCalibrationDue ?? '',
        location: i.locationName ?? i.location ?? 'N/A',
      }))
    : [];

  const rows = apiRows.length > 0 ? apiRows : placeholderData;

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'Active':
        return 'success';
      case 'Under Maintenance':
        return 'warning';
      case 'Inactive':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'instrumentId',
      headerName: 'ID',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'name',
      headerName: 'Name',
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'type',
      headerName: 'Type',
      flex: 1,
      minWidth: 130,
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
      field: 'lastCalibration',
      headerName: 'Last Calibration',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'nextCalibrationDue',
      headerName: 'Next Due',
      flex: 1,
      minWidth: 140,
    },
    {
      field: 'location',
      headerName: 'Location',
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
      item.instrumentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 2 }}>
          Instruments
        </Typography>

        <Card sx={{ padding: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ marginBottom: 2 }}
          >
            <TextField
              placeholder="Search instruments..."
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
              New Instrument
            </Button>
          </Stack>

          {isError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
              {(error as Error)?.message ?? 'Failed to load instruments'}
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
