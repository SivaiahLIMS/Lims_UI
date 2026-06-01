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
import { employeesApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

interface Employee {
  id: string;
  employeeId: string;
  fullName: string;
  department: string;
  role: string;
  status: string;
  joinDate: string;
}

export default function EmployeesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { currentBranchId } = useUIStore();

  const placeholderData: Employee[] = [
    {
      id: '1',
      employeeId: 'EMP-001',
      fullName: 'John Smith',
      department: 'Quality Assurance',
      role: 'QA Manager',
      status: 'Active',
      joinDate: '2020-01-15',
    },
    {
      id: '2',
      employeeId: 'EMP-002',
      fullName: 'Sarah Johnson',
      department: 'Laboratory',
      role: 'Senior Analyst',
      status: 'Active',
      joinDate: '2019-06-10',
    },
    {
      id: '3',
      employeeId: 'EMP-003',
      fullName: 'Mike Chen',
      department: 'Operations',
      role: 'Operations Supervisor',
      status: 'Active',
      joinDate: '2021-03-22',
    },
    {
      id: '4',
      employeeId: 'EMP-004',
      fullName: 'Emma Davis',
      department: 'Laboratory',
      role: 'Analyst',
      status: 'Active',
      joinDate: '2021-09-05',
    },
    {
      id: '5',
      employeeId: 'EMP-005',
      fullName: 'Robert Wilson',
      department: 'Maintenance',
      role: 'Equipment Technician',
      status: 'Inactive',
      joinDate: '2018-11-20',
    },
    {
      id: '6',
      employeeId: 'EMP-006',
      fullName: 'Lisa Anderson',
      department: 'Quality Assurance',
      role: 'QA Analyst',
      status: 'Active',
      joinDate: '2022-01-10',
    },
    {
      id: '7',
      employeeId: 'EMP-007',
      fullName: 'James Brown',
      department: 'Laboratory',
      role: 'Analyst',
      status: 'Active',
      joinDate: '2022-04-15',
    },
    {
      id: '8',
      employeeId: 'EMP-008',
      fullName: 'Patricia Martinez',
      department: 'Documentation',
      role: 'Regulatory Affairs Specialist',
      status: 'Active',
      joinDate: '2020-07-30',
    },
    {
      id: '9',
      employeeId: 'EMP-009',
      fullName: 'David Lee',
      department: 'Laboratory',
      role: 'Analyst',
      status: 'Active',
      joinDate: '2023-02-20',
    },
    {
      id: '10',
      employeeId: 'EMP-010',
      fullName: 'Jennifer White',
      department: 'Management',
      role: 'LIMS Administrator',
      status: 'Active',
      joinDate: '2019-09-12',
    },
  ];

  const { data: apiData, isLoading, isError, error } = useQuery({
    queryKey: ['employees', currentBranchId],
    queryFn: () => employeesApi.list(currentBranchId),
  });

  const apiRows: Employee[] = Array.isArray(apiData)
    ? apiData.map((e: any) => ({
        id: String(e.id ?? e.employeeId),
        employeeId: e.employeeCode ?? e.code ?? `EMP-${e.id}`,
        fullName: e.employeeName ?? e.fullName ?? e.name ?? 'Unknown',
        department: e.departmentName ?? e.department ?? 'N/A',
        role: e.jobTitle ?? e.role ?? 'N/A',
        status: e.status ?? 'Active',
        joinDate: e.joinDate?.split('T')[0] ?? e.joiningDate?.split('T')[0] ?? '',
      }))
    : [];

  const rows = apiRows.length > 0 ? apiRows : placeholderData;

  const getStatusColor = (status: string): 'success' | 'error' => {
    return status === 'Active' ? 'success' : 'error';
  };

  const columns: GridColDef[] = [
    {
      field: 'employeeId',
      headerName: 'Employee ID',
      flex: 1,
      minWidth: 120,
    },
    {
      field: 'fullName',
      headerName: 'Full Name',
      flex: 1.2,
      minWidth: 160,
    },
    {
      field: 'department',
      headerName: 'Department',
      flex: 1.2,
      minWidth: 160,
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1.2,
      minWidth: 180,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 110,
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
      field: 'joinDate',
      headerName: 'Join Date',
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
          Edit
        </Button>
      ),
    },
  ];

  const filteredRows = rows.filter(
    (item) =>
      item.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box sx={{ padding: 3 }}>
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 2 }}>
          Employees
        </Typography>

        <Card sx={{ padding: 2 }}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ marginBottom: 2 }}
          >
            <TextField
              placeholder="Search employees..."
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
              New Employee
            </Button>
          </Stack>

          {isError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => {}}>
              {(error as Error)?.message ?? 'Failed to load employees'}
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
