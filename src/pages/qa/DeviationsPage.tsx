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

interface Deviation {
  id: string;
  deviationId: string;
  title: string;
  severity: string;
  status: string;
  raisedBy: string;
  date: string;
  capaStatus: string;
}

export default function DeviationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentBranchId } = useUIStore();

  const placeholderData: Deviation[] = [
    {
      id: '1',
      deviationId: 'QA-2024-001',
      title: 'Out of Specification Result - Batch A',
      severity: 'Critical',
      status: 'Open',
      raisedBy: 'John Smith',
      date: '2026-05-20',
      capaStatus: 'In Progress',
    },
    {
      id: '2',
      deviationId: 'QA-2024-002',
      title: 'Equipment Failure - HPLC-01',
      severity: 'Major',
      status: 'Open',
      raisedBy: 'Sarah Johnson',
      date: '2026-05-22',
      capaStatus: 'Pending',
    },
    {
      id: '3',
      deviationId: 'QA-2024-003',
      title: 'Documentation Error - Sample Receipt',
      severity: 'Minor',
      status: 'Closed',
      raisedBy: 'Mike Chen',
      date: '2026-05-18',
      capaStatus: 'Completed',
    },
    {
      id: '4',
      deviationId: 'QA-2024-004',
      title: 'Temperature Excursion - Cold Storage',
      severity: 'Major',
      status: 'Open',
      raisedBy: 'Emma Davis',
      date: '2026-05-25',
      capaStatus: 'In Progress',
    },
    {
      id: '5',
      deviationId: 'QA-2024-005',
      title: 'Personnel Training Gap - Lab Procedures',
      severity: 'Minor',
      status: 'Open',
      raisedBy: 'Robert Wilson',
      date: '2026-05-23',
      capaStatus: 'Pending',
    },
    {
      id: '6',
      deviationId: 'QA-2024-006',
      title: 'Calibration Overdue - pH Meter',
      severity: 'Critical',
      status: 'Open',
      raisedBy: 'Lisa Anderson',
      date: '2026-05-24',
      capaStatus: 'In Progress',
    },
    {
      id: '7',
      deviationId: 'QA-2024-007',
      title: 'Contamination Issue - Sample Batch',
      severity: 'Major',
      status: 'Closed',
      raisedBy: 'James Brown',
      date: '2026-05-10',
      capaStatus: 'Completed',
    },
    {
      id: '8',
      deviationId: 'QA-2024-008',
      title: 'Labeling Error - Product Packaging',
      severity: 'Minor',
      status: 'Closed',
      raisedBy: 'Patricia Martinez',
      date: '2026-05-15',
      capaStatus: 'Completed',
    },
  ];

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ['deviations', currentBranchId],
    queryFn: () => qaApi.getDeviations(currentBranchId),
  });

  const apiRows: Deviation[] = Array.isArray(apiData)
    ? apiData.map((d: any) => ({
        id: String(d.id ?? d.deviationId),
        deviationId: d.deviationCode ?? d.code ?? `QA-${d.id}`,
        title: d.deviationDescription ?? d.title ?? d.description ?? 'Untitled',
        severity: d.severity ?? 'Minor',
        status: d.status ?? 'Open',
        raisedBy: d.raisedBy?.username ?? d.raisedByName ?? 'Unknown',
        date: d.createdAt?.split('T')[0] ?? d.date ?? '',
        capaStatus: d.capaStatus ?? d.capaRequired ? 'Pending' : 'N/A',
      }))
    : [];

  const rows = apiRows.length > 0 ? apiRows : placeholderData;

  const getSeverityColor = (severity: string): 'error' | 'warning' | 'default' => {
    switch (severity) {
      case 'Critical':
        return 'error';
      case 'Major':
        return 'warning';
      case 'Minor':
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string): 'success' | 'error' | 'default' => {
    switch (status) {
      case 'Closed':
        return 'success';
      case 'Open':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'deviationId',
      headerName: 'ID',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'title',
      headerName: 'Title',
      flex: 2,
      minWidth: 220,
    },
    {
      field: 'severity',
      headerName: 'Severity',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getSeverityColor(params.value)}
          variant="filled"
          size="small"
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 100,
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
      field: 'raisedBy',
      headerName: 'Raised By',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'date',
      headerName: 'Date',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'capaStatus',
      headerName: 'CAPA Status',
      flex: 1,
      minWidth: 130,
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
      item.deviationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 2 }}>
          Deviations
        </Typography>

        <Card sx={{ padding: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ marginBottom: 2 }}
          >
            <TextField
              placeholder="Search deviations..."
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
              New Deviation
            </Button>
          </Stack>

          {isError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
              {(error as Error)?.message ?? 'Failed to load deviations'}
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
