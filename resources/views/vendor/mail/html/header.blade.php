@php
    $mailBranding = app(\Common\Settings\Mail\MailBranding::class);
    $mailLogo = $mailBranding->logo();
    $mailSiteName = $mailBranding->siteName();
@endphp

<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
@if ($mailLogo)
<img
    src="{{ $mailLogo['url'] }}"
    alt="{{ $mailSiteName }}"
    data-mail-brand-logo="true"
    style="max-height: 48px; max-width: 180px;"
>
@else
{{ $slot }}
@endif
</a>
</td>
</tr>
