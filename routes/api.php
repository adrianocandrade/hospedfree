<?php


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

use App\Blog\Controllers\AdminBlogCategoriesController;
use App\Blog\Controllers\AdminBlogPostsController;
use App\Blog\Controllers\BlogPublicController;
use App\Analytics\Controllers\AdminAnalyticsController;
use App\Http\Controllers\LandingPageController;
use App\Links\Controllers\LinksController;
use App\Folders\Controllers\FolderLinksController;
use App\QrCodes\Controllers\QrCodesController;
use App\Folders\Controllers\FoldersController;
use App\LinkOverlays\Controllers\LinkOverlaysController;
use App\LinkPages\Controllers\LinkPagesController;
use App\Links\Controllers\LinkPasswordController;
use App\Links\Controllers\LinkMetaTagsController;
use App\Mail\Controllers\SendTestEmailController;
use App\Http\Controllers\UsageController;
use App\Analytics\Controllers\TrackedEventsController;
use App\Biolinks\Controllers\BiolinkAppearanceController;
use App\Biolinks\Controllers\AdminBiolinkBadgesController;
use App\Biolinks\Controllers\BiolinkBadgesController;
use App\Biolinks\Controllers\BiolinkContentOrderController;
use App\Biolinks\Controllers\BiolinkLinkController;
use App\Biolinks\Controllers\BiolinkProductsController;
use App\Biolinks\Controllers\BiolinkProductImportPreviewController;
use App\Biolinks\Controllers\BiolinkThemesController;
use App\Biolinks\Controllers\BiolinkThemeImportsController;
use App\Biolinks\Controllers\BiolinksController;
use App\Biolinks\Controllers\BiolinkWidgetSubmissionsController;
use App\Biolinks\Controllers\BiolinkWidgetsController;
use App\Biolinks\Controllers\BiolinkEmbedMetadataController;
use App\Biolinks\Controllers\PublicBiolinkProfileController;
use App\Biolinks\Controllers\PublicBiolinkViewerCountController;
use App\Biolinks\Controllers\PublicBiolinkWidgetEngagementController;
use App\Biolinks\Controllers\PublicBiolinkFeedController;
use App\Biolinks\Controllers\BiolinkAiSuggestionsController;
use App\Bookings\Controllers\BookingAppointmentsController;
use App\Bookings\Controllers\BookingAvailabilityController;
use App\Bookings\Controllers\BookingMailConnectionsController;
use App\Bookings\Controllers\BookingServicesController;
use App\Bookings\Controllers\PublicBookingController;
use App\TrackingPixels\Controllers\TrackingPixelsController;
use App\Webhooks\Controllers\WebhookAttemptsController;
use App\Webhooks\Controllers\WebhooksController;
use App\Tags\Controllers\TagsController;
use Common\Domains\CustomDomainsController;
use Illuminate\Support\Facades\Route;

