<?php

namespace App\Providers;

use App\Blog\Models\BlogCategory;
use App\Blog\Models\BlogPost;
use App\Blog\Policies\BlogCategoryPolicy;
use App\Blog\Policies\BlogPostPolicy;
use App\Core\UrlGenerator;
use App\Actions\AppBootstrapData;
use App\Demo\Console\ResetDemoSite;
use App\Demo\Console\SeedDemoData;
use App\Biolinks\Console\DisableExpiredLeapLinks;
use App\Biolinks\Models\Biolink;
use App\Biolinks\Models\BiolinkWidget;
use App\Links\Models\Link;
use App\Folders\Models\Folder;
use App\LinkOverlays\Models\LinkOverlay;
use App\LinkPages\Models\LinkPage;
use App\Links\Console\ArchiveExpiredLinkeables;
use App\QrCodes\Models\QrCode;
use App\TrackingPixels\Models\TrackingPixel;
use App\Models\User;
use App\Webhooks\Models\Webhook;
use App\Tags\Models\Tag;
use App\Webhooks\Console\DeleteOldWebhookDeliveries;
use Common\Auth\Events\UserCreated;
use Common\Auth\Models\BaseUser;
use Common\Core\Bootstrap\BootstrapData;
use Common\Core\Contracts\AppUrlGenerator;
use Common\Domains\CustomDomain;
use Common\Pages\CustomPage;
use Common\API\PublicApiDocsFilter;
use Common\Workspaces\Actions\CreateWorkspace;
use Common\Workspaces\Listeners\AttachWorkspaceToUser;
use Dedoc\Scramble\Scramble;
use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Jenssegers\Agent\Agent;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Registered;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\RateLimiter;
use App\Hosting\Contracts\HostingProvider;
use App\Hosting\Contracts\HostingPanelProvider;
use App\Hosting\Contracts\HostingDomainProvider;
use App\Hosting\Contracts\HostingDatabaseProvider;
use App\Hosting\Contracts\HostingFileManagerProvider;
use App\Hosting\Contracts\HostingSslProvider;
use App\Hosting\Contracts\HostingSiteBuilderProvider;
use App\Hosting\Contracts\HostingCertificateInstaller;
use App\Hosting\Contracts\HostingPackageCatalogProvider;
use App\Hosting\Providers\FakeHostingProvider;
use App\Hosting\Providers\FakeHostingCapabilitiesProvider;
use App\Hosting\Providers\AcmeHostingSslProvider;
use App\Hosting\Providers\MofhHostingProvider;
use App\Hosting\Providers\MofhHostingDomainProvider;
use App\Hosting\Providers\MofhHostingDatabaseProvider;
use App\Hosting\Providers\MofhHostingFileManagerProvider;
use App\Hosting\Providers\SiteProHostingSiteBuilderProvider;
use App\Hosting\Providers\MofhHostingPanelProvider;
use App\Hosting\Providers\UnavailableHostingCapabilitiesProvider;
use App\Hosting\Providers\FakeHostingPackageCatalogProvider;
use App\Hosting\Providers\MofhHostingPackageCatalogProvider;
use App\Hosting\Models\HostingAccount;
use App\Hosting\Models\HostingOrder;
use App\Hosting\Policies\HostingAccountPolicy;
use App\Hosting\Policies\HostingOrderPolicy;
use App\Hosting\Console\ProcessHostingMaintenance;
use App\Hosting\Console\SmokeTestHostingIntegrations;
use App\Hosting\Console\PromoteFakeHostingAccountToMofh;
use App\Hosting\Observers\HostingSubscriptionObserver;
use App\Hosting\Models\HostingAccountEvent;
use App\Hosting\Observers\HostingAccountEventObserver;
use Common\Billing\Subscription;
use App\Security\CustomerCommunicationSubscriber;
use App\Security\CustomerSecurityEventSubscriber;
use App\Security\Console\PruneSecurityHistory;

const WORKSPACED_RESOURCES = [
    Link::class,
    Folder::class,
    LinkPage::class,
    Biolink::class,
    LinkOverlay::class,
    TrackingPixel::class,
    CustomDomain::class,
];

const WORKSPACE_HOME_ROUTE = '/dashboard';

