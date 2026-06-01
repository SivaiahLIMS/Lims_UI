import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Button, Chip, Stack,
  TextField, Select, MenuItem, FormControl, InputLabel,
  CircularProgress, Alert, Tooltip, IconButton,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, alpha, useTheme, Dialog, DialogTitle, DialogContent,
  DialogActions, Collapse,
} from '@mui/material';
import {
  ArrowBack, Save, CheckCircle, Science, Build,
  Assignment, InfoOutlined, Warning, Cancel as CancelIcon,
  TaskAlt, Timer, ExpandMore, ExpandLess,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { worksheetsApi, chemicalsApi, instrumentsApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import Stopwatch from '../../components/Stopwatch';

interface TestCaseEntry {
  testCaseId: string;
  resultValue: string;
  chemicalId: string;
  instrumentId: string;
  comments: string;
}

type ValidationStatus = 'pass' | 'fail' | 'oot' | null;

const ANALYST_ROLES = ['qc_analyst', 'qa_analyst', 'analyst'];

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'success' | 'error' | 'info' }> = {
  Draft: { label: 'Draft', color: 'default' },
  'In Review': { label: 'In Review', color: 'warning' },
  Approved: { label: 'Approved', color: 'success' },
  Rejected: { label: 'Rejected', color: 'error' },
  Submitted: { label: 'Submitted', color: 'info' },
};

const PLACEHOLDER_TEST_CASES = [
  {
    id: 'tc-1', name: 'pH Measurement', method: 'USP <791>', unit: 'pH units',
    specification: '6.5 – 7.5',
    validationRule: { type: 'range', min: 6.5, max: 7.5, ootMin: 6.2, ootMax: 7.8 },
  },
  {
    id: 'tc-2', name: 'Assay (HPLC)', method: 'USP <621>', unit: '%',
    specification: '98.0 – 102.0',
    validationRule: { type: 'range', min: 98.0, max: 102.0, ootMin: 97.0, ootMax: 103.0 },
  },
  {
    id: 'tc-3', name: 'Water Content (KF)', method: 'USP <921>', unit: '%w/w',
    specification: 'NMT 0.5',
    validationRule: { type: 'max', max: 0.5, ootMax: 0.7 },
  },
  {
    id: 'tc-4', name: 'Residue on Ignition', method: 'USP <281>', unit: '%',
    specification: 'NMT 0.1',
    validationRule: { type: 'max', max: 0.1, ootMax: 0.15 },
  },
  {
    id: 'tc-5', name: 'Microbial Limits', method: 'USP <61>', unit: 'CFU/g',
    specification: 'NMT 100',
    validationRule: null,
  },
];

function evaluateValidation(value: string, rule: any): ValidationStatus {
  if (!rule || value === '') return null;
  const num = parseFloat(value);
  if (isNaN(num)) return null;
  if (rule.type === 'range') {
    if (num >= rule.min && num <= rule.max) return 'pass';
    if (rule.ootMin != null && rule.ootMax != null && num >= rule.ootMin && num <= rule.ootMax) return 'oot';
    return 'fail';
  }
  if (rule.type === 'max') {
    if (num <= rule.max) return 'pass';
    if (rule.ootMax != null && num <= rule.ootMax) return 'oot';
    return 'fail';
  }
  if (rule.type === 'min') {
    if (num >= rule.min) return 'pass';
    if (rule.ootMin != null && num >= rule.ootMin) return 'oot';
    return 'fail';
  }
  return null;
}

const VALIDATION_CFG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pass: { icon: <TaskAlt fontSize="small" />, color: '#2E7D32', label: 'Pass' },
  fail: { icon: <CancelIcon fontSize="small" />, color: '#C62828', label: 'OOS' },
  oot: { icon: <Warning fontSize="small" />, color: '#E65100', label: 'OOT' },
};

function formatMs(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1_000);
  const cs = Math.floor((ms % 1_000) / 10);
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
}

interface ChemicalTimer {
  tcId: string;
  testName: string;
  chemicalLabel: string;
  startedAt: number;
}

