<?php

namespace App\Hosting\Data;

final readonly class ProviderResult
{
    /**
     * @param array<string, string> $toolLinks
     */
    public function __construct(
        public bool $success,
        public bool $retryable = false,
        public string $code = 'ok',
        public string $message = 'Operation completed.',
        public ?string $remoteAccountId = null,
        public ?string $status = null,
        public ?string $username = null,
        public ?string $controlPanelUrl = null,
        public ?string $webftpUrl = null,
        public ?string $installerUrl = null,
        public ?string $ftpHost = null,
        public ?string $sqlHost = null,
        public array $toolLinks = [],
    ) {}

    public static function ok(
        string $message = 'Operation completed.',
        ?string $remoteAccountId = null,
        ?string $status = null,
        ?string $username = null,
        ?string $controlPanelUrl = null,
        ?string $webftpUrl = null,
        ?string $installerUrl = null,
        ?string $ftpHost = null,
        ?string $sqlHost = null,
        array $toolLinks = [],
    ): self {
        return new self(
            success: true,
            message: $message,
            remoteAccountId: $remoteAccountId,
            status: $status,
            username: $username,
            controlPanelUrl: $controlPanelUrl,
            webftpUrl: $webftpUrl,
            installerUrl: $installerUrl,
            ftpHost: $ftpHost,
            sqlHost: $sqlHost,
            toolLinks: $toolLinks,
        );
    }

    public static function failure(
        string $code,
        string $message,
        bool $retryable = false,
    ): self {
        return new self(
            success: false,
            retryable: $retryable,
            code: $code,
            message: $message,
        );
    }
}
