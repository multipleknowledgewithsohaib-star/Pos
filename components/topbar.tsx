import { Bell, CircleHelp, Search } from 'lucide-react';

export function Topbar() {
  return (
    <header className="topbar">
      <div className="tenant-filters">
        <label>
          <span>Client</span>
          <select defaultValue="No clients available">
            <option>No clients available</option>
          </select>
        </label>
        <label>
          <span>Branch</span>
          <select defaultValue="No branches available">
            <option>No branches available</option>
          </select>
        </label>
      </div>

      <div className="topbar-actions">
        <button className="topbar-icon" type="button" title="Search">
          <Search className="topbar-icon-svg" />
        </button>
        <button className="topbar-icon topbar-icon-alert" type="button" title="Notifications">
          <Bell className="topbar-icon-svg" />
          <span>0</span>
        </button>
        <button className="topbar-icon" type="button" title="Help">
          <CircleHelp className="topbar-icon-svg" />
        </button>
        <div className="profile-menu">
          <div className="avatar">U</div>
          <div>
            <strong>User</strong>
            <span>Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
