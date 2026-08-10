<?php defined('ALTUMCODE') || die() ?>

<div id="<?= 'biolink_block_id_' . $data->link->biolink_block_id ?>" data-biolink-block-id="<?= $data->link->biolink_block_id ?>" data-biolink-block-type="<?= $data->link->type ?>" class="col-12">
    <?php

    /* Caching */
    $cache_instance = cache()->getItem('biolink_block?block_id=' . $data->link->biolink_block_id . '&type=youtube_feed');

    /* Set cache if not existing */
    if(is_null($cache_instance->get())) {

        $rss = simplexml_load_file('https://www.youtube.com/feeds/videos.xml?channel_id=' . $data->link->settings->channel_id);
        $counter = 0;
        $rss_data = [];

        foreach($rss->entry as $item) {
            $rss_data[] = [
                'title' => (string) $item->title,
                'link' => (string) $item->link->attributes()['href'],
                'image' => (string) $item->children('http://search.yahoo.com/mrss/')->group->thumbnail->attributes()->url,
            ];

            $counter++;
            if($counter >= $data->link->settings->amount) break;
        }

        cache()->save($cache_instance->set($rss_data)->expiresAfter(1800));

    } else {

        $rss_data = $cache_instance->get();

    }

    $counter = 0;
    ?>

    <div class="row">
    <?php foreach($rss_data as $item): ?>
        <div class="col-12 col-lg-<?= ($data->link->settings->columns ?? 1) == 1 ? '12' : '6' ?> py-<?= $data->biolink->settings->block_spacing ?? '2' ?>">
            <a href="<?= $item['link'] . $data->link->utm_query ?>" target="<?= $data->link->settings->open_in_new_tab ? '_blank' : '_self' ?>" class="btn btn-block btn-primary link-btn <?= ($data->biolink->settings->hover_animation ?? 'smooth') != 'false' ? 'link-hover-animation-' . ($data->biolink->settings->hover_animation ?? 'smooth') : null ?> <?= 'link-btn-' . $data->link->settings->border_radius ?> <?= $data->link->design->link_class ?>" style="<?= $data->link->design->link_style ?>" data-text-color data-border-width data-border-radius data-border-style data-border-color data-border-shadow data-animation data-background-color data-text-alignment>
                <div class="link-btn-image-wrapper <?= 'link-btn-' . $data->link->settings->border_radius ?>" <?= $item['image'] ? null : 'style="display: none;"' ?>>
                    <img src="<?= $item['image'] ?>" style="width: auto;height: 100%;" alt="<?= $item['title'] ?>" loading="lazy" />
                </div>

                <span data-name><?= $item['title'] ?></span>
            </a>
        </div>

        <?php
        $counter++;
        if($counter >= $data->link->settings->amount) break;
        ?>
    <?php endforeach ?>
    </div>
</div>

