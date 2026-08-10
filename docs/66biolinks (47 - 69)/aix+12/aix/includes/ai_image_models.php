<?php
/*
 * Copyright (c) 2025 AltumCode (https://altumcode.com/)
 *
 * This software is licensed exclusively by AltumCode and is sold only via https://altumcode.com/.
 * Unauthorized distribution, modification, or use of this software without a valid license is not permitted and may be subject to applicable legal actions.
 *
 * 🌍 View all other existing AltumCode projects via https://altumcode.com/
 * 📧 Get in touch for support or general queries via https://altumcode.com/contact
 * 📤 Download the latest version via https://altumcode.com/downloads
 *
 * 🐦 X/Twitter: https://x.com/AltumCode
 * 📘 Facebook: https://facebook.com/altumcode
 * 📸 Instagram: https://instagram.com/altumcode
 */

return [
    'dall-e-3' => [
        'api' => 'openai',
        'name' => 'OpenAI Dall-E 3',
        'max_length' => 4000,
        'sizes' => [
            '1024x1024', '1792x1024', '1024x1792'
        ],
        'variants' => [1]
    ],

    'gpt-image-1' => [
        'api' => 'openai',
        'name' => 'OpenAI GPT Image 1',
        'max_length' => 30000,
        'sizes' => [
            '1024x1024', '1536x1024', '1024x1536'
        ],
        'variants' => [1,2,3,4,5]
    ],
];
