<?php

namespace App\Support\Models;

use App\Hosting\Models\HostingAccount;
use App\Models\User;
use App\Support\Enums\SupportTicketStatus;
use Illuminate\Database\Eloquent\Model;
use Common\Workspaces\Models\Workspace;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    protected $guarded = [];

    protected $casts = [
        'status' => SupportTicketStatus::class,
        'last_message_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function hostingAccount(): BelongsTo
    {
        return $this->belongsTo(HostingAccount::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class);
    }
}