function ChemicalIssuanceTimerPanel({
  timers,
  onStop,
}: {
  timers: ChemicalTimer[];
  onStop: (tcId: string) => void;
}) {
  const theme = useTheme();
  const [elapsedMap, setElapsedMap] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(true);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tick = useCallback(() => {
    const now = Date.now();
    setElapsedMap(() => {
      const next: Record<string, number> = {};
      timers.forEach((t) => { next[t.tcId] = now - t.startedAt; });
      return next;
    });
  }, [timers]);

  useEffect(() => {
    if (timers.length === 0) {
      if (tickRef.current) clearInterval(tickRef.current);
      return;
    }
    tickRef.current = setInterval(tick, 100);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [timers, tick]);

  if (timers.length === 0) return null;

  return (
    <Card
      sx={{
        mb: 2,
        border: `1px solid ${alpha(theme.palette.warning.main, 0.4)}`,
        bgcolor: alpha(theme.palette.warning.main, 0.03),
      }}
    >
      <Box
        sx={{
          px: 2.5, py: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
          borderBottom: expanded ? `1px solid ${alpha(theme.palette.warning.main, 0.2)}` : 'none',
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Timer fontSize="small" sx={{ color: theme.palette.warning.main }} />
          <Typography variant="subtitle2" fontWeight={700} sx={{ color: theme.palette.warning.dark }}>
            Chemical Issuance Timers
          </Typography>
          <Chip
            label={`${timers.length} active`}
            size="small"
            color="warning"
            sx={{ height: 20, fontSize: 11 }}
          />
        </Stack>
        <IconButton size="small">
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </IconButton>
      </Box>
      <Collapse in={expanded}>
        <Box sx={{ px: 2.5, py: 1.5 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1.5, display: 'block' }}>
            Timers start automatically when a chemical is selected. Stop a timer when the chemical is returned or consumed.
          </Typography>
          <Stack spacing={1}>
            {timers.map((t) => {
              const elapsed = elapsedMap[t.tcId] ?? (Date.now() - t.startedAt);
              const isLong = elapsed > 30 * 60 * 1000;
              return (
                <Box
                  key={t.tcId}
                  sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    p: 1.5, borderRadius: 1.5,
                    bgcolor: isLong ? alpha(theme.palette.error.main, 0.06) : alpha(theme.palette.warning.main, 0.06),
                    border: `1px solid ${isLong ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Science fontSize="small" sx={{ color: isLong ? theme.palette.error.main : theme.palette.warning.main }} />
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{t.chemicalLabel}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Used in: {t.testName}
                      </Typography>
                    </Box>
                  </Stack>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography
                      sx={{
                        fontFamily: '"Roboto Mono", monospace',
                        fontSize: 16,
                        fontWeight: 700,
                        color: isLong ? theme.palette.error.main : theme.palette.warning.main,
                        letterSpacing: 1,
                      }}
                    >
                      {formatMs(elapsed)}
                    </Typography>
                    {isLong && (
                      <Chip label="Long issuance" size="small" color="error" sx={{ height: 20, fontSize: 10 }} />
                    )}
                    <Button
                      size="small"
                      variant="outlined"
                      color="warning"
                      onClick={() => onStop(t.tcId)}
                      sx={{ fontSize: 11, px: 1.5, py: 0.25, minWidth: 60 }}
                    >
                      Stop
                    </Button>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Collapse>
    </Card>
  );
}

export default function WorksheetExecutionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentBranchId } = useUIStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const isAnalyst = ANALYST_ROLES.some((role) =>
    user?.permissions?.some((p) => p.toLowerCase().includes(role))
  );

  const [entries, setEntries] = useState<Record<string, TestCaseEntry>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [stopwatchDialogOpen, setStopwatchDialogOpen] = useState(false);
  const [chemicalTimers, setChemicalTimers] = useState<ChemicalTimer[]>([]);

  const { data: worksheet, isLoading: wsLoading, isError: wsError } = useQuery({
    queryKey: ['worksheet', id],
    queryFn: () => worksheetsApi.getById(Number(id), currentBranchId),
    enabled: !!id,
    retry: false,
  });

  const { data: execData } = useQuery({
    queryKey: ['worksheet-execution', id],
    queryFn: () => worksheetsApi.getExecutionData(Number(id), currentBranchId),
    enabled: !!id,
    retry: false,
  });

  const { data: chemicalsData } = useQuery({
    queryKey: ['chemicals-available', currentBranchId],
    queryFn: () => chemicalsApi.availableInBranch(currentBranchId),
    retry: false,
  });

  const { data: instrumentsData } = useQuery({
    queryKey: ['instruments-active', currentBranchId],
    queryFn: () => instrumentsApi.active(currentBranchId),
    retry: false,
  });

  const chemicals: { id: string; label: string }[] = Array.isArray(chemicalsData)
    ? chemicalsData.map((c: any) => ({
        id: String(c.id ?? c.registrationId),
        label: c.chemical?.name ?? c.name ?? c.casNo ?? `Chemical #${c.id}`,
      }))
    : [
        { id: 'chem-1', label: 'Acetonitrile (HPLC Grade)' },
        { id: 'chem-2', label: 'Methanol (HPLC Grade)' },
        { id: 'chem-3', label: 'Potassium Chloride' },
        { id: 'chem-4', label: 'Hydrochloric Acid 1N' },
        { id: 'chem-5', label: 'Sodium Hydroxide 1N' },
      ];

  const instruments: { id: string; label: string }[] = Array.isArray(instrumentsData)
    ? instrumentsData.map((ins: any) => ({
        id: String(ins.id ?? ins.instrumentId),
        label: ins.name ?? ins.instrumentName ?? `Instrument #${ins.id}`,
      }))
    : [
        { id: 'ins-1', label: 'HPLC-01 (Agilent 1260)' },
        { id: 'ins-2', label: 'pH Meter-02 (Mettler Toledo)' },
        { id: 'ins-3', label: 'KF Titrator-01 (Metrohm)' },
        { id: 'ins-4', label: 'UV-Vis Spectrophotometer-01' },
        { id: 'ins-5', label: 'Incubator-01 (Memmert)' },
      ];

  const testCases = Array.isArray((execData as any)?.testCases) && (execData as any).testCases.length > 0
    ? (execData as any).testCases.map((tc: any) => ({
        id: String(tc.id ?? tc.testCaseId),
        name: tc.name ?? tc.testName ?? 'Test',
        method: tc.method ?? tc.methodReference ?? '—',
        unit: tc.unit ?? '',
        specification: tc.specification ?? tc.acceptanceCriteria ?? '—',
        validationRule: tc.validationRule ?? null,
      }))
    : PLACEHOLDER_TEST_CASES;

  useEffect(() => {
    if (Array.isArray((execData as any)?.testCases)) {
      const prefilled: Record<string, TestCaseEntry> = {};
      const alreadySaved: Record<string, boolean> = {};
      (execData as any).testCases.forEach((tc: any) => {
        const tcId = String(tc.id ?? tc.testCaseId);
        if (tc.resultValue !== undefined && tc.resultValue !== null) {
          prefilled[tcId] = {
            testCaseId: tcId,
            resultValue: String(tc.resultValue),
            chemicalId: String(tc.chemicalId ?? ''),
            instrumentId: String(tc.instrumentId ?? ''),
            comments: tc.comments ?? '',
          };
          alreadySaved[tcId] = true;
        }
      });
      setEntries(prefilled);
      setSaved(alreadySaved);
    }
  }, [execData]);

  const saveFieldMutation = useMutation({
    mutationFn: ({ slotId, data }: { slotId: number; data: unknown }) =>
      worksheetsApi.saveFieldValue(Number(id), slotId, data, currentBranchId),
    onSuccess: (_, variables) => {
      setSaved((prev) => ({ ...prev, [String(variables.slotId)]: true }));
      queryClient.invalidateQueries({ queryKey: ['worksheet-execution', id] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: () => worksheetsApi.submit(Number(id), currentBranchId),
    onSuccess: () => {
      setSubmitDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['worksheet', id] });
    },
  });

  const getEntry = (tcId: string): TestCaseEntry =>
    entries[tcId] ?? { testCaseId: tcId, resultValue: '', chemicalId: '', instrumentId: '', comments: '' };

  const updateEntry = (tcId: string, field: keyof TestCaseEntry, value: string) => {
    setSaved((prev) => ({ ...prev, [tcId]: false }));
    setEntries((prev) => ({ ...prev, [tcId]: { ...getEntry(tcId), [field]: value } }));

    if (field === 'chemicalId') {
      if (value) {
        const testCase = testCases.find((tc: any) => tc.id === tcId);
        const chemical = chemicals.find((c) => c.id === value);
        setChemicalTimers((prev) => {
          const exists = prev.find((t) => t.tcId === tcId);
          if (exists) {
            return prev.map((t) => t.tcId === tcId
              ? { ...t, chemicalLabel: chemical?.label ?? value }
              : t
            );
          }
          return [
            ...prev,
            {
              tcId,
              testName: testCase?.name ?? `Test ${tcId}`,
              chemicalLabel: chemical?.label ?? value,
              startedAt: Date.now(),
            },
          ];
        });
      } else {
        setChemicalTimers((prev) => prev.filter((t) => t.tcId !== tcId));
      }
    }
  };

  const stopChemicalTimer = (tcId: string) => {
    setChemicalTimers((prev) => prev.filter((t) => t.tcId !== tcId));
  };

  const handleSave = (tcId: string) => {
    const entry = getEntry(tcId);
    saveFieldMutation.mutate({
      slotId: Number(tcId.replace('tc-', '')),
      data: {
        resultValue: entry.resultValue,
        chemicalId: entry.chemicalId || null,
        instrumentId: entry.instrumentId || null,
        comments: entry.comments || null,
      },
    });
  };

  const wsData = (worksheet as any) ?? null;
  const wsTitle = wsData?.title ?? wsData?.name ?? `Worksheet #${id}`;
  const wsStatus = wsData?.status ?? 'Draft';
  const wsCode = wsData?.worksheetCode ?? wsData?.code ?? `WS-${id}`;
  const statusCfg = STATUS_CONFIG[wsStatus] ?? { label: wsStatus, color: 'default' as const };
  const canEdit = isAnalyst && !['Approved', 'Rejected', 'Submitted'].includes(wsStatus);

  const oosCount = testCases.filter((tc: any) =>
    evaluateValidation(getEntry(tc.id).resultValue, tc.validationRule) === 'fail'
  ).length;

  const ootCount = testCases.filter((tc: any) =>
    evaluateValidation(getEntry(tc.id).resultValue, tc.validationRule) === 'oot'
  ).length;

  if (wsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate('/worksheets')} size="small" sx={{ color: 'text.secondary' }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap">
            <Typography variant="h5" fontWeight={700}>{wsTitle}</Typography>
            <Chip label={wsCode} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
            <Chip label={statusCfg.label} color={statusCfg.color} size="small" />
            {oosCount > 0 && (
              <Chip label={`${oosCount} OOS`} size="small" color="error" icon={<CancelIcon fontSize="small" />} />
            )}
            {ootCount > 0 && (
              <Chip label={`${ootCount} OOT`} size="small" color="warning" icon={<Warning fontSize="small" />} />
            )}
          </Stack>
          {wsData?.assignedTo && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Assigned to: {wsData.assignedTo?.username ?? wsData.assignedTo}
            </Typography>
          )}
        </Box>
        {canEdit && (
          <Button
            variant="contained"
            startIcon={<Assignment />}
            size="small"
            onClick={() => setSubmitDialogOpen(true)}
            sx={{ flexShrink: 0 }}
          >
            Submit for Review
          </Button>
        )}
        {/* Stopwatch — always available for timing analysis steps */}
        <Tooltip title="Analysis timer">
          <Chip
            icon={<Timer fontSize="small" />}
            label="Timer"
            size="small"
            variant="outlined"
            onClick={() => setStopwatchDialogOpen(true)}
            sx={{ cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}
          />
        </Tooltip>
        <Stopwatch
          dialogMode
          dialogOpen={stopwatchDialogOpen}
          onDialogClose={() => setStopwatchDialogOpen(false)}
          label="Analysis Timer"
        />
      </Stack>

      {wsError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load worksheet details from server. Showing default test cases.
        </Alert>
      )}

      {(oosCount > 0 || ootCount > 0) && (
        <Alert severity={oosCount > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
          {oosCount > 0 && <><strong>{oosCount} out-of-specification (OOS)</strong> result{oosCount > 1 ? 's' : ''} detected. {' '}</>}
          {ootCount > 0 && <><strong>{ootCount} out-of-trend (OOT)</strong> result{ootCount > 1 ? 's' : ''} flagged. {' '}</>}
          OOS/OOT rules are applied automatically from the worksheet template field configuration.
        </Alert>
      )}

      {/* Chemical Issuance Timers */}
      <ChemicalIssuanceTimerPanel timers={chemicalTimers} onStop={stopChemicalTimer} />

      {!canEdit && !wsLoading && (
        <Alert severity="info" icon={<InfoOutlined />} sx={{ mb: 2 }}>
          {['Approved', 'Rejected'].includes(wsStatus)
            ? `This worksheet is ${wsStatus.toLowerCase()} and is read-only.`
            : 'You have view-only access to this worksheet.'}
        </Alert>
      )}

      {/* Test Cases Table */}
      <Card>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ px: 3, py: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" fontWeight={700}>Test Cases</Typography>
                <Typography variant="body2" color="text.secondary">
                  {canEdit
                    ? 'Enter results. Each — placeholder is replaced with an input. OOS/OOT validation rules from the template apply automatically.'
                    : 'Test case results are shown below.'}
                </Typography>
              </Box>
              {(oosCount > 0 || ootCount > 0) && (
                <Stack direction="row" spacing={1}>
                  {oosCount > 0 && <Chip label={`${oosCount} OOS`} color="error" size="small" />}
                  {ootCount > 0 && <Chip label={`${ootCount} OOT`} color="warning" size="small" />}
                </Stack>
              )}
            </Stack>
          </Box>
          <TableContainer component={Paper} elevation={0}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.04) }}>
                  <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Test Name</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 100 }}>Method</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 140 }}>Specification</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>Result (replaces —)</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 80 }}>OOS/OOT</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Science fontSize="small" />
                      <span>Chemical Used</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Build fontSize="small" />
                      <span>Instrument Used</span>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Comments</TableCell>
                  {canEdit && <TableCell sx={{ fontWeight: 700, minWidth: 80 }} align="center">Save</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {testCases.map((tc: any) => {
                  const entry = getEntry(tc.id);
                  const valStatus = evaluateValidation(entry.resultValue, tc.validationRule);
                  const valCfg = valStatus ? VALIDATION_CFG[valStatus] : null;
                  const isSaving = saveFieldMutation.isPending;
                  const isSaved = saved[tc.id];
                  const isDirty = !isSaved && (entry.resultValue || entry.chemicalId || entry.instrumentId || entry.comments);

                  return (
                    <TableRow
                      key={tc.id}
                      sx={{
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                        bgcolor:
                          valStatus === 'fail' ? alpha(theme.palette.error.main, 0.03) :
                          valStatus === 'oot' ? alpha(theme.palette.warning.main, 0.03) :
                          isSaved ? alpha(theme.palette.success.main, 0.03) : 'transparent',
                        transition: 'background-color 0.2s',
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{tc.name}</Typography>
                        {tc.validationRule && (
                          <Typography variant="caption" sx={{ color: theme.palette.warning.main, display: 'block' }}>
                            {tc.validationRule.type === 'range'
                              ? `${tc.validationRule.min}–${tc.validationRule.max} ${tc.unit}`
                              : tc.validationRule.type === 'max'
                                ? `≤ ${tc.validationRule.max} ${tc.unit}`
                                : `≥ ${tc.validationRule.min} ${tc.unit}`}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">{tc.method}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                          {tc.specification}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <TextField
                            size="small"
                            placeholder="—"
                            value={entry.resultValue}
                            onChange={(e) => updateEntry(tc.id, 'resultValue', e.target.value)}
                            InputProps={{
                              endAdornment: tc.unit ? (
                                <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5, whiteSpace: 'nowrap' }}>
                                  {tc.unit}
                                </Typography>
                              ) : undefined,
                            }}
                            sx={{
                              width: 140,
                              '& .MuiOutlinedInput-root fieldset': {
                                borderColor:
                                  valStatus === 'fail' ? theme.palette.error.main :
                                  valStatus === 'oot' ? theme.palette.warning.main : undefined,
                                borderWidth: valStatus ? 2 : 1,
                              },
                            }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: entry.resultValue ? 'text.primary' : 'text.disabled' }}>
                            {entry.resultValue || '—'}
                            {entry.resultValue && tc.unit && (
                              <Typography component="span" variant="caption" color="text.secondary"> {tc.unit}</Typography>
                            )}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {valCfg ? (
                          <Tooltip title={
                            valStatus === 'fail' ? 'OOS — value outside specification limit' :
                            valStatus === 'oot' ? 'OOT — value within trend warning range' :
                            'Result is within specification'
                          }>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ color: valCfg.color }}>
                              {valCfg.icon}
                              <Typography variant="caption" fontWeight={700} sx={{ color: valCfg.color }}>
                                {valCfg.label}
                              </Typography>
                            </Stack>
                          </Tooltip>
                        ) : (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <FormControl size="small" sx={{ width: 190 }}>
                            <InputLabel shrink sx={{ bgcolor: 'background.paper', px: 0.5 }}>Chemical</InputLabel>
                            <Select
                              displayEmpty
                              value={entry.chemicalId}
                              onChange={(e) => updateEntry(tc.id, 'chemicalId', e.target.value)}
                              label="Chemical"
                              renderValue={(val) =>
                                val ? chemicals.find((c) => c.id === val)?.label ?? val : <em style={{ color: '#aaa' }}>— select —</em>
                              }
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {chemicals.map((c) => (
                                <MenuItem key={c.id} value={c.id} sx={{ fontSize: 13 }}>{c.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography variant="body2" sx={{ color: entry.chemicalId ? 'text.primary' : 'text.disabled' }}>
                            {chemicals.find((c) => c.id === entry.chemicalId)?.label ?? '—'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <FormControl size="small" sx={{ width: 190 }}>
                            <InputLabel shrink sx={{ bgcolor: 'background.paper', px: 0.5 }}>Instrument</InputLabel>
                            <Select
                              displayEmpty
                              value={entry.instrumentId}
                              onChange={(e) => updateEntry(tc.id, 'instrumentId', e.target.value)}
                              label="Instrument"
                              renderValue={(val) =>
                                val ? instruments.find((ins) => ins.id === val)?.label ?? val : <em style={{ color: '#aaa' }}>— select —</em>
                              }
                            >
                              <MenuItem value=""><em>None</em></MenuItem>
                              {instruments.map((ins) => (
                                <MenuItem key={ins.id} value={ins.id} sx={{ fontSize: 13 }}>{ins.label}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Typography variant="body2" sx={{ color: entry.instrumentId ? 'text.primary' : 'text.disabled' }}>
                            {instruments.find((ins) => ins.id === entry.instrumentId)?.label ?? '—'}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {canEdit ? (
                          <TextField
                            size="small"
                            placeholder="Optional comments…"
                            multiline minRows={1} maxRows={3}
                            value={entry.comments}
                            onChange={(e) => updateEntry(tc.id, 'comments', e.target.value)}
                            sx={{ width: 190 }}
                          />
                        ) : (
                          <Typography variant="body2" sx={{ color: entry.comments ? 'text.primary' : 'text.disabled', fontSize: 13 }}>
                            {entry.comments || '—'}
                          </Typography>
                        )}
                      </TableCell>
                      {canEdit && (
                        <TableCell align="center">
                          <Tooltip title={isSaved ? 'Saved' : 'Save this row'}>
                            <span>
                              <IconButton
                                size="small"
                                color={isSaved ? 'success' : 'primary'}
                                onClick={() => handleSave(tc.id)}
                                disabled={isSaving || (!isDirty && !isSaved)}
                                sx={{ transition: 'transform 0.15s', '&:not(:disabled):hover': { transform: 'scale(1.15)' } }}
                              >
                                {isSaved ? <CheckCircle fontSize="small" /> : <Save fontSize="small" />}
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {canEdit && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate('/worksheets')}>Back to List</Button>
          <Button
            variant="contained"
            startIcon={<Assignment />}
            onClick={() => setSubmitDialogOpen(true)}
          >
            Submit Worksheet for Review
          </Button>
        </Box>
      )}

      {/* Submit Dialog */}
      <Dialog open={submitDialogOpen} onClose={() => setSubmitDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>Submit Worksheet for Review</DialogTitle>
        <DialogContent>
          {(oosCount > 0 || ootCount > 0) ? (
            <Alert severity={oosCount > 0 ? 'error' : 'warning'} sx={{ mb: 2 }}>
              {oosCount > 0 && `${oosCount} OOS result(s) detected. `}
              {ootCount > 0 && `${ootCount} OOT result(s) flagged. `}
              These will be highlighted for the reviewer.
            </Alert>
          ) : (
            <Alert severity="success" sx={{ mb: 2 }}>
              All validated fields are within specification.
            </Alert>
          )}
          <Typography variant="body2" color="text.secondary">
            Once submitted, this worksheet will be locked and routed for QA review.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={() => setSubmitDialogOpen(false)} variant="outlined">Cancel</Button>
          <Button
            variant="contained"
            startIcon={submitMutation.isPending ? <CircularProgress size={16} /> : <Assignment />}
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
          >
            Confirm Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
