import Link from 'next/link';
import type { ChangeEvent, ComponentType, KeyboardEvent, ReactNode } from 'react';

type Icon = ComponentType<{ className?: string }>;

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {action ? <div className="page-actions">{action}</div> : null}
    </div>
  );
}
// Reusable UI components for the application
// These components are designed to be flexible and customizable, allowing for consistent styling across the app while also supporting various use cases.
// Each component accepts props that allow for customization of appearance and behavior, making it easy to integrate them into different parts of the application without new components 
export function ButtonLink({
  href,
  children,
  icon: Icon,
  variant = 'primary',
}: {
  href: string;
  children: ReactNode;
  icon?: Icon;
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'success';
}) {
  return (
    <Link className={`button button-${variant}`} href={href}>
      {Icon ? <Icon className="button-icon" /> : null}
      <span>{children}</span>
    </Link>
  );
}

export function IconButton({
  href,
  label,
  icon: Icon,
  tone = 'default',
}: {
  href: string;
  label: string;
  icon: Icon;
  tone?: 'default' | 'danger';
}) {
  return (
    <Link className={`icon-button icon-button-${tone}`} href={href} title={label}>
      <Icon className="icon-button-icon" />
      <span className="sr-only">{label}</span>
    </Link>
  );
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'purple',
  link,
}: {
  label: string;
  value: string | number;
  icon: Icon;
  tone?: 'purple' | 'orange' | 'green' | 'blue' | 'red';
  link?: {
    href: string;
    label: string;
  };
}) {
  return (
    <article className="stat-card">
      <div className={`stat-icon stat-icon-${tone}`}>
        <Icon className="stat-icon-svg" />
      </div>
      <p>{label}</p>
      <strong>{value}</strong>
      {link ? <Link href={link.href}>{link.label}</Link> : null}
    </article>
  );
}

export function StatusBadge({ status }: { status: 'Active' | 'Inactive' }) {
  return <span className={`status-badge status-${status.toLowerCase()}`}>{status}</span>;
}

export function RoleBadge({
  label,
  tone,
}: {
  label: string;
  tone: 'admin' | 'manager' | 'pharmacist' | 'cashier' | 'viewer';
}) {
  return <span className={`role-badge role-${tone}`}>{label}</span>;
}

export function SummaryTile({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string | number;
  icon: Icon;
  tone: 'purple' | 'green' | 'red' | 'blue' | 'orange';
}) {
  return (
    <article className="summary-tile">
      <div className={`summary-icon summary-icon-${tone}`}>
        <Icon className="summary-icon-svg" />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </article>
  );
}

export function SearchBox({
  placeholder = 'Search...',
  value,
  onChange,
  onKeyDown,
}: {
  placeholder?: string;
  value?: string;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="search-box">
      <span className="sr-only">{placeholder}</span>
      <input placeholder={placeholder} value={value} onChange={onChange} onKeyDown={onKeyDown} />
    </label>
  );
}

export function SelectBox({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <label className="select-box">
      <span className="sr-only">{label}</span>
      <select value={value ?? options[0]} onChange={onChange}>
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}