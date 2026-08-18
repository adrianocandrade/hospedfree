<?php

namespace App\Hosting\Data;

/**
 * @template T
 */
final readonly class ProviderResponse
{
    /**
     * @param T|null $data
     */
    public function __construct(
        public bool $success,
        public mixed $data = null,
        public bool $retryable = false,
        public string $code = 'ok',
        public string $safeMessage = 'Operation completed.',
    ) {}

    /**
     * @template TValue
     * @param TValue $data
     * @return self<TValue>
     */
    public static function ok(mixed $data, string $safeMessage = 'Operation completed.'): self
    {
        return new self(success: true, data: $data, safeMessage: $safeMessage);
    }

    /**
     * @return self<null>
     */
    public static function failure(string $code, string $safeMessage, bool $retryable = false): self
    {
        return new self(
            success: false,
            retryable: $retryable,
            code: $code,
            safeMessage: $safeMessage,
        );
    }
}
