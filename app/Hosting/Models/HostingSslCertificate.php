<?php

namespace App\Hosting\Models;

use App\Models\User;
use Common\Workspaces\Models\Workspace;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HostingSslCertificate extends Model
{
    protected $guarded = [];

    protected $hidden = [
        'private_key',
        'csr',
        'certificate',
        'ca_certificate',
    ];

    protected $casts = [
        'dns_validation' => 'array',
        'renewal_dns_validation' => 'array',
        'private_key' => 'encrypted',
        'csr' => 'encrypted',
        'certificate' => 'encrypted',
        'ca_certificate' => 'encrypted',
        'requested_at' => 'datetime',
        'verified_at' => 'datetime',
        'issued_at' => 'datetime',
        'installation_attempted_at' => 'datetime',
        'installed_at' => 'datetime',
        'last_checked_at' => 'datetime',
        'renewal_requested_at' => 'datetime',
        'renewal_retry_after' => 'datetime',
        'last_renewed_at' => 'datetime',
        'valid_until' => 'datetime',
        'revoked_at' => 'datetime',
    ];

    public function account(): BelongsTo
    {
        return $this->belongsTo(HostingAccount::class, 'hosting_account_id');
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function operations(): HasMany
    {
        return $this->hasMany(HostingSslOperation::class, 'hosting_ssl_certificate_id');
    }
}
