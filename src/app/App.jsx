import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../features/auth/AuthContext'
import LoginPage from '../features/auth/LoginPage'
import ProtectedRoute from '../features/auth/ProtectedRoute'
import DashboardPage from '../features/dashboard/DashboardPage'
import EmployeesPage from '../features/employees/EmployeesPage'
import FoodItemsPage from '../features/food-items/FoodItemsPage'
import MenuFormPage from '../features/menus/MenuFormPage'
import MenusPage from '../features/menus/MenusPage'
import ReportsPage from '../features/reports/ReportsPage'
import { ToastProvider } from '../shared/ui/Toast'
import AppShell from './AppShell'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<DashboardPage />} />
              <Route path="menus" element={<MenusPage />} />
              <Route path="menus/new" element={<MenuFormPage />} />
              <Route path="menus/:id" element={<MenuFormPage />} />
              <Route path="food-items" element={<FoodItemsPage />} />
              <Route path="employees" element={<EmployeesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
