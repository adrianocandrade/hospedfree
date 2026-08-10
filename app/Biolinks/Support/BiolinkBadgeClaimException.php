<?php

namespace App\Biolinks\Support;

use RuntimeException;

class BiolinkBadgeClaimException extends RuntimeException
{
    public function __construct(
        public readonly string $reason,
        public readonly int $status = 422,
    ) {
        parent::__construct($reason);
    }
}
