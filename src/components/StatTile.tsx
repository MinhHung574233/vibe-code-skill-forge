import { Card } from './Card';
import { Icon, type IconName } from './Icon';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  icon?: IconName;
  /** CSS colour for the icon only (text keeps full contrast). */
  iconColor?: string;
}

export function StatTile({ label, value, hint, icon, iconColor = 'var(--accent)' }: StatTileProps) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 type-footnote text-muted">
        {icon && (
          <span style={{ color: iconColor }} className="flex">
            <Icon name={icon} size={16} />
          </span>
        )}
        <span>{label}</span>
      </div>
      <p className="type-title-1 tabular-nums">{value}</p>
      {hint && <p className="type-footnote text-muted">{hint}</p>}
    </Card>
  );
}
