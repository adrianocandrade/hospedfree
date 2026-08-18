<?php

namespace App\Hosting\Contracts;

use App\Hosting\Data\PanelAccountCredentialsData;
use App\Hosting\Data\ProviderResponse;

interface HostingFileManagerProvider
{
    /** @return ProviderResponse<list<\App\Hosting\Data\HostingFileEntryData>> */
    public function listDirectory(PanelAccountCredentialsData $account, string $path): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\HostingFileContentData> */
    public function readFile(PanelAccountCredentialsData $account, string $path): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function writeFile(PanelAccountCredentialsData $account, string $path, string $content): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function createDirectory(PanelAccountCredentialsData $account, string $path): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function rename(PanelAccountCredentialsData $account, string $path, string $newName): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function deletePath(PanelAccountCredentialsData $account, string $path): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function chmod(PanelAccountCredentialsData $account, string $path, string $permissions): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function copy(PanelAccountCredentialsData $account, string $source, string $destination): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function move(PanelAccountCredentialsData $account, string $source, string $destination): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function archive(PanelAccountCredentialsData $account, array $paths, string $destination): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function extract(PanelAccountCredentialsData $account, string $archive, string $destination): ProviderResponse;

    /** @return ProviderResponse<bool> */
    public function upload(PanelAccountCredentialsData $account, string $path, string $localFile): ProviderResponse;

    /** @return ProviderResponse<\App\Hosting\Data\HostingFileContentData> */
    public function download(PanelAccountCredentialsData $account, string $path): ProviderResponse;
}
