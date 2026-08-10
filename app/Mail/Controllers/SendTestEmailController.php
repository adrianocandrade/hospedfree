<?php

namespace App\Mail\Controllers;

use App\Mail\Requests\SendTestEmailRequest;
use App\Mail\TestEmailTemplate;
use App\Mail\TestEmailTemplateSender;
use Common\API\ExcludeRoutesFromPublicDocs;
use Common\Core\Demo\BlockedOnDemoSite;
use Illuminate\Routing\Controller;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * @tags Settings, Admin
 */
#[ExcludeRoutesFromPublicDocs]
class SendTestEmailController extends Controller
{
    /**
     * Send an application email template populated with sample data.
     *
     * @operationId sendTestEmail
     */
    #[BlockedOnDemoSite]
    public function __invoke(
        SendTestEmailRequest $request,
        TestEmailTemplateSender $sender,
    ) {
        try {
            $sender->send(
                TestEmailTemplate::from($request->validated('template')),
                $request->validated('recipient'),
                $request->user(),
            );
        } catch (Throwable $e) {
            report($e);

            throw ValidationException::withMessages([
                'email_test' => __(
                    'Could not send the test email. Check the outgoing mail configuration and application logs.',
                ),
            ]);
        }

        return response()->noContent();
    }
}
