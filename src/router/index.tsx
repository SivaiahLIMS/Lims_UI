import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import MainLayout from '../layouts/MainLayout';
import LoginPage from '../pages/auth/LoginPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import WorksheetsPage from '../pages/worksheets/WorksheetsPage';
import WorksheetExecutionPage from '../pages/worksheets/WorksheetExecutionPage';
import WorksheetReviewPage from '../pages/worksheets/WorksheetReviewPage';
import DocumentsPage from '../pages/documents/DocumentsPage';
import DocumentDetailPage from '../pages/documents/DocumentDetailPage';
import DocumentExecutionPage from '../pages/documents/DocumentExecutionPage';
import SamplesPage from '../pages/samples/SamplesPage';
import ChemicalsPage from '../pages/chemicals/ChemicalsPage';
import InstrumentsPage from '../pages/instruments/InstrumentsPage';
import DeviationsPage from '../pages/qa/DeviationsPage';
import OOSPage from '../pages/qa/OOSPage';
import CapaPage from '../pages/qa/CapaPage';
import EmployeesPage from '../pages/employees/EmployeesPage';
import UsersPage from '../pages/admin/UsersPage';
import RolesPage from '../pages/admin/RolesPage';
import PermissionsPage from '../pages/admin/PermissionsPage';
import NotFoundPage from '../pages/NotFoundPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth><MainLayout /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'worksheets', element: <WorksheetsPage /> },
      { path: 'worksheets/:id/execute', element: <WorksheetExecutionPage /> },
      { path: 'worksheets/:id/review', element: <WorksheetReviewPage /> },
      { path: 'worksheets/:id', element: <WorksheetExecutionPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'documents/:id', element: <DocumentDetailPage /> },
      { path: 'documents/:docId/executions/:execId', element: <DocumentExecutionPage /> },
      { path: 'samples', element: <SamplesPage /> },
      { path: 'chemicals', element: <ChemicalsPage /> },
      { path: 'instruments', element: <InstrumentsPage /> },
      { path: 'qa/deviations', element: <DeviationsPage /> },
      { path: 'qa/oos', element: <OOSPage /> },
      { path: 'qa/capa', element: <CapaPage /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'admin/users', element: <UsersPage /> },
      { path: 'admin/roles', element: <RolesPage /> },
      { path: 'admin/permissions', element: <PermissionsPage /> },
      { path: 'users', element: <Navigate to="/admin/users" replace /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
