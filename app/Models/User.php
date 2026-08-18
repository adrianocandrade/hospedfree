<?php

namespace App\Models;

use App\Biolinks\Models\Biolink;
use App\Folders\Models\Folder;
use App\LinkOverlays\Models\LinkOverlay;
use App\LinkPages\Models\LinkPage;
use App\Links\Models\Link;
use App\QrCodes\Models\QrCode;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingOrder;
use App\Support\Models\SupportTicket;
use Common\Auth\Models\BaseUser;
use Common\Domains\CustomDomain;
use Common\Workspaces\Models\Workspace;
use App\TrackingPixels\Models\TrackingPixel;
use App\Biolinks\Models\BiolinkBadgeGrant;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;

class User extends BaseUser
{
    use HasFactory, HasApiTokens;

    protected $hidden = [
        'password',
        'remember_token',
        'pivot',
        'legacy_permissions',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'pending_email_verification_hash',
    ];

    protected $casts = [
        'id' => 'integer',
        'email_verified_at' => 'datetime',
        'unread_notifications_count' => 'integer',
        'pending_email_requested_at' => 'datetime',
    ];

    public function workspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'owner_id');
    }

    public function hostingAccounts(): HasMany
    {
        return $this->hasMany(HostingAccount::class);
    }

    public function hostingOrders(): HasMany
    {
        return $this->hasMany(HostingOrder::class);
    }

    public function supportTickets(): HasMany
    {
        return $this->hasMany(SupportTicket::class);
    }

    public function links(): HasMany
    {
        return $this->hasMany(Link::class);
    }

    public function biolinks(): HasMany
    {
        return $this->hasMany(Biolink::class);
    }

    public function linkOverlays(): HasMany
    {
        return $this->hasMany(LinkOverlay::class);
    }

    public function folders(): HasMany
    {
        return $this->hasMany(Folder::class);
    }

    public function trackingPixels(): HasMany
    {
        return $this->hasMany(TrackingPixel::class);
    }

    public function linkPages(): HasMany
    {
        return $this->hasMany(LinkPage::class);
    }

    public function qrCodes(): HasMany
    {
        return $this->hasMany(QrCode::class);
    }

    public function customDomains(): HasMany
    {
        return $this->hasMany(CustomDomain::class);
    }

    public function badgeGrants(): HasMany
    {
        return $this->hasMany(BiolinkBadgeGrant::class);
    }

    protected static function newFactory()
    {
        return UserFactory::new();
    }
}
