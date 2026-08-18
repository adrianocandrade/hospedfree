<?php

namespace App\Hosting\Data;

final readonly class CreateHostingAccountData
{
    public function __construct(
        public string $domain,
        public string $email,
        public string $password,
        public string $remotePackage,
        public string $idempotencyKey,
    ) {}
}
