<?php

namespace App\Bookings\Controllers;

use App\Biolinks\Models\Biolink;
use App\Bookings\Models\BookingMailConnection;
use App\Bookings\Requests\CrupdateBookingMailConnectionRequest;
use App\Bookings\Resources\BookingMailConnectionResource;
use App\Bookings\Support\BookingMailSender;
use App\Bookings\Support\BookingPlanGuard;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\Gate;

class BookingMailConnectionsController extends Controller
{
    public function index(int $biolinkId)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        app(BookingPlanGuard::class)->ensureAllowed($biolink);
        return BookingMailConnectionResource::collection(BookingMailConnection::query()->where('workspace_id', $biolink->workspace_id)->orderBy('name')->get());
    }

    public function store(int $biolinkId, CrupdateBookingMailConnectionRequest $request)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        app(BookingPlanGuard::class)->ensureAllowed($biolink, 'booking_email_limit');
        $data = $request->validated();
        $connection = BookingMailConnection::query()->create([
            ...$data,
            'workspace_id' => $biolink->workspace_id,
        ]);
        return new BookingMailConnectionResource($connection);
    }

    public function update(int $biolinkId, int $connectionId, CrupdateBookingMailConnectionRequest $request)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        app(BookingPlanGuard::class)->ensureAllowed($biolink, 'booking_email_limit');
        $connection = BookingMailConnection::query()->where('workspace_id', $biolink->workspace_id)->findOrFail($connectionId);
        $data = $request->validated();
        if (!array_key_exists('credentials', $data)) {
            unset($data['credentials']);
        }
        $connection->update($data);
        return new BookingMailConnectionResource($connection->fresh());
    }

    public function destroy(int $biolinkId, int $connectionId)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        app(BookingPlanGuard::class)->ensureAllowed($biolink, 'booking_email_limit');
        BookingMailConnection::query()->where('workspace_id', $biolink->workspace_id)->findOrFail($connectionId)->delete();
        return response()->noContent();
    }

    public function test(int $biolinkId, int $connectionId)
    {
        $biolink = $this->authorizeBiolink($biolinkId);
        $connection = BookingMailConnection::query()->where('workspace_id', $biolink->workspace_id)->findOrFail($connectionId);
        $recipient = request()->user()?->email;
        abort_unless($recipient, 422, __('A user email is required to test the connection.'));
        $ok = app(BookingMailSender::class)->testConnection($connection, $recipient);
        abort_unless($ok, 422, __('The email connection test failed.'));
        return response()->json(['ok' => true]);
    }

    private function authorizeBiolink(int $id): Biolink
    {
        $biolink = Biolink::query()->findOrFail($id);
        Gate::authorize('update', $biolink);
        return $biolink;
    }
}
