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

interface CAPA {
  id: string;
  capaId: string;
  title: string;
  type: string;
  priority: string;
  status: string;
  owner: string;
  dueDate: string;
}

export default function CapaPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const placeholderData: CAPA[] = [
    {
      id: '1',
      capaId: 'CAPA-2024-001',
      title: 'Implement Additional Control for Batch A OOS',
      type: 'Corrective',
      priority: 'High',
      status: 'In Progress',
      owner: 'John Smith',
      dueDate: '2026-06-15',
    },
    {
      id: '2',
      capaId: 'CAPA-2024-002',
      title: 'Upgrade HPLC Maintenance Schedule',
      type: 'Preventive',
      priority: 'Medium',
      status: 'In Progress',
      owner: 'Sarah Johnson',
      dueDate: '2026-06-30',
    },
    {
      id: '3',
      capaId: 'CAPA-2024-003',
      title: 'Review and Update Training Program',
      type: 'Corrective',
      priority: 'Low',
      status: 'Completed',
      owner: 'Mike Chen',
      dueDate: '2026-05-25',
    },
    {
      id: '4',
      capaId: 'CAPA-2024-004',
      title: 'Install Environmental Monitoring System',
      type: 'Preventive',
      priority: 'High',
      status: 'In Progress',
      owner: 'Emma Davis',
      dueDate: '2026-07-15',
    },
    {
      id: '5',
      capaId: 'CAPA-2024-005',
      title: 'Implement Cold Storage Temperature Alarm',
      type: 'Preventive',
      priority: 'High',
      status: 'Pending',
      owner: 'Robert Wilson',
      dueDate: '2026-06-10',
    },
    {
      id: '6',
      capaId: 'CAPA-2024-006',
      title: 'Establish Secondary Testing Method',
      type: 'Corrective',
      priority: 'Critical',
      status: 'In Progress',
      owner: 'Lisa Anderson',
      dueDate: '2026-06-05',
    },
    {
      id: '7',
      capaId: 'CAPA-2024-007',
      title: 'Preventive Equipment Maintenance',
      type: 'Preventive',
      priority: 'Medium',
      status: 'Completed',
      owner: 'James Brown',
      dueDate: '2026-05-20',
    },
    {
      id: '8',
      capaId: 'CAPA-2024-008',
      title: 'Personnel Retraining Initiative',
      type: 'Corrective',
      priority: 'Medium',
      status: 'Pending',
      owner: 'Patricia Martinez',
      dueDate: '2026-06-20',
    },
  ];

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ['capa'],
    queryFn: () => qaApi.getCapa(),
  });

  const apiRows: CAPA[] = Array.isArray(apiData)
    ? apiData.map((c: any) => ({
        id: String(c.id ?? c.capaId),
        capaId: c.capaCode ?? c.code ?? `CAPA-${c.id}`,
        title: c.capaTitle ?? c.title ?? c.description ?? 'Untitled',
        type: c.capaType ?? c.type ?? 'Corrective',
        priority: c.priority ?? 'Medium',
        status: c.status ?? 'Pending',
        owner: c.owner?.username ?? c.ownerName ?? 'Unassigned',
        dueDate: c.dueDate?.split('T')[0] ?? c.dueDateAt?.split('T')[0] ?? '',
      }))
    : [];

  const rows = apiRows.length > 0 ? apiRows : placeholderData;

  const getTypeColor = (type: string): 'success' | 'warning' => {
    return type === 'Corrective' ? 'error' : 'default';
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'default' => {
    switch (priority) {
      case 'Critical':
        return 'error';
      case 'High':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'In Progress':
        return 'warning';
      case 'Pending':
        return 'error';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    {
      field: 'capaId',
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
      field: 'type',
      headerName: 'Type',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={params.value === 'Corrective' ? 'error' : 'default'}
          variant="filled"
          size="small"
        />
      ),
    },
    {
      field: 'priority',
      headerName: 'Priority',
      flex: 1,
      minWidth: 110,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color={getPriorityColor(params.value)}
          variant="filled"
          size="small"
        />
      ),
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
      field: 'owner',
      headerName: 'Owner',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'dueDate',
      headerName: 'Due Date',
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
      item.capaId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 2 }}>
          CAPA (Corrective and Preventive Actions)
        </Typography>

        <Card sx={{ padding: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ marginBottom: 2 }}
          >
            <TextField
              placeholder="Search CAPA records..."
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
              New CAPA
            </Button>
          </Stack>

          {isError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
              {(error as Error)?.message ?? 'Failed to load CAPA records'}
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
