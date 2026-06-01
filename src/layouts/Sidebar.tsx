import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Collapse, Tooltip, Typography, Divider, Avatar, alpha, useTheme,
} from '@mui/material';
import {
  Dashboard, Science, Assignment, Article, Inventory2, Build,
  Science as ChemIcon, Storage, People, School, Biotech,
  TrendingUp, NotificationsNone, Security, AccountTree,
  ExpandLess, ExpandMore, ChevronLeft, ChevronRight,
  LocalShipping, Compress, Assessment, SmartToy, EditNote,
  Gavel, GroupWork, ReceiptLong, Radar, Shield, AdminPanelSettings,
} from '@mui/icons-material';
import { useUIStore } from '../store/uiStore';
import { useAuthStore } from '../store/authStore';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 64;

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: NavItem[];
  badge?: number;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  {
    id: 'lab', label: 'Laboratory', icon: <Biotech />,
    children: [
      { id: 'worksheets', label: 'Worksheets', icon: <Assignment />, path: '/worksheets' },
      { id: 'documents', label: 'Documents', icon: <Article />, path: '/documents' },
      { id: 'eln', label: 'Electronic Lab Notebook', icon: <EditNote />, path: '/eln' },
      { id: 'samples', label: 'Samples & Tests', icon: <Science />, path: '/samples' },
    ],
  },
  {
    id: 'inventory', label: 'Inventory', icon: <Inventory2 />,
    children: [
      { id: 'chemicals', label: 'Chemicals', icon: <ChemIcon />, path: '/chemicals' },
      { id: 'containers', label: 'Containers', icon: <Compress />, path: '/containers' },
      { id: 'storage', label: 'Storage', icon: <Storage />, path: '/storage' },
    ],
  },
  {
    id: 'instruments', label: 'Instruments', icon: <Build />,
    children: [
      { id: 'instruments-list', label: 'Instruments', icon: <Build />, path: '/instruments' },
      { id: 'calibrations', label: 'Calibrations', icon: <Assessment />, path: '/calibrations' },
    ],
  },
  {
    id: 'qa', label: 'QA / QC', icon: <Security />,
    children: [
      { id: 'deviations', label: 'Deviations', icon: <Gavel />, path: '/qa/deviations' },
      { id: 'oos', label: 'OOS / OOT', icon: <Radar />, path: '/qa/oos' },
      { id: 'capa', label: 'CAPA', icon: <AccountTree />, path: '/qa/capa' },
    ],
  },
  {
    id: 'procurement', label: 'Procurement', icon: <LocalShipping />,
    children: [
      { id: 'order-requests', label: 'Order Requests', icon: <ReceiptLong />, path: '/orders' },
      { id: 'suppliers', label: 'Suppliers', icon: <GroupWork />, path: '/suppliers' },
    ],
  },
  {
    id: 'hr', label: 'Human Resources', icon: <People />,
    children: [
      { id: 'employees', label: 'Employees', icon: <People />, path: '/employees' },
      { id: 'training', label: 'Training', icon: <School />, path: '/training' },
    ],
  },
  { id: 'products', label: 'Products', icon: <Biotech />, path: '/products' },
  { id: 'tasks', label: 'Tasks', icon: <Assignment />, path: '/tasks' },
  {
    id: 'analytics', label: 'Analytics', icon: <TrendingUp />,
    children: [
      { id: 'analytics-main', label: 'Analytics', icon: <TrendingUp />, path: '/analytics' },
      { id: 'ai', label: 'AI Insights', icon: <SmartToy />, path: '/ai' },
    ],
  },
  { id: 'audit', label: 'Audit Trail', icon: <Security />, path: '/audit' },
  {
    id: 'admin', label: 'Administration', icon: <AdminPanelSettings />,
    children: [
      { id: 'admin-users', label: 'User Management', icon: <People />, path: '/admin/users' },
      { id: 'admin-roles', label: 'Roles', icon: <Shield />, path: '/admin/roles' },
      { id: 'admin-permissions', label: 'Permissions', icon: <Security />, path: '/admin/permissions' },
    ],
  },
];

