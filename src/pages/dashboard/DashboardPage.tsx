import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  Divider,
  Stack,
} from '@mui/material';
import {
  Science,
  Assignment,
  Inventory2,
  Build,
  Security,
  People,
  TrendingUp,
  Warning,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../../api/endpoints';
import { useUIStore } from '../../store/uiStore';

interface StatCard {
  id: string;
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  backgroundColor: string;
}

interface ActivityItem {
  id: string;
  title: string;
  time: string;
  icon: React.ReactNode;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

export default function DashboardPage() {
  const { currentBranchId } = useUIStore();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary', currentBranchId],
    queryFn: () => dashboardApi.getSummary(currentBranchId),
    retry: false,
  });

  const s = (summary as Record<string, number> | undefined) ?? {};

  const statCards: StatCard[] = [
    {
      id: '1',
      title: 'Active Worksheets',
      value: s.activeWorksheets ?? 24,
      icon: <Assignment />,
      color: '#1976d2',
      backgroundColor: '#e3f2fd',
    },
    {
      id: '2',
      title: 'Pending Samples',
      value: s.pendingSamples ?? 18,
      icon: <Inventory2 />,
      color: '#d32f2f',
      backgroundColor: '#ffebee',
    },
    {
      id: '3',
      title: 'Chemical Stock',
      value: s.chemicalStock ?? 156,
      icon: <Science />,
      color: '#388e3c',
      backgroundColor: '#e8f5e9',
    },
    {
      id: '4',
      title: 'Instruments',
      value: s.totalInstruments ?? 12,
      icon: <Build />,
      color: '#0277BD',
      backgroundColor: '#e1f5fe',
    },
    {
      id: '5',
      title: 'Open Deviations',
      value: s.openDeviations ?? 5,
      icon: <Warning />,
      color: '#f57c00',
      backgroundColor: '#fff3e0',
    },
    {
      id: '6',
      title: 'Due Trainings',
      value: s.dueTrainings ?? 3,
      icon: <People />,
      color: '#0097a7',
      backgroundColor: '#e0f2f1',
    },
  ];

  const recentActivities: ActivityItem[] = [
    {
      id: '1',
      title: 'Worksheet WS-2024-001 approved by John Smith',
      time: '2 hours ago',
      icon: <TrendingUp />,
    },
    {
      id: '2',
      title: 'Sample batch SM-0156 received and logged',
      time: '4 hours ago',
      icon: <Assignment />,
    },
    {
      id: '3',
      title: 'Instrument calibration completed - HPLC-01',
      time: '1 day ago',
      icon: <Build />,
    },
    {
      id: '4',
      title: 'QA deviation QA-2024-015 raised - Critical',
      time: '1 day ago',
      icon: <Warning />,
    },
    {
      id: '5',
      title: 'New CAPA initiated for deviation QA-2024-012',
      time: '2 days ago',
      icon: <Security />,
    },
  ];

  const upcomingTasks: Task[] = [
    {
      id: '1',
      title: 'Complete testing for Sample SM-0140',
      dueDate: 'Today',
      priority: 'high',
    },
    {
      id: '2',
      title: 'Review CAPA progress report',
      dueDate: 'Tomorrow',
      priority: 'high',
    },
    {
      id: '3',
      title: 'Monthly compliance audit',
      dueDate: 'Jun 10, 2026',
      priority: 'medium',
    },
    {
      id: '4',
      title: 'Update instrument maintenance logs',
      dueDate: 'Jun 15, 2026',
      priority: 'low',
    },
    {
      id: '5',
      title: 'Training session - New QA Procedures',
      dueDate: 'Jun 20, 2026',
      priority: 'medium',
    },
  ];

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return '#d32f2f';
      case 'medium':
        return '#f57c00';
      case 'low':
        return '#388e3c';
      default:
        return '#757575';
    }
  };

  return (
    <Box sx={{ padding: 3 }}>
      {/* Header */}
      <Box sx={{ marginBottom: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, marginBottom: 0.5 }}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="textSecondary">
          {today}
        </Typography>
      </Box>

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ marginBottom: 4 }}>
        {statCards.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={card.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 2,
                  }}
                >
                  <Typography variant="body2" color="textSecondary">
                    {card.title}
                  </Typography>
                  <Avatar
                    sx={{
                      backgroundColor: card.backgroundColor,
                      color: card.color,
                      width: 40,
                      height: 40,
                    }}
                  >
                    {card.icon}
                  </Avatar>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {card.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Recent Activity and Upcoming Tasks */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, marginBottom: 2 }}>
                Recent Activity
              </Typography>
              <Divider sx={{ marginBottom: 2 }} />
              <Stack spacing={2}>
                {recentActivities.map((activity) => (
                  <Box key={activity.id} sx={{ display: 'flex', gap: 2 }}>
                    <Avatar
                      sx={{
                        backgroundColor: '#e3f2fd',
                        color: '#1976d2',
                        width: 40,
                        height: 40,
                        flexShrink: 0,
                      }}
                    >
                      {activity.icon}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{activity.title}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Tasks */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 700, marginBottom: 2 }}>
                Upcoming Tasks
              </Typography>
              <Divider sx={{ marginBottom: 2 }} />
              <Stack spacing={2}>
                {upcomingTasks.map((task) => (
                  <Box key={task.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2">{task.title}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Due: {task.dueDate}
                      </Typography>
                    </Box>
                    <Chip
                      label={task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      size="small"
                      sx={{
                        backgroundColor: getPriorityColor(task.priority),
                        color: 'white',
                        fontWeight: 600,
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