class AppServiceProvider extends ServiceProvider
{
    public function boot()
    {
        $this->app->bind(BootstrapData::class, AppBootstrapData::class);

        Relation::morphMap([
            Link::MODEL_TYPE => Link::class,
            Folder::MODEL_TYPE => Folder::class,
            CustomPage::MODEL_TYPE => CustomPage::class,
            LinkPage::MODEL_TYPE => LinkPage::class,
            Biolink::MODEL_TYPE => Biolink::class,
            LinkOverlay::MODEL_TYPE => LinkOverlay::class,
            TrackingPixel::MODEL_TYPE => TrackingPixel::class,
            BiolinkWidget::MODEL_TYPE => BiolinkWidget::class,
            Webhook::MODEL_TYPE => Webhook::class,
            CustomDomain::MODEL_TYPE => CustomDomain::class,
            QrCode::MODEL_TYPE => QrCode::class,
            BaseUser::MODEL_TYPE => User::class,
            Tag::MODEL_TYPE => Tag::class,
            BlogCategory::MODEL_TYPE => BlogCategory::class,
            BlogPost::MODEL_TYPE => BlogPost::class,
        ]);

        Gate::policy(BlogCategory::class, BlogCategoryPolicy::class);
        Gate::policy(BlogPost::class, BlogPostPolicy::class);
        Gate::policy(
            \App\Biolinks\Models\BiolinkTheme::class,
            \App\Policies\BiolinkThemePolicy::class,
        );
        Gate::policy(HostingAccount::class, HostingAccountPolicy::class);
        Gate::policy(HostingOrder::class, HostingOrderPolicy::class);

        RateLimiter::for('hosting-database-create', function (
            Request $request,
        ): Limit {
            $actor = $request->user()?->getAuthIdentifier() ?? $request->ip();
            $account = (string) ($request->route('account') ?? 'unknown');

            return Limit::perMinute(6)->by(
                "hosting-database-create:{$actor}:{$account}",
            );
        });

        RateLimiter::for('hosting-account-lifecycle', function (
            Request $request,
        ): Limit {
            $actor = $request->user()?->getAuthIdentifier() ?? $request->ip();
            $account = (string) ($request->route('account') ?? 'unknown');

            return Limit::perMinute(6)
                ->by("hosting-account-lifecycle:{$actor}:{$account}")
                ->response(
                    fn(Request $request, array $headers) => response()->json(
                        [
                            'message' => __(
                                'Wait a moment before trying another hosting account action.',
                            ),
                        ],
                        429,
                        $headers,
                    ),
                );
        });

        Subscription::observe(HostingSubscriptionObserver::class);
        HostingAccountEvent::observe(HostingAccountEventObserver::class);

        Model::preventLazyLoading(!app()->isProduction());

        Scramble::throwOnError(true);

        Scramble::configure()->withDocumentTransformers(function (
            OpenApi $openApi,
        ) {
            $openApi->secure(SecurityScheme::http('bearer'));
        });

        Scramble::registerApi('internal')->expose(
            ui: '/docs/api-internal',
            document: '/docs/api-internal.json',
        );

        Scramble::registerApi('public')
            ->routes(
                fn(Route $route) => Str::startsWith(
                    $route->uri,
                    config('scramble.api_path', 'api/v1'),
                ) && !PublicApiDocsFilter::shouldExcludeRoute($route),
            )
            ->withDocumentTransformers(function (OpenApi $document) {
                PublicApiDocsFilter::removeExcludedOperations(
                    $document,
                    excludedTags: [
                        'Admin',
                        'Comments',
                        'Followers',
                        'Files',
                        'Reports',
                        'Votes',
                        'PasswordResetLink', // laravel fortify
                    ],
                );
            });
    }

