<?php

namespace App\Biolinks\Controllers;

use App\Biolinks\Actions\GetBiolinkEmbedMetadata;
use Dedoc\Scramble\Attributes\Group;
use Illuminate\Http\Request;
use Illuminate\Routing\Controller;

#[Group('Biolinks', weight: 6)]
class BiolinkEmbedMetadataController extends Controller
{
    /**
     * Resolve a safe rich preview for an external URL.
     *
     * Remote scripts, iframes and provider HTML are never returned.
     *
     * @operationId getBiolinkEmbedMetadata
     */
    public function __invoke(
        Request $request,
        GetBiolinkEmbedMetadata $metadata,
    ) {
        $data = $request->validate([
            'url' => ['required', 'string', 'url:http,https', 'max:1000'],
        ]);

        /**
         * @var array{
         *   url: string,
         *   name: string|null,
         *   description: string|null,
         *   image: string|null,
         *   provider: 'instagram'|'tiktok'|'youtube'|'facebook'|'x'|'linkedin'|'spotify'|'soundcloud'|'other',
         *   domain: string
         * }
         */
        $result = $metadata->execute($data['url']);

        return response()->json($result);
    }
}
