<?php

use App\Demo\Controllers\DemoLoginController;
use App\Blog\Controllers\BlogPublicController;
use App\Links\Controllers\FallbackRouteController;
use App\Knowledge\Controllers\KnowledgePublicPageController;
use App\Hosting\Controllers\HostingToolLaunchController;
use App\Hosting\Controllers\SiteBuilderPublicPageController;
use App\Links\Controllers\LinkImageController;
use App\Pwa\Controllers\PwaManifestController;
use App\QrCodes\Controllers\QrCodesController;
use Common\Core\Controllers\HomeController;
use Common\Pages\CustomPageController;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;
use Illuminate\Support\Facades\Route;

if (config('app.demo')) {
  Route::post('demo-login', DemoLoginController::class)->withoutMiddleware(VerifyCsrfToken::class);
}

if (config('hospedfree.legacy_links_enabled')) {
  Route::get('qr/{hashOrAlias}', [QrCodesController::class, 'redirectToDestination']);
  Route::get('{linkHash}/img', [LinkImageController::class, 'show']);
}

Route::get('contact', [HomeController::class, 'render']);
Route::get('blog', [BlogPublicController::class, 'index']);
Route::get('blog/categoria/{categorySlug}', [BlogPublicController::class, 'category']);
Route::get('blog/{postSlug}', [BlogPublicController::class, 'show']);
Route::get('faq', [KnowledgePublicPageController::class, 'index']);
Route::get('faq/{article}', [KnowledgePublicPageController::class, 'show']);
Route::get('knowledge', [KnowledgePublicPageController::class, 'index']);
Route::get('knowledge/{article}', [KnowledgePublicPageController::class, 'show']);
Route::get('construtor-de-sites', SiteBuilderPublicPageController::class)->name(
  'hosting.site-builder.public',
);
Route::redirect('criador-de-sites', '/construtor-de-sites', 301);
Route::get('pages/{slugOrId}', [CustomPageController::class, 'show']);
Route::get('forgot-password', [HomeController::class, 'render']);
Route::get('manifest.webmanifest', PwaManifestController::class)->name(
  'pwa.manifest',
);
Route::get('hosting/tool-launch/{ticket}', HostingToolLaunchController::class)
  ->middleware(['auth', 'verified', 'throttle:30,1'])
  ->name('hosting.tools.launch');

// CATCH ALL ROUTES AND REDIRECT TO HOME
Route::fallback(FallbackRouteController::class);
