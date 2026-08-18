<?php

namespace App\Hosting\Providers\VistaPanel;

use RuntimeException;

final class VistaPanelException extends RuntimeException
{
    public function __construct(
        string $safeCode,
        public readonly bool $retryable = false,
    ) {
        parent::__construct($safeCode);
    }
}