export default function Sidebar() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { user } = useAuthStore();
  const [expanded, setExpanded] = useState<string[]>(['lab', 'inventory']);

  const drawerWidth = sidebarCollapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const toggleExpand = (id: string) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const isActive = (path?: string) => path && location.pathname.startsWith(path);
  const isParentActive = (item: NavItem) =>
    item.children?.some((child) => isActive(child.path));

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const active = isActive(item.path);
    const parentActive = isParentActive(item);
    const isExpanded = expanded.includes(item.id);

    if (hasChildren && sidebarCollapsed) {
      return (
        <Tooltip key={item.id} title={item.label} placement="right">
          <ListItemButton
            onClick={() => toggleSidebar()}
            sx={{
              minHeight: 44,
              justifyContent: 'center',
              px: 1.5,
              mx: 1,
              borderRadius: 1,
              color: parentActive ? theme.palette.primary.main : theme.palette.text.secondary,
              bgcolor: parentActive ? alpha(theme.palette.primary.main, 0.08) : 'transparent',
              '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.06) },
            }}
          >
            <ListItemIcon sx={{ minWidth: 0, color: 'inherit' }}>{item.icon}</ListItemIcon>
          </ListItemButton>
        </Tooltip>
      );
    }

    return (
      <React.Fragment key={item.id}>
        <Tooltip title={sidebarCollapsed ? item.label : ''} placement="right">
          <ListItemButton
            onClick={() => hasChildren ? toggleExpand(item.id) : item.path && navigate(item.path)}
            selected={!!active}
            sx={{
              minHeight: 44,
              pl: depth > 0 ? 4 : 1.5,
              pr: 1.5,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              color: active ? theme.palette.primary.main : parentActive ? theme.palette.primary.light : theme.palette.text.secondary,
              '&.Mui-selected': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                fontWeight: 600,
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.14) },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: sidebarCollapsed ? 0 : 36,
                mr: sidebarCollapsed ? 0 : 1,
                color: 'inherit',
                '& svg': { fontSize: depth > 0 ? 18 : 22 },
              }}
            >
              {item.icon}
            </ListItemIcon>
            {!sidebarCollapsed && (
              <>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: depth > 0 ? 13 : 14,
                    fontWeight: active || parentActive ? 600 : 500,
                    noWrap: true,
                  }}
                />
                {hasChildren && (isExpanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
              </>
            )}
          </ListItemButton>
        </Tooltip>
        {hasChildren && !sidebarCollapsed && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children!.map((child) => renderNavItem(child, depth + 1))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const initials = useMemo(() => {
    const name = user?.username || 'User';
    return name.slice(0, 2).toUpperCase();
  }, [user]);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          borderRight: '1px solid',
          borderColor: 'divider',
          background: `linear-gradient(180deg, #0F4C75 0%, #0A3254 100%)`,
          color: 'white',
          overflow: 'hidden',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          px: sidebarCollapsed ? 1 : 2.5,
          gap: 1.5,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Science sx={{ fontSize: 20, color: '#fff' }} />
        </Box>
        {!sidebarCollapsed && (
          <Box>
            <Typography variant="h6" sx={{ color: '#fff', lineHeight: 1.1, fontWeight: 700, fontSize: 15 }}>
              LabSphere
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              LIMS Platform
            </Typography>
          </Box>
        )}
      </Box>

      {/* Nav */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          pt: 1,
          pb: 1,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.15)', borderRadius: 2 },
          '& .MuiListItemButton-root': { color: 'rgba(255,255,255,0.7)' },
          '& .MuiListItemButton-root.Mui-selected': {
            bgcolor: 'rgba(255,255,255,0.15) !important',
            color: '#fff !important',
          },
          '& .MuiListItemButton-root:hover': {
            bgcolor: 'rgba(255,255,255,0.08) !important',
            color: '#fff !important',
          },
          '& .MuiListItemIcon-root': { color: 'inherit !important' },
          '& .MuiSvgIcon-root': { color: 'inherit' },
        }}
      >
        <List component="nav" disablePadding>
          {NAV_ITEMS.map((item) => renderNavItem(item))}
        </List>
      </Box>

      {/* Footer */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: 1 }}>
        {!sidebarCollapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, mb: 0.5 }}>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'rgba(255,255,255,0.2)', fontSize: 12, fontWeight: 700 }}>
              {initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ color: '#fff', fontSize: 13, fontWeight: 600, noWrap: true }}>
                {user?.username || 'User'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                Tenant #{user?.tenantId}
              </Typography>
            </Box>
          </Box>
        )}
        <Tooltip title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <ListItemButton
            onClick={toggleSidebar}
            sx={{
              borderRadius: 1,
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              color: 'rgba(255,255,255,0.5)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#fff' },
              px: 1.5,
              minHeight: 36,
            }}
          >
            <ListItemIcon sx={{ minWidth: sidebarCollapsed ? 0 : 36, mr: sidebarCollapsed ? 0 : 1, color: 'inherit' }}>
              {sidebarCollapsed ? <ChevronRight fontSize="small" /> : <ChevronLeft fontSize="small" />}
            </ListItemIcon>
            {!sidebarCollapsed && (
              <ListItemText primary="Collapse" primaryTypographyProps={{ fontSize: 12, fontWeight: 500 }} />
            )}
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
}