    public function register()
    {
        $this->app->bind(AppUrlGenerator::class, UrlGenerator::class);
        $this->app->bind(HostingProvider::class, function () {
            return match (config('hospedfree.provider.driver', 'fake')) {
                'mofh' => app(MofhHostingProvider::class),
                default => app(FakeHostingProvider::class),
            };
        });
        $this->app->singleton(FakeHostingCapabilitiesProvider::class);
        $this->app->singleton(AcmeHostingSslProvider::class);
        $this->app->singleton(UnavailableHostingCapabilitiesProvider::class);
        $this->app->singleton(MofhHostingDomainProvider::class);
        $this->app->singleton(MofhHostingDatabaseProvider::class);
        $this->app->singleton(MofhHostingFileManagerProvider::class);
        $this->app->singleton(MofhHostingPanelProvider::class);
        $this->app->singleton(SiteProHostingSiteBuilderProvider::class);
        $this->app->singleton(FakeHostingPackageCatalogProvider::class);
        $this->app->singleton(MofhHostingPackageCatalogProvider::class);

        $this->app->bind(HostingPackageCatalogProvider::class, function () {
            return match (config('hospedfree.provider.driver', 'fake')) {
                'mofh' => app(MofhHostingPackageCatalogProvider::class),
                default => app(FakeHostingPackageCatalogProvider::class),
            };
        });

        $this->app->bind(HostingSiteBuilderProvider::class, function () {
            if (config('hospedfree.provider.driver', 'fake') === 'fake') {
                return app(FakeHostingCapabilitiesProvider::class);
            }

            return config('hospedfree.site_builder.enabled') &&
                config('hospedfree.site_builder.provider') === 'sitepro'
                ? app(SiteProHostingSiteBuilderProvider::class)
                : app(UnavailableHostingCapabilitiesProvider::class);
        });

        $this->app->bind(HostingSslProvider::class, function () {
            if (config('hospedfree.provider.driver', 'fake') === 'fake') {
                return app(FakeHostingCapabilitiesProvider::class);
            }

            return config('hospedfree.ssl.provider') === 'acme'
                ? app(AcmeHostingSslProvider::class)
                : app(UnavailableHostingCapabilitiesProvider::class);
        });

        $this->app->bind(HostingDomainProvider::class, function () {
            return match (config('hospedfree.provider.driver', 'fake')) {
                'fake' => app(FakeHostingCapabilitiesProvider::class),
                'mofh' => app(MofhHostingDomainProvider::class),
                default => app(UnavailableHostingCapabilitiesProvider::class),
            };
        });

        $this->app->bind(HostingFileManagerProvider::class, function () {
            return match (config('hospedfree.provider.driver', 'fake')) {
                'fake' => app(FakeHostingCapabilitiesProvider::class),
                'mofh' => app(MofhHostingFileManagerProvider::class),
                default => app(UnavailableHostingCapabilitiesProvider::class),
            };
        });

        $this->app->bind(HostingDatabaseProvider::class, function () {
            return match (config('hospedfree.provider.driver', 'fake')) {
                'fake' => app(FakeHostingCapabilitiesProvider::class),
                'mofh' => app(MofhHostingDatabaseProvider::class),
                default => app(UnavailableHostingCapabilitiesProvider::class),
            };
        });

        $this->app->bind(HostingPanelProvider::class, function () {
            return match (config('hospedfree.provider.driver', 'fake')) {
                'fake' => app(FakeHostingCapabilitiesProvider::class),
                'mofh' => app(MofhHostingPanelProvider::class),
                default => app(UnavailableHostingCapabilitiesProvider::class),
            };
        });

        $this->app->bind(HostingCertificateInstaller::class, function () {
            return match (config('hospedfree.provider.driver', 'fake')) {
                'fake' => app(FakeHostingCapabilitiesProvider::class),
                'mofh' => app(MofhHostingPanelProvider::class),
                default => app(UnavailableHostingCapabilitiesProvider::class),
            };
        });

        Scramble::ignoreDefaultRoutes();

        $this->commands([
            ResetDemoSite::class,
            SeedDemoData::class,
            DeleteOldWebhookDeliveries::class,
            ArchiveExpiredLinkeables::class,
            DisableExpiredLeapLinks::class,
            ProcessHostingMaintenance::class,
            SmokeTestHostingIntegrations::class,
            PromoteFakeHostingAccountToMofh::class,
            PruneSecurityHistory::class,
        ]);

        $this->app->singleton(Agent::class, function () {
            return new Agent();
        });

        Event::listen(Login::class, AttachWorkspaceToUser::class);
        Event::listen(Registered::class, AttachWorkspaceToUser::class);
        Event::subscribe(CustomerCommunicationSubscriber::class);
        Event::subscribe(CustomerSecurityEventSubscriber::class);

        Event::listen(UserCreated::class, function (UserCreated $e) {
            (new CreateWorkspace())->createPersonalWorkspace($e->user);
        });
    }
}
