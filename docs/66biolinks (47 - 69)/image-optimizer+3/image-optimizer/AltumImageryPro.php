<?php

namespace Altum\Plugin;

defined('ALTUMCODE') || die();

class AltumImageryPro {
    private $api_endpoint = 'https://imagerypro.altumcode.com/';

    public $quality = 70;
    public $api_key = null;
    public $domain = null;
    public $url = null;

    public function __construct($quality = 70) {
        $this->quality = max(1, min(100, (int) $quality));
    }

    public function optimize($source, $destination = '') {
        if(!$this->api_key) {
            error_log('Image optimizer plugin: No API key.');
            return false;
        }

        if(!file_exists($source)) {
            error_log('Image optimizer plugin: file does not exist.');
            return false;
        }

        $mime = mime_content_type($source);
        $allowed_mime_types = ['image/jpg', 'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/avif', 'image/svg+xml'];

        if(!in_array($mime, $allowed_mime_types)) {
            error_log('Image optimizer plugin: file type not supported: ' . $mime);
            return false;
        }

        if(filesize($source) >= 20000000) {
            error_log('Image optimizer plugin: file above 20mb.');
            return false;
        }

        if(empty($destination)) {
            $destination = $source;
        }

        $response = $this->send_optimization_request($source);
        $json_response = json_decode($response, true);

        // Detect API errors or missing fields and return true to skip processing
        if(!$json_response || isset($json_response['error']) || !isset($json_response['optimized_image'])) {
            error_log('[Image Optimizer Plugin][API response issues]: ' . print_r($response, true));
            return false;
        }

        $optimized_image = base64_decode($json_response['optimized_image']);
        file_put_contents($destination, $optimized_image);

        return [
            'original_size' => $json_response['original_size'] ?? null,
            'new_size' => $json_response['new_size'] ?? null,
            'percentage_difference' => $json_response['percentage_difference'] ?? null,
            'optimization_time' => $json_response['optimization_time'] ?? null,
            'format' => $json_response['format'] ?? null
        ];
    }

    private function send_optimization_request($file_path) {
        $curl = curl_init();
        $file = new \CURLFile($file_path, mime_content_type($file_path), basename($file_path));
        $post_fields = [
            'image' => $file,
            'quality' => $this->quality,
            'api_key' => $this->api_key,
            'host' => $this->domain,
            'url' => $this->url,
        ];

        curl_setopt_array($curl, [
            CURLOPT_URL => $this->api_endpoint . "upload?quality=" . $this->quality,
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POSTFIELDS => $post_fields,
            CURLOPT_CONNECTTIMEOUT => 10
        ]);

        $response = curl_exec($curl);

        if(curl_errno($curl)) {
            return json_encode(['error' => 'cURL error: ' . curl_error($curl)]);
        }

        return $response;
    }
}