Route::group(['prefix' => 'v1'], function() {

    // LANDING
    Route::get('landing-page-data', [LandingPageController::class, 'show']);
    Route::get('blog/posts', [BlogPublicController::class, 'apiIndex']);
    Route::get('blog/categories', [BlogPublicController::class, 'apiCategories']);
    Route::get('blog/categories/{categorySlug}/posts', [BlogPublicController::class, 'apiCategory']);
    Route::get('blog/posts/{postSlug}', [BlogPublicController::class, 'apiShow']);
    Route::post('public/biolink/{biolinkId}/widget/{widgetId}/submission', [
        BiolinkWidgetSubmissionsController::class,
        'storePublic',
    ])->middleware('throttle:30,1');
    Route::get('public/biolink/{biolinkId}/viewer-count', PublicBiolinkViewerCountController::class)
        ->middleware('throttle:120,1');
    Route::post('public/biolink/{biolinkId}/widget/{widgetId}/engagement', [
        PublicBiolinkWidgetEngagementController::class,
        'store',
    ])->middleware('throttle:240,1');
    Route::get('public/biolink/{biolinkId}/widget/{widgetId}/discord-presence', [
        PublicBiolinkProfileController::class,
        'discord',
    ])->middleware('throttle:120,1');
    Route::get('public/biolink/{biolinkId}/widget/{widgetId}/steam-profile', [
        PublicBiolinkProfileController::class,
        'steam',
    ])->middleware('throttle:120,1');
    Route::get('public/biolink/{biolinkId}/widget/{widgetId}/feed', PublicBiolinkFeedController::class)
        ->middleware('throttle:60,1');

    // PUBLIC BOOKINGS
    Route::get('public/biolink/{biolinkId}/booking/services', [PublicBookingController::class, 'services'])
        ->defaults('publicBooking', true)
        ->middleware('throttle:120,1');
    Route::get('public/biolink/{biolinkId}/booking/availability', [PublicBookingController::class, 'availability'])
        ->defaults('publicBooking', true)
        ->middleware('throttle:120,1');
    Route::post('public/biolink/{biolinkId}/booking/appointments', [PublicBookingController::class, 'store'])
        ->defaults('publicBooking', true)
        ->middleware('throttle:10,1');
    Route::get('public/booking/{token}', [PublicBookingController::class, 'show'])
        ->defaults('publicBooking', true)
        ->middleware('throttle:60,1');
    Route::post('public/booking/{token}/cancel', [PublicBookingController::class, 'cancel'])
        ->defaults('publicBooking', true)
        ->middleware('throttle:10,1');
    Route::post('public/booking/{token}/reschedule', [PublicBookingController::class, 'reschedule'])
        ->defaults('publicBooking', true)
        ->middleware('throttle:10,1');
    Route::get('public/booking/{token}/calendar.ics', [PublicBookingController::class, 'calendar'])
        ->defaults('publicBooking', true)
        ->middleware('throttle:60,1');

    Route::group(['middleware' => ['optionalAuth:sanctum', 'verified', 'verifyApiAccess']], function () {
        Route::get('tracked-events/report', [TrackedEventsController::class, 'report']);
        Route::get('admin/analytics/cards-data', [AdminAnalyticsController::class, 'cardsData']);
        Route::get('admin/analytics/report', [AdminAnalyticsController::class, 'report']);
        Route::get('tracked-events', [TrackedEventsController::class, 'index']);

        Route::get('usage', UsageController::class);

        // BIOLINK BADGES
        Route::get('badges/catalog', [BiolinkBadgesController::class, 'catalog'])
            ->middleware('auth');
        Route::get('badges/mine', [BiolinkBadgesController::class, 'mine'])
            ->middleware('auth');
        Route::post('badges/{badge}/claim', [BiolinkBadgesController::class, 'claim'])
            ->middleware(['auth', 'throttle:10,1']);
        Route::get('admin/badges', [AdminBiolinkBadgesController::class, 'index']);
        Route::post('admin/badges', [AdminBiolinkBadgesController::class, 'store']);
        Route::put('admin/badges/{badge}', [AdminBiolinkBadgesController::class, 'update']);
        Route::delete('admin/badges/{badge}', [AdminBiolinkBadgesController::class, 'destroy']);
        Route::post('admin/badges/{badge}/grants', [AdminBiolinkBadgesController::class, 'grant']);
        Route::delete('admin/badges/{badge}/grants/{user}', [AdminBiolinkBadgesController::class, 'revoke']);

        // BLOG
        Route::get('admin/blog/posts', [AdminBlogPostsController::class, 'index']);
        Route::post('admin/blog/posts', [AdminBlogPostsController::class, 'store']);
        Route::get('admin/blog/posts/{id}', [AdminBlogPostsController::class, 'show']);
        Route::put('admin/blog/posts/{id}', [AdminBlogPostsController::class, 'update']);
        Route::delete('admin/blog/posts/{id}', [AdminBlogPostsController::class, 'destroy']);
        Route::get('admin/blog/categories', [AdminBlogCategoriesController::class, 'index']);
        Route::post('admin/blog/categories', [AdminBlogCategoriesController::class, 'store']);
        Route::get('admin/blog/categories/{id}', [AdminBlogCategoriesController::class, 'show']);
        Route::put('admin/blog/categories/{id}', [AdminBlogCategoriesController::class, 'update']);
        Route::delete('admin/blog/categories/{id}', [AdminBlogCategoriesController::class, 'destroy']);

        // EMAIL SETTINGS
        Route::post('settings/email/send-test', SendTestEmailController::class)
            ->middleware('throttle:6,1');

        // LINK
        Route::get('links', [LinksController::class, 'index']);
        Route::get('links/{id}', [LinksController::class, 'show']);
        Route::post('links', [LinksController::class, 'store']);
        Route::put('links/{id}', [LinksController::class, 'update']);
        Route::post('links/check-password', LinkPasswordController::class);
        Route::post('links/csv/export', [LinksController::class, 'exportCsv']);
        Route::post('links/bulk', [LinksController::class, 'bulkCreate']);
        Route::put('links/bulk', [LinksController::class, 'bulkUpdate']);
        Route::delete('links/bulk', [LinksController::class, 'bulkDelete']);
        Route::post('links/meta', LinkMetaTagsController::class);

        // FOLDERS
        Route::get('folders', [FoldersController::class, 'index']);
        Route::get('folders/{id}', [FoldersController::class, 'show']);
        Route::post('folders', [FoldersController::class, 'store']);
        Route::put('folders/{id}', [FoldersController::class, 'update']);
        Route::post('folders/{id}/links/attach', [FolderLinksController::class, 'attach']);
        Route::post('folders/{id}/links/detach', [FolderLinksController::class, 'detach']);
        Route::delete('folders/bulk', [FoldersController::class, 'bulkDelete']);
        Route::post('folders/bulk/archive', [FoldersController::class, 'bulkArchive']);
        Route::post('folders/bulk/unarchive', [FoldersController::class, 'bulkUnarchive']);
        Route::post('folders/csv/export', [FoldersController::class, 'exportCsv']);

        // BIOLINKS
        Route::get('biolink/list', [BiolinksController::class, 'list'])->middleware('auth');
        Route::get('biolinks', [BiolinksController::class, 'index']);
        Route::get('biolinks/{id}', [BiolinksController::class, 'show']);
        Route::post('biolinks', [BiolinksController::class, 'store']);
        Route::put('biolinks/{id}', [BiolinksController::class, 'update']);
        Route::delete('biolinks/{id}', [BiolinksController::class, 'destroy']);
        Route::post('biolink/{id}/change-order', [BiolinkContentOrderController::class, 'changeOrder']);
        Route::post('biolink/{id}/appearance', [BiolinkAppearanceController::class, 'update']);
        Route::get('biolink-themes', [BiolinkThemesController::class, 'index']);
        Route::post('biolink-themes', [BiolinkThemesController::class, 'store']);
        Route::put('biolink-themes/{biolinkTheme}', [BiolinkThemesController::class, 'update']);
        Route::delete('biolink-themes/{biolinkTheme}', [BiolinkThemesController::class, 'destroy']);
        Route::post('biolink-themes/{theme}/star', [\App\Http\Controllers\BiolinkThemeStarsController::class, 'store']);
        Route::delete('biolink-themes/{theme}/star', [\App\Http\Controllers\BiolinkThemeStarsController::class, 'destroy']);
        Route::post('biolink/{biolinkId}/themes/{biolinkTheme}/import', [
            BiolinkThemeImportsController::class,
            'store',
        ]);

        // BIOLINK LINKS
        Route::post('biolink/{biolinkId}/link', [BiolinkLinkController::class, 'store']);
        Route::put('biolink/{biolinkId}/link/{id}', [BiolinkLinkController::class, 'update']);
        Route::post('biolink/{biolinkId}/link/{id}/detach', [BiolinkLinkController::class, 'detach']);

        // BIOLINK WIDGETS
        Route::get('biolink/{biolinkId}/products', [BiolinkProductsController::class, 'index']);
        Route::post('biolink/{biolinkId}/products', [BiolinkProductsController::class, 'store']);
        Route::post(
            'biolink/{biolinkId}/products/import-preview',
            BiolinkProductImportPreviewController::class,
        )->middleware('throttle:20,1');
        Route::put('biolink/{biolinkId}/products/{productId}', [BiolinkProductsController::class, 'update']);
        Route::delete('biolink/{biolinkId}/products/{productId}', [BiolinkProductsController::class, 'destroy']);
        Route::post('biolink/{biolinkId}/products/order', [BiolinkProductsController::class, 'reorder']);
        Route::post('biolink/{biolinkId}/widget', [BiolinkWidgetsController::class, 'store']);
        Route::post('biolink/{biolinkId}/ai/suggest', BiolinkAiSuggestionsController::class)
            ->middleware('throttle:20,1');
        Route::put('biolink/{biolinkId}/widget/{widgetId}', [BiolinkWidgetsController::class, 'update']);
        Route::delete('biolink/{biolinkId}/widget/{widgetId}', [BiolinkWidgetsController::class, 'destroy']);
        Route::post('biolink/embed/meta', BiolinkEmbedMetadataController::class)
            ->middleware('throttle:30,1');

        // BOOKINGS
        Route::get('biolink/{biolinkId}/booking/services', [BookingServicesController::class, 'index']);
        Route::post('biolink/{biolinkId}/booking/services', [BookingServicesController::class, 'store']);
        Route::put('biolink/{biolinkId}/booking/services/{serviceId}', [BookingServicesController::class, 'update']);
        Route::delete('biolink/{biolinkId}/booking/services/{serviceId}', [BookingServicesController::class, 'destroy']);
        Route::get('biolink/{biolinkId}/booking/availability', [BookingAvailabilityController::class, 'show']);
        Route::put('biolink/{biolinkId}/booking/availability', [BookingAvailabilityController::class, 'update']);
        Route::get('biolink/{biolinkId}/booking/appointments', [BookingAppointmentsController::class, 'index']);
        Route::get('biolink/{biolinkId}/booking/appointments/{appointmentId}', [BookingAppointmentsController::class, 'show']);
        Route::put('biolink/{biolinkId}/booking/appointments/{appointmentId}', [BookingAppointmentsController::class, 'update']);
        Route::get('biolink/{biolinkId}/booking/mail-connections', [BookingMailConnectionsController::class, 'index']);
        Route::post('biolink/{biolinkId}/booking/mail-connections', [BookingMailConnectionsController::class, 'store']);
        Route::put('biolink/{biolinkId}/booking/mail-connections/{connectionId}', [BookingMailConnectionsController::class, 'update']);
        Route::delete('biolink/{biolinkId}/booking/mail-connections/{connectionId}', [BookingMailConnectionsController::class, 'destroy']);
        Route::post('biolink/{biolinkId}/booking/mail-connections/{connectionId}/test', [BookingMailConnectionsController::class, 'test']);
        Route::get('biolink/{biolinkId}/submissions', [BiolinkWidgetSubmissionsController::class, 'index']);
        Route::get('biolink/{biolinkId}/submissions/{submissionId}', [BiolinkWidgetSubmissionsController::class, 'show']);
        Route::put('biolink/{biolinkId}/submissions/{submissionId}', [BiolinkWidgetSubmissionsController::class, 'update']);
        Route::delete('biolink/{biolinkId}/submissions/{submissionId}', [BiolinkWidgetSubmissionsController::class, 'destroy']);
        Route::post('biolink/{biolinkId}/submissions/export', [BiolinkWidgetSubmissionsController::class, 'exportCsv']);


        // LINK OVERLAY
        Route::get('link-overlays/{id}', [LinkOverlaysController::class, 'show']);
        Route::get('link-overlays', [LinkOverlaysController::class, 'index']);
        Route::post('link-overlays', [LinkOverlaysController::class, 'store']);
        Route::put('link-overlays/{id}', [LinkOverlaysController::class, 'update']);
        Route::delete('link-overlays/bulk', [LinkOverlaysController::class, 'bulkDelete']);
        Route::post('link-overlays/bulk/archive', [LinkOverlaysController::class, 'bulkArchive']);
        Route::post('link-overlays/bulk/unarchive', [LinkOverlaysController::class, 'bulkUnarchive']);

        // TRACKING PIXEL
        Route::get('tp/{id}', [TrackingPixelsController::class, 'show']);
        Route::get('tp', [TrackingPixelsController::class, 'index']);
        Route::post('tp', [TrackingPixelsController::class, 'store']);
        Route::put('tp/{id}', [TrackingPixelsController::class, 'update']);
        Route::delete('tp/bulk', [TrackingPixelsController::class, 'bulkDelete']);
        Route::post('tp/bulk/archive', [TrackingPixelsController::class, 'bulkArchive']);
        Route::post('tp/bulk/unarchive', [TrackingPixelsController::class, 'bulkUnarchive']);

        // LINK PAGES
        Route::get('link-pages', [LinkPagesController::class, 'index']);
        Route::get('link-pages/{id}', [LinkPagesController::class, 'show']);
        Route::post('link-pages', [LinkPagesController::class, 'store']);
        Route::put('link-pages/{id}', [LinkPagesController::class, 'update']);
        Route::delete('link-pages/bulk', [LinkPagesController::class, 'bulkDelete']);
        Route::post('link-pages/bulk/archive', [LinkPagesController::class, 'bulkArchive']);
        Route::post('link-pages/bulk/unarchive', [LinkPagesController::class, 'bulkUnarchive']);

        // QR CODES
        Route::get('qr-code', [QrCodesController::class, 'index']);
        Route::get('qr-code/{id}', [QrCodesController::class, 'show']);
        Route::post('qr-code', [QrCodesController::class, 'store']);
        Route::put('qr-code/{id}', [QrCodesController::class, 'update']);
        Route::delete('qr-codes/bulk', [QrCodesController::class, 'bulkDelete']);
        Route::post('qr-codes/bulk/archive', [QrCodesController::class, 'bulkArchive']);
        Route::post('qr-codes/bulk/unarchive', [QrCodesController::class, 'bulkUnarchive']);
        Route::post('qr-code/csv/export', [QrCodesController::class, 'exportCsv']);

        // TAGS
        Route::get('tags', [TagsController::class, 'index']);
        Route::post('tags', [TagsController::class, 'store']);
        Route::put('tags/{id}', [TagsController::class, 'update']);
        Route::delete('tags/bulk', [TagsController::class, 'bulkDelete']);

        // CUSTOM DOMAINS
        Route::get('custom-domains', [CustomDomainsController::class, 'index']);
        Route::get('custom-domains/{id}', [CustomDomainsController::class, 'show']);
        Route::post('custom-domains', [CustomDomainsController::class, 'store']);
        Route::put('custom-domains/{id}', [CustomDomainsController::class, 'update']);
        Route::delete('custom-domains/{id}', [CustomDomainsController::class, 'destroy']);
        Route::post('custom-domains/{id}/archive', [CustomDomainsController::class, 'archive']);
        Route::post('custom-domains/{id}/unarchive', [CustomDomainsController::class, 'unarchive']);

        // WEBHOOKS
        Route::get('webhooks', [WebhooksController::class, 'index']);
        Route::post('webhooks', [WebhooksController::class, 'store']);
        Route::get('webhooks/{id}', [WebhooksController::class, 'show']);
        Route::put('webhooks/{id}', [WebhooksController::class, 'update']);
        Route::delete('webhooks/{id}', [WebhooksController::class, 'destroy']);
        Route::get('webhooks/{id}/attempts', [WebhookAttemptsController::class, 'index']);
        Route::get('webhooks/{webhookId}/attempts/{attemptId}', [WebhookAttemptsController::class, 'show']);
        Route::post('webhooks/{id}/send-test-event', [
            WebhooksController::class,
            'sendTestEvent',
        ]);
        Route::post('webhooks/{id}/enable', [WebhooksController::class, 'enable']);
        Route::post('webhooks/{id}/disable', [WebhooksController::class, 'disable']);
    });
});
