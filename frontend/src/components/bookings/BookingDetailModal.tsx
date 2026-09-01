'use client';

import { useState } from 'react';
import { X, Car, User, Wrench, Calendar, PoundSterling, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { BookingStatusBadge } from '@/components/dashboard/StatusBadge';
import { formatCurrency, formatDateTime, SERVICE_LABELS } from '@/lib/utils';
import type { Booking, BookingStatus } from '@/types';

interface BookingDetailModalProps {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => Promise<void>;
}

const STATUS_OPTIONS: { value: BookingStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'ON_THE_WAY', label: 'On The Way' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

function DetailRow({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-2 border-b last:border-0">
      <span className="text-xs text-muted-foreground w-32 shrink-0">{label}</span>
      <span className="text-xs font-medium text-right">{value ?? '—'}</span>
    </div>
  );
}

export function BookingDetailModal({ booking, onClose, onStatusChange }: BookingDetailModalProps) {
  const [updating, setUpdating] = useState(false);
  const [status, setStatus] = useState<BookingStatus>(booking.status);

  const handleStatusUpdate = async (newStatus: BookingStatus) => {
    setUpdating(true);
    setStatus(newStatus);
    try {
      await onStatusChange(booking.id, newStatus);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-card rounded-xl shadow-xl border w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 id="booking-modal-title" className="text-base font-semibold">
              Booking Details
            </h2>
            <p className="text-xs text-muted-foreground font-mono">{booking.bookingNumber}</p>
          </div>
          <div className="flex items-center gap-2">
            <BookingStatusBadge status={status} />
            <button
              onClick={onClose}
              className="rounded-md p-1 hover:bg-muted transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Customer */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Customer</h3>
            </div>
            <DetailRow label="Name" value={booking.customer?.name} />
            <DetailRow label="Email" value={booking.customer?.email} />
            <DetailRow label="Phone" value={booking.customer?.phone} />
          </section>

          {/* Vehicle */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Car className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Vehicle</h3>
            </div>
            <DetailRow
              label="Vehicle"
              value={`${booking.vehicleYear} ${booking.vehicleMake} ${booking.vehicleModel}`}
            />
            <DetailRow label="Plate" value={
              <span className="font-mono">{booking.vehiclePlate}</span>
            } />
          </section>

          {/* Service */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Wrench className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Service</h3>
            </div>
            <DetailRow label="Service" value={SERVICE_LABELS[booking.service]} />
            <DetailRow label="Details" value={booking.serviceDetails} />
            <DetailRow label="Mechanic" value={booking.mechanic?.name ?? 'Unassigned'} />
            <DetailRow
              label="Amount"
              value={
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  {formatCurrency(booking.amount)}
                </span>
              }
            />
          </section>

          {/* Dates */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-semibold">Timeline</h3>
            </div>
            <DetailRow label="Scheduled" value={formatDateTime(booking.scheduledAt)} />
            <DetailRow label="Created" value={formatDateTime(booking.createdAt)} />
            {booking.completedAt && (
              <DetailRow label="Completed" value={formatDateTime(booking.completedAt)} />
            )}
          </section>

          {/* Notes */}
          {booking.notes && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Notes</h3>
              </div>
              <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
                {booking.notes}
              </p>
            </section>
          )}

          {/* Status update */}
          <section className="border-t pt-4">
            <p className="text-sm font-semibold mb-3">Update Status</p>
            <div className="flex items-center gap-3">
              <Select
                value={status}
                onValueChange={(v) => handleStatusUpdate(v as BookingStatus)}
                disabled={updating}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {updating && (
                <span className="text-xs text-muted-foreground animate-pulse">Updating…</span>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Status change will broadcast to all connected dashboards in real time.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
