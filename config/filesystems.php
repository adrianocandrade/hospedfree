<?php

return [
    'upload_types' => [
        'linkImages' => [
            'handler' => App\Files\Handlers\OptimizeBiolinkImageUpload::class,
            'visibility' => 'public',
            'dont_clean' => true,
            'label' => 'Link images',
            'description' => 'Link and link in bio images uploaded by users.',
            'defaults' => [
                'prefix' => 'link-images',
                'accept' => ['image'],
                'max_file_size' => '2097152', //2mb
            ],
        ],
        'biolinkMedia' => [
            'handler' => App\Files\Handlers\OptimizeBiolinkImageUpload::class,
            'visibility' => 'public',
            'dont_clean' => true,
            'label' => 'Biolink media',
            'description' => 'Images, GIFs and videos used as biolink visual media.',
            'defaults' => [
                'prefix' => 'biolink-media',
                'accept' => ['image', 'video'],
                'max_file_size' => '12582912', //12mb
            ],
        ],
        'biolinkAudio' => [
            'visibility' => 'public',
            'dont_clean' => true,
            'label' => 'Biolink audio',
            'description' => 'Audio files used on biolink public pages.',
            'defaults' => [
                'prefix' => 'biolink-audio',
                'accept' => ['audio'],
                'max_file_size' => '10485760', //10mb
            ],
        ],
        'biolinkDocuments' => [
            'handler' => App\Files\Handlers\ValidateBiolinkDocumentUpload::class,
            'visibility' => 'public',
            'dont_clean' => true,
            'label' => 'Biolink documents',
            'description' => 'Documents shared from biolink widgets.',
            'defaults' => [
                'prefix' => 'biolink-documents',
                'accept' => [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                    '.pdf',
                    '.docx',
                    '.xlsx',
                    '.pptx',
                ],
                'max_file_size' => '10485760', //10mb
            ],
        ],
        'biolinkCursors' => [
            'visibility' => 'public',
            'dont_clean' => true,
            'label' => 'Biolink cursors',
            'description' => 'Small cursor images used on biolink public pages.',
            'defaults' => [
                'prefix' => 'biolink-cursors',
                'accept' => ['image', '.cur'],
                'max_file_size' => '524288', //512kb
            ],
        ],
    ],
];
