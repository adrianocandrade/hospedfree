<?php

namespace App\Bookings\Mail;

use App\Bookings\Models\BookingAppointment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BookingAppointmentMailable extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public BookingAppointment $appointment,
        public string $event = 'confirmed',
    ) {}

    public function build(): self
    {
        return $this
            ->subject(__('Booking :event', ['event' => $this->event]))
            ->view('emails.bookings.appointment');
    }
}
