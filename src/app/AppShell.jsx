import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthContext'
import Icon from '../shared/ui/Icon'
import './shell.css'

const NAV = [
  { to: '/', label: 'Dashboard', icon: 'dashboard', end: true },
  { to: '/menus', label: 'Daily menus', icon: 'menu' },
  { to: '/food-items', label: 'Food items', icon: 'food' },
  { to: '/employees', label: 'Employees', icon: 'users' },
  { to: '/reports', label: 'Reports', icon: 'report' },
]

export default function AppShell() {
  const { user, logout } = useAuth()
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span className="brand-name">FoodHub</span>
          <span className="brand-tag">Admin</span>
        </div>

        <nav className="nav" aria-label="Main">
          {NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="who">
            <span className="avatar" aria-hidden="true">{user.name.slice(0, 1).toUpperCase()}</span>
            <span className="who-text"><strong>{user.name}</strong><small>Administrator</small></span>
          </div>
          <button className="signout" onClick={logout} aria-label="Sign out" title="Sign out"><Icon name="logout" /></button>
        </div>
      </aside>

      <main className="content">
        <div className="content-inner"><Outlet /></div>
      </main>
    </div>
  )
}
