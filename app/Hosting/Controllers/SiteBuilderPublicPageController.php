<?php

namespace App\Hosting\Controllers;

use Common\API\ExcludeRoutesFromPublicDocs;
use Common\Core\Rendering\RendersClientSideApp;
use Illuminate\Routing\Controller;

#[ExcludeRoutesFromPublicDocs]
class SiteBuilderPublicPageController extends Controller
{
    use RendersClientSideApp;

    public function __invoke()
    {
        return $this->clientSideOrPrerenderedResponse([
            'pageName' => 'hosting-site-builder',
        ]);
    }
}
