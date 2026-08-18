<?php

namespace Common\Billing;

use Throwable;

class GatewayException extends \Exception
{
    public function __construct(
        string $message,
        public readonly string $safeCode = 'gateway_operation_failed',
        public readonly bool $retryable = true,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, 0, $previous);
    }
}
