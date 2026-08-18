<?php

namespace App\Hosting\Enums;

enum ProviderOperationStatus: string
{
    case Queued = 'queued';
    case Running = 'running';
    case Succeeded = 'succeeded';
    case RetryableFailed = 'retryable_failed';
    case PermanentFailed = 'permanent_failed';
}
