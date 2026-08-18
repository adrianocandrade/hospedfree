<?php

namespace App\Security\Controllers;

use App\Security\Models\CustomerCommunication;
use App\Security\Resources\CustomerCommunicationResource;
use Common\API\ExcludeRoutesFromPublicDocs;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/** @tags Account */
#[ExcludeRoutesFromPublicDocs]
class CustomerCommunicationsController
{
    /** @operationId listCustomerCommunications */
    public function __invoke(Request $request): AnonymousResourceCollection
    {
        return CustomerCommunicationResource::collection(
            CustomerCommunication::query()
                ->where('user_id', $request->user()->id)
                ->latest()
                ->paginate(20),
        );
    }
}
