<?php

namespace App\Security\Enums;

enum CustomerSecurityEventType: string
{
    case LoginSucceeded = 'login_succeeded';
    case LoginFailed = 'login_failed';
    case Logout = 'logout';
    case PasswordChanged = 'password_changed';
    case EmailChangeRequested = 'email_change_requested';
    case EmailChanged = 'email_changed';
    case EmailChangeCancelled = 'email_change_cancelled';
    case TwoFactorEnabled = 'two_factor_enabled';
    case TwoFactorDisabled = 'two_factor_disabled';
    case AccessTokenCreated = 'access_token_created';
    case AccessTokenRevoked = 'access_token_revoked';
    case OtherSessionsEnded = 'other_sessions_ended';
}
