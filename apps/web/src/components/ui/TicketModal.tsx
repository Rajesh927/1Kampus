import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { RegistrationItem } from '../../types/index.js';
import { Modal } from './Modal.js';
import { Button } from './Button.js';
import { Badge } from './Badge.js';
import { Calendar, MapPin, Clock, Download, Share2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext.js';

interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  registration: RegistrationItem | null;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  onClose,
  registration,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const { info } = useToast();

  useEffect(() => {
    if (registration?.ticket_code) {
      QRCode.toDataURL(registration.ticket_code, {
        width: 240,
        margin: 1.5,
        color: {
          dark: '#111827',
          light: '#FFFFFF',
        },
      })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error('QR code generation error:', err));
    }
  }, [registration]);

  if (!registration || !registration.event) return null;

  const event = registration.event;
  const startDate = new Date(event.start_time).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const startTime = new Date(event.start_time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = `1Kampus-Ticket-${registration.ticket_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    info('Ticket QR Code Downloaded', 'You can present this barcode at the venue check-in desk.');
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`I'm attending "${event.title}" on 1Kampus! Ticket Code: ${registration.ticket_code}`);
      info('Copied Ticket Code', 'Ticket details copied to your clipboard.');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex flex-col items-center text-center">
        {/* Confirmed pill */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-300 font-semibold text-xs mb-3 border border-emerald-300 dark:border-emerald-800/60">
          <img src="/images/1kampus-logo.png" alt="1Kampus logo" className="w-3.5 h-3.5 object-contain rounded-xs" />
          <span>1Kampus Official Admission Pass</span>
        </div>

        <h3 className="font-display font-bold text-xl text-ink dark:text-ink-dark leading-snug px-2">
          {event.title}
        </h3>
        <p className="text-xs text-ink-muted dark:text-ink-dark-muted mt-1 font-medium">{event.organizer_name}</p>

        {/* Digital Ticket Card */}
        <div className="w-full mt-5 bg-gradient-to-b from-surface to-surface-muted dark:from-surface-dark-muted dark:to-surface-dark-subtle border border-border dark:border-border-dark rounded-2xl p-5 shadow-inner relative overflow-hidden">
          {/* Top category & Status */}
          <div className="flex items-center justify-between mb-4">
            <Badge category={event.category} size="sm">{event.category}</Badge>
            <Badge regStatus={registration.registration_status} size="sm">
              {registration.registration_status.toUpperCase()}
            </Badge>
          </div>

          {/* QR Code Container */}
          <div className="my-2 flex flex-col items-center justify-center p-3 bg-white rounded-xl shadow-xs border border-border/80 dark:border-border-dark inline-block mx-auto">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt={`QR Code for ${registration.ticket_code}`} className="w-44 h-44 object-contain rounded-lg" />
            ) : (
              <div className="w-44 h-44 bg-surface-muted animate-pulse rounded-lg flex items-center justify-center text-xs text-ink-faint">
                Generating QR...
              </div>
            )}
            <span className="font-mono text-xs font-bold tracking-wider text-ink mt-2 px-2 py-0.5 bg-surface-subtle rounded border border-border">
              {registration.ticket_code}
            </span>
          </div>

          {/* Event Key Details */}
          <div className="grid grid-cols-2 gap-2.5 mt-4 text-left border-t border-border/80 dark:border-border-dark/80 pt-3">
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted uppercase font-medium block">Date</span>
                <span className="text-xs font-semibold text-ink dark:text-ink-dark">{startDate}</span>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted uppercase font-medium block">Time</span>
                <span className="text-xs font-semibold text-ink dark:text-ink-dark">{startTime}</span>
              </div>
            </div>
            <div className="col-span-2 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
              <div>
                <span className="text-[11px] text-ink-muted dark:text-ink-dark-muted uppercase font-medium block">Venue</span>
                <span className="text-xs font-semibold text-ink dark:text-ink-dark">{event.venue}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 w-full">
          <Button variant="secondary" size="md" className="flex-1" icon={<Share2 className="w-4 h-4" />} onClick={handleShare}>
            Share Code
          </Button>
          <Button variant="primary" size="md" className="flex-1" icon={<Download className="w-4 h-4" />} onClick={handleDownload}>
            Save Ticket
          </Button>
        </div>
      </div>
    </Modal>
  );
};
