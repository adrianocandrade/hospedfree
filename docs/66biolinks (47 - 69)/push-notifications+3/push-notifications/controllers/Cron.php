<?php

/* configuration */
$max_notifications_per_run = settings()->push_notifications->notifications_per_cron ?? 500;
$max_notifications_per_batch = settings()->push_notifications->notifications_per_cron_batch ?? 100;
$max_notifications_per_batch_concurrently = settings()->push_notifications->notifications_per_cron_batch_concurrently ?? 25;

$total_processed = 0;

$vapid_auth = [
    'VAPID' => [
        'subject'    => 'mailto:hey@example.com',
        'publicKey'  => settings()->push_notifications->public_key,
        'privateKey' => settings()->push_notifications->private_key,
    ],
];

$default_options = [
    'TTL'                => 5000,
    'batchSize'          => $max_notifications_per_batch,
    'requestConcurrency' => $max_notifications_per_batch_concurrently,
];

$timeout = 20;

$guzzle_options = [
    \GuzzleHttp\RequestOptions::TIMEOUT          => 8,
    \GuzzleHttp\RequestOptions::CONNECT_TIMEOUT  => 5,
];

/* grab all “processing” notifications */
$push_notifications = db()->where('status', 'processing')->get('push_notifications');

foreach ($push_notifications as $push_notification) {

    if($total_processed >= $max_notifications_per_run) {
        break;
    }

    /* decode subscriber lists */
    $push_notification->push_subscribers_ids = json_decode($push_notification->push_subscribers_ids ?? '[]');
    $push_notification->sent_push_subscribers_ids = json_decode($push_notification->sent_push_subscribers_ids ?? '[]');

    $pending_ids = array_diff(
        $push_notification->push_subscribers_ids,
        $push_notification->sent_push_subscribers_ids
    );

    if(!$pending_ids) {
        db()->where('push_notification_id', $push_notification->push_notification_id)
            ->update('push_notifications', ['status' => 'sent']);
        continue;
    }

    $capacity  = $max_notifications_per_run - $total_processed;
    $batch_ids = array_slice($pending_ids, 0, $capacity);

    /* bulk‑fetch subscribers */
    $subscribers = db()->where('push_subscriber_id', $batch_ids, 'IN')->get('push_subscribers');
    if(!$subscribers) {
        continue;
    }
    $subscribers = array_column($subscribers, null, 'push_subscriber_id');

    /* set up web‑push */
    $web_push = new \Minishlink\WebPush\WebPush($vapid_auth, $default_options, $timeout, $guzzle_options);
    $web_push->setAutomaticPadding(0);
    $web_push->setReuseVAPIDHeaders(true);

    /* Spintax handle */
    $base_title       = html_entity_decode(process_spintax($push_notification->title), ENT_QUOTES, 'UTF-8');
    $base_description = html_entity_decode(process_spintax($push_notification->description), ENT_QUOTES, 'UTF-8');

    $endpoint_map = [];

    foreach ($batch_ids as $subscriber_id) {
        if(!isset($subscribers[$subscriber_id])) {
            continue;
        }

        $subscriber = $subscribers[$subscriber_id];

        $replacers = [
            '{{SUBSCRIBER:CONTINENT_NAME}}'   => get_continent_from_continent_code($subscriber->continent_code),
            '{{SUBSCRIBER:COUNTRY_NAME}}'     => get_country_from_country_code($subscriber->country_code),
            '{{SUBSCRIBER:CITY_NAME}}'        => $subscriber->city_name,
            '{{SUBSCRIBER:DEVICE_TYPE}}'      => l('global.device.' . $subscriber->device_type),
            '{{SUBSCRIBER:OS_NAME}}'          => $subscriber->os_name,
            '{{SUBSCRIBER:BROWSER_NAME}}'     => $subscriber->browser_name,
            '{{SUBSCRIBER:BROWSER_LANGUAGE}}' => get_language_from_locale($subscriber->browser_language),
        ];

        $payload = [
            'title'       => strtr($base_title, $replacers),
            'description' => strtr($base_description, $replacers),
            'url'         => $push_notification->url,
        ];

        if(settings()->push_notifications->icon) {
            $icon = \Altum\Uploads::get_full_url('push_notifications_icon') . settings()->push_notifications->icon;
            $payload['icon']  = $icon;
            $payload['badge'] = $icon;
        }

        $web_push->queueNotification(
            \Minishlink\WebPush\Subscription::create([
                'endpoint'       => $subscriber->endpoint,
                'expirationTime' => null,
                'keys'           => json_decode($subscriber->keys, true),
            ]),
            json_encode($payload)
        );

        $endpoint_map[$subscriber->endpoint] = [
            'push_subscriber_id' => $subscriber_id,
            'user_id'            => $subscriber->user_id,
        ];

        $push_notification->sent_push_subscribers_ids[] = $subscriber_id;
        $total_processed++;
    }

    /* send everything concurrently */
    $web_push->flushPooled(
        function (\Minishlink\WebPush\MessageSentReport $report) use (&$endpoint_map, $push_notification) {

            $endpoint = $report->getRequest()->getUri()->__toString();
            if(!isset($endpoint_map[$endpoint])) {
                return;
            }

            $subscriber_id = $endpoint_map[$endpoint]['push_subscriber_id'];
            $user_id       = $endpoint_map[$endpoint]['user_id'];

            if($report->isSubscriptionExpired()) {
                db()->where('push_subscriber_id', $subscriber_id)->delete('push_subscribers');
                return;
            }

            \Altum\Logger::users(
                $user_id,
                'push_notification.' . $push_notification->push_notification_id . '.sent'
            );
        }
    );

    /* save progress */
    $status_after = count(array_diff($push_notification->push_subscribers_ids, $push_notification->sent_push_subscribers_ids)) ? 'processing' : 'sent';

    db()->where('push_notification_id', $push_notification->push_notification_id)->update('push_notifications', [
        'sent_push_notifications'   => db()->inc(count($batch_ids)),
        'sent_push_subscribers_ids' => json_encode($push_notification->sent_push_subscribers_ids),
        'status'                    => $status_after,
        'last_sent_datetime'        => get_date(),
    ]);
}
