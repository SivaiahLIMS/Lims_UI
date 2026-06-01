import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, Button, Typography, Chip, Stack, TextField,
  InputAdornment, CircularProgress, Alert, Tab, Tabs, Dialog,
  DialogTitle, DialogContent, DialogActions, MenuItem, Select,
  FormControl, InputLabel, alpha, useTheme,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import {
  Add, Search, FilterList, Edit, Visibility, Assignment,
  HourglassEmpty, CheckCircle, Cancel, Description,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksheetsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';

const ANALYST_ROLES = ['qc_analyst', 'qa_analyst', 'analyst'];
const REVIEWER_ROLES = ['qa_manager', 'qa_reviewer', 'approver', 'reviewer', 'manager'];

type WsStatus = 'Draft' | 'In Review' | 'Approved' | 'Rejected' | 'Submitted';

interface Worksheet {
  id: string;
  wsId: string;
  title: string;
  status: WsStatus;
  assignedTo: string;
  createdDate: string;
}

const STATUS_CONFIG: Record<WsStatus, { color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  Draft: { color: 'default' },
  'In Review': { color: 'warning' },
  Approved: { color: 'success' },
  Rejected: { color: 'error' },
  Submitted: { color: 'info' },
};

const PLACEHOLDER_DATA: Worksheet[] = [
  { id: '1', wsId: 'WS-2024-001', title: 'Stability Testing - Product A', status: 'Approved', assignedTo: 'John Smith', createdDate: '2026-05-20' },
  { id: '2', wsId: 'WS-2024-002', title: 'Dissolution Analysis - Batch B', status: 'In Review', assignedTo: 'Sarah Johnson', createdDate: '2026-05-22' },
  { id: '3', wsId: 'WS-2024-003', title: 'Impurity Testing - Product C', status: 'Draft', assignedTo: 'Mike Chen', createdDate: '2026-05-25' },
  { id: '4', wsId: 'WS-2024-004', title: 'Microbial Limits - Sample Batch D', status: 'Rejected', assignedTo: 'Emma Davis', createdDate: '2026-05-18' },
  { id: '5', wsId: 'WS-2024-005', title: 'Water Content Analysis - Batch E', status: 'Approved', assignedTo: 'Robert Wilson', createdDate: '2026-05-23' },
  { id: '6', wsId: 'WS-2024-006', title: 'pH Testing - Product F', status: 'In Review', assignedTo: 'Lisa Anderson', createdDate: '2026-05-24' },
  { id: '7', wsId: 'WS-2024-007', title: 'Residual Solvent - Batch G', status: 'Draft', assignedTo: 'James Brown', createdDate: '2026-05-26' },
  { id: '8', wsId: 'WS-2024-008', title: 'Content Uniformity - Sample H', status: 'Approved', assignedTo: 'Patricia Martinez', createdDate: '2026-05-21' },
];

const TAB_FILTERS = [
  { label: 'All', key: 'all', filter: () => true },
  { label: 'Draft', key: 'draft', filter: (w: Worksheet) => w.status === 'Draft' },
  { label: 'In Review', key: 'review', filter: (w: Worksheet) => w.status === 'In Review' || w.status === 'Submitted' },
  { label: 'Approved', key: 'approved', filter: (w: Worksheet) => w.status === 'Approved' },
  { label: 'Rejected', key: 'rejected', filter: (w: Worksheet) => w.status === 'Rejected' },
];

export default function WorksheetsPage() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [newWsDialog, setNewWsDialog] = useState(false);
  const [newWsForm, setNewWsForm] = useState({ title: '', type: 'Analytical', priority: 'Normal' });
  const { currentBranchId } = useUIStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isAnalyst = ANALYST_ROLES.some((role) =>
    user?.permissions?.some((p) => p.toLowerCase().includes(role))
  );
  const isReviewer = REVIEWER_ROLES.some((role) =>
    user?.permissions?.some((p) => p.toLowerCase().includes(role))
  );

  const { data: apiData, isLoading, isError } = useQuery({
    queryKey: ['worksheets', currentBranchId],
    queryFn: () => worksheetsApi.list(currentBranchId),
    retry: false,
  });

  const createMutation = useMutation({
    mutationFn: () => worksheetsApi.create({ ...newWsForm }, currentBranchId),
    onSuccess: () => {
      setNewWsDialog(false);
      setNewWsForm({ title: '', type: 'Analytical', priority: 'Normal' });
      queryClient.invalidateQueries({ queryKey: ['worksheets', currentBranchId] });
    },
  });

  const apiRows: Worksheet[] = Array.isArray(apiData)
    ? apiData.map((w: any) => ({
        id: String(w.id ?? w.worksheetId),
        wsId: w.worksheetCode ?? w.code ?? `WS-${w.id}`,
        title: w.title ?? w.name ?? 'Untitled',
        status: w.status ?? 'Draft',
        assignedTo: w.assignedTo?.username ?? w.assignedToName ?? 'Unassigned',
        createdDate: w.createdAt?.split('T')[0] ?? w.createdDate ?? '',
      }))
    : [];

  const rows = apiRows.length > 0 ? apiRows : PLACEHOLDER_DATA;

  const statusCounts = {
    all: rows.length,
    draft: rows.filter((w) => w.status === 'Draft').length,
    review: rows.filter((w) => w.status === 'In Review' || w.status === 'Submitted').length,
    approved: rows.filter((w) => w.status === 'Approved').length,
    rejected: rows.filter((w) => w.status === 'Rejected').length,
  };

  const filteredRows = rows
    .filter(TAB_FILTERS[activeTab].filter)
    .filter((item) =>
      item.wsId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.assignedTo.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const columns: GridColDef[] = [
    {
      field: 'wsId', headerName: 'ID', width: 140,
      renderCell: (p) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 600, color: theme.palette.primary.main }}>
          {p.value}
        </Typography>
      ),
    },
    { field: 'title', headerName: 'Title', flex: 2, minWidth: 240 },
    {
      field: 'status', headerName: 'Status', width: 130,
      renderCell: (p) => {
        const cfg = STATUS_CONFIG[p.value as WsStatus] ?? { color: 'default' as const };
        return <Chip label={p.value} color={cfg.color} size="small" />;
      },
    },
    { field: 'assignedTo', headerName: 'Assigned To', flex: 1, minWidth: 150 },
    { field: 'createdDate', headerName: 'Created Date', width: 130 },
    {
      field: 'actions', headerName: 'Actions', width: 200, sortable: false,
      renderCell: (p) => (
        <Stack direction="row" spacing={0.5}>
          {isAnalyst && (
            <Button
              variant="text" size="small" color="primary"
              startIcon={<Edit fontSize="small" />}
              onClick={() => navigate(`/worksheets/${p.row.id}/execute`)}
              sx={{ fontSize: 12, px: 1 }}
            >
              Analyze
            </Button>
          )}
          {isReviewer && (
            <Button
              variant="text" size="small" color="secondary"
              startIcon={<Visibility fontSize="small" />}
              onClick={() => navigate(`/worksheets/${p.row.id}/review`)}
              sx={{ fontSize: 12, px: 1 }}
            >
              Review
            </Button>
          )}
          {!isAnalyst && !isReviewer && (
            <Button
              variant="text" size="small" color="primary"
              onClick={() => navigate(`/worksheets/${p.row.id}/review`)}
              sx={{ fontSize: 12, px: 1 }}
            >
              View
            </Button>
          )}
        </Stack>
      ),
    },
  ];

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={700}>Worksheets</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Worksheet lifecycle, execution data, and review history. All endpoints require X-Branch-Id header.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setNewWsDialog(true)}>
          New Worksheet
        </Button>
      </Stack>

      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2, mb: 3 }}>
        {[
          { label: 'Total', count: statusCounts.all, icon: <Description />, color: theme.palette.primary.main },
          { label: 'Draft', count: statusCounts.draft, icon: <Assignment />, color: theme.palette.grey[600] },
          { label: 'In Review', count: statusCounts.review, icon: <HourglassEmpty />, color: theme.palette.warning.main },
          { label: 'Approved', count: statusCounts.approved, icon: <CheckCircle />, color: theme.palette.success.main },
          { label: 'Rejected', count: statusCounts.rejected, icon: <Cancel />, color: theme.palette.error.main },
        ].map((stat) => (
          <Card key={stat.label} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{
                width: 38, height: 38, borderRadius: 2,
                bgcolor: alpha(stat.color, 0.1),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: stat.color,
              }}>
                {stat.icon}
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700}>{stat.count}</Typography>
                <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
              </Box>
            </Stack>
          </Card>
        ))}
      </Box>

      {/* Table card */}
      <Card>
        {/* Status tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ minHeight: 44 }}>
            {TAB_FILTERS.map((t, i) => (
              <Tab
                key={t.key}
                label={`${t.label} (${statusCounts[t.key as keyof typeof statusCounts]})`}
                sx={{ minHeight: 44, py: 0, fontSize: 13 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Search */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <TextField
            placeholder="Search by ID, title, or analyst…"
            size="small"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start"><Search sx={{ fontSize: 18 }} /></InputAdornment>
              ),
            }}
            sx={{ flex: 1 }}
          />
          <Button variant="outlined" size="small" startIcon={<FilterList />}>Filter</Button>
        </Stack>

        {isError && (
          <Alert severity="warning" sx={{ mx: 2, mt: 2 }}>
            Could not load worksheets from server. Showing sample data.
          </Alert>
        )}

        <Box sx={{ height: 520 }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <CircularProgress />
            </Box>
          ) : (
            <DataGrid
              rows={filteredRows}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': { borderColor: theme.palette.divider },
                '& .MuiDataGrid-columnHeaders': { bgcolor: theme.palette.grey[50] },
              }}
            />
          )}
        </Box>
      </Card>

      {/* New Worksheet Dialog */}
      <Dialog open={newWsDialog} onClose={() => setNewWsDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Assignment color="primary" />
          Create New Worksheet
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2.5}>
            <TextField
              label="Worksheet Title"
              fullWidth required size="small"
              value={newWsForm.title}
              onChange={(e) => setNewWsForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g., HPLC Assay - Batch 2024-045"
            />
            <FormControl size="small" fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newWsForm.type}
                label="Type"
                onChange={(e) => setNewWsForm((p) => ({ ...p, type: e.target.value }))}
              >
                {['Analytical', 'Stability', 'Dissolution', 'Microbial', 'Physical', 'Other'].map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={newWsForm.priority}
                label="Priority"
                onChange={(e) => setNewWsForm((p) => ({ ...p, priority: e.target.value }))}
              >
                {['Low', 'Normal', 'High', 'Urgent'].map((p) => (
                  <MenuItem key={p} value={p}>{p}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setNewWsDialog(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            disabled={!newWsForm.title.trim() || createMutation.isPending}
            startIcon={createMutation.isPending ? <CircularProgress size={16} /> : <Add />}
            onClick={() => createMutation.mutate()}
          >
            Create Worksheet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
