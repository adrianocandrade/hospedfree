<?php

namespace App\Security\Controllers;

use App\Security\Models\CustomerSecurityEvent;
use App\Security\Resources\CustomerSecurityEventResource;
use Common\API\ExcludeRoutesFromPublicDocs;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** @tags Account */
#[ExcludeRoutesFromPublicDocs]
class CustomerSecurityEventsController
{
    /** @operationId listCustomerSecurityEvents */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        return CustomerSecurityEventResource::collection(
            CustomerSecurityEvent::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->paginate(20),
        );
    }
}
