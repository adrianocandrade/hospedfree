<?php

namespace Tests\Unit;

use App\Files\Handlers\OptimizeBiolinkImageUpload;
use Tests\TestCase;

class OptimizeBiolinkImageUploadTest extends TestCase
{
    public function test_png_is_optimized_locally_without_changing_format(): void
    {
        if (!extension_loaded('gd')) {
            $this->markTestSkipped('GD is required for local image optimization.');
        }

        $image = imagecreatetruecolor(2600, 1000);
        $color = imagecolorallocate($image, 37, 99, 235);
        imagefill($image, 0, 0, $color);
        ob_start();
        imagepng($image, null, 0);
        $original = (string) ob_get_clean();
        imagedestroy($image);

        $optimized = app(OptimizeBiolinkImageUpload::class)->optimizeContents(
            $original,
        );

        $this->assertNotNull($optimized);
        $this->assertSame('image/png', $optimized['mime']);
        $this->assertLessThan(strlen($original), strlen($optimized['contents']));
        $dimensions = getimagesizefromstring($optimized['contents']);
        $this->assertLessThanOrEqual(2560, $dimensions[0]);
    }

    public function test_non_image_contents_are_not_rewritten(): void
    {
        $this->assertNull(
            app(OptimizeBiolinkImageUpload::class)->optimizeContents(
                '<html>not an image</html>',
            ),
        );
    }
}
