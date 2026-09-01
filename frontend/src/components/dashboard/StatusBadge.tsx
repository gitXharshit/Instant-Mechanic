import { cn, BOOKING_STATUS_CONFIG, MECHANIC_STATUS_CONFIG } from '@/lib/utils';
import type { BookingStatus, MechanicStatus } from '@/types';

interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: 'sm' | 'md';
}

export function BookingStatusBadge({ status, size = 'md' }: BookingStatusBadgeProps) {
  const config = BOOKING_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bg,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}

interface MechanicStatusBadgeProps {
  status: MechanicStatus;
  size?: 'sm' | 'md';
}

export function MechanicStatusBadge({ status, size = 'md' }: MechanicStatusBadgeProps) {
  const config = MECHANIC_STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        config.bg,
        config.color,
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', config.dot)} />
      {config.label}
    </span>
  );
}
