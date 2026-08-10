<?php defined('ALTUMCODE') || die() ?>

<?php
$latitude = $data->link->settings->latitude;
$longitude = $data->link->settings->longitude;

if($data->link->settings->source == 'user_location') {
    /* Detect the location */
    try {
        $maxmind = (get_maxmind_reader_city())->get(get_ip());
    } catch(\Exception $exception) {
        /* :) */
    }
    $latitude = isset($maxmind) && isset($maxmind['location']) ? $maxmind['location']['latitude'] : null;
    $longitude = isset($maxmind) && isset($maxmind['location']) ? $maxmind['location']['longitude'] : null;
}

$weather_result = \Altum\Cache::cache_function_result('weather_' .  $data->link->biolink_block_id, ['user_id=' . $data->link->user_id], function() use ($latitude, $longitude, $data) {
    $forecast = $data->link->settings->display_forecast ? '&daily=temperature_2m_min,temperature_2m_max,weather_code' : null;
    $result = file_get_contents('https://api.open-meteo.com/v1/forecast?latitude=' . $latitude . '&longitude=' . $longitude . '&current=is_day,temperature_2m,weather_code&timezone=auto&temperature_unit=' . $data->link->settings->unit . $forecast);

    return json_decode($result);
}, 3600);

$should_display = (bool) $weather_result;

if($should_display) {
    $weather = [];

    /* Get current temperature */
    $weather['current_temperature_unit'] = $weather_result->current_units->temperature_2m;
    $weather['current_temperature'] = $weather_result->current->temperature_2m;
    $weather['current_weather_code'] = $weather_result->current->weather_code;
    $weather['current_is_day'] = $weather_result->current->is_day;
}

function weather_icon($weather_code, $is_day = 1) {
    return match (true) {

        /* thunderstorms */
        $weather_code >= 95 =>
        $is_day ? 'thunderstorms-day' : 'thunderstorms-night',

        /* drizzle */
        in_array($weather_code, [51, 53, 55], true) =>
        'drizzle',

        /* rain */
        in_array($weather_code, [61, 63, 65, 80, 81, 82], true) =>
        'rain',

        /* snow / sleet */
        in_array($weather_code, [71, 73, 75, 77, 85, 86], true) =>
        'snow',

        in_array($weather_code, [66, 67], true) =>
        'sleet',

        /* atmosphere */
        $weather_code === 45 || $weather_code === 48 =>
        $is_day ? 'fog-day' : 'fog-night',

        /* clear */
        $weather_code === 0 =>
        $is_day ? 'clear-day' : 'clear-night',

        /* partly cloudy */
        $weather_code === 1 || $weather_code === 2 =>
        $is_day ? 'partly-cloudy-day' : 'partly-cloudy-night',

        /* overcast */
        $weather_code === 3 =>
        $is_day ? 'overcast-day' : 'overcast-night',

        default =>
        'cloudy',
    };
}
?>

<?php if($should_display): ?>
<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12 my-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
    <div class="card <?= 'link-btn-' . $data->link->settings->border_radius . ' large' ?>" style="<?= 'border-width: ' . ($data->link->settings->border_width ?? '1') . 'px;' . 'border-color: ' . (empty($data->link->settings->border_color) ? 'transparent' : $data->link->settings->border_color) . ';' . 'border-style: ' . ($data->link->settings->border_style ?? 'solid') . ';' . 'background: ' . ($data->link->settings->background_color ?? 'transparent') . ';' . \Altum\Link::get_processed_box_shadow_style($data->link->settings) ?>" data-border-width data-border-radius data-border-style data-border-color data-border-shadow data-background-color>
        <div class="card-body">

            <div class="d-flex justify-content-between">
                <div class="text-left">
                    <div class="font-size-little-small" style="color: <?= $data->link->settings->description_color ?>;" data-description-color>
                        <i class="fas fa-fw fa-xs fa-map-marker-alt mr-1"></i> <?= $data->link->settings->address ?: $data->link->settings->display_address ?>
                    </div>

                    <div class="text-left mt-1" style="color: <?= $data->link->settings->text_color ?>;" data-text-color>
                        <span class="h2" style="font-weight: 800;"><?= $weather['current_temperature'] . ' ' . $weather['current_temperature_unit'] ?></span>
                    </div>
                </div>

                <div>
                    <img src="<?= ASSETS_FULL_URL . 'images/biolinks/weather/' . weather_icon($weather['current_weather_code'], $weather['current_is_day']) . '.svg' ?>" class="img-fluid weather-big-icon" />
                </div>
            </div>

            <?php if($data->link->settings->display_forecast): ?>
            <div class="row justify-content-between gap-2 mt-3">
                <?php foreach($weather_result->daily->time as $key => $date): ?>
                    <div class="col-auto">
                        <div class="d-flex flex-column align-items-center">
                            <img src="<?= ASSETS_FULL_URL . 'images/biolinks/weather/' . weather_icon($weather_result->daily->weather_code[$key]) . '.svg' ?>" class="img-fluid weather-icon" />

                            <div class="mt-2 mb-2 font-weight-bold small" style="color: <?= $data->link->settings->text_color ?>;" data-text-color>
                                <?= sprintf(l('global.date.short_days.' . ((new \DateTime($date))->format('N')))) ?>
                            </div>

                            <div class="font-size-small mb-1" style="color: <?= $data->link->settings->description_color ?>;" data-description-color><?= $weather_result->daily->temperature_2m_max[$key] ?>&deg;</div>
                            <div class="font-size-small" style="color: <?= $data->link->settings->description_color ?>;" data-description-color><?= $weather_result->daily->temperature_2m_min[$key] ?>&deg;</div>
                        </div>
                    </div>
                <?php endforeach ?>
            </div>
            <?php endif ?>

        </div>
    </div>
</div>
<?php endif ?>

<?php if(!\Altum\Event::exists_content_type_key('head', 'weather')): ?>
    <?php ob_start() ?>
    <style>
        .weather-icon {
            width: 2.5rem;
        }

        .weather-big-icon {
            width: 4.5rem;
        }
    </style>
    <?php \Altum\Event::add_content(ob_get_clean(), 'head', 'weather') ?>
<?php endif ?>
