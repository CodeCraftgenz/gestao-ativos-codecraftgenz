import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { PrivateRoute } from './components/PrivateRoute';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Devices } from './pages/Devices';
import { Pending } from './pages/Pending';
import { Settings } from './pages/Settings';
import { DeviceDetail } from './pages/DeviceDetail';
import { RegisterDevice } from './pages/RegisterDevice';
import { Plans } from './pages/Plans';
import { Privacy } from './pages/Privacy';
import { Alerts } from './pages/Alerts';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="devices" element={<Devices />} />
            <Route path="devices/:id" element={<DeviceDetail />} />
            <Route path="register" element={<RegisterDevice />} />
            <Route path="pending" element={<Pending />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="plans" element={<Plans />} />
            <Route path="privacy" element={<Privacy />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
