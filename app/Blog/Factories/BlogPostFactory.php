<?php

namespace App\Blog\Factories;

use App\Blog\Models\BlogCategory;
use App\Blog\Models\BlogPost;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BlogPostFactory extends Factory
{
    protected $model = BlogPost::class;

    public function definition(): array
    {
        $title = $this->faker->unique()->sentence(5);

        return [
            'blog_category_id' => BlogCategory::factory(),
            'user_id' => User::factory(),
            'title' => $title,
            'slug' => slugify($title),
            'excerpt' => $this->faker->paragraph(),
            'body' => '<p>' . e($this->faker->paragraphs(3, true)) . '</p>',
            'status' => BlogPost::STATUS_DRAFT,
            'published_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ];
    }

    public function published(): static
    {
        return $this->state(fn() => [
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => now()->subDay(),
        ]);
    }

    public function scheduled(): static
    {
        return $this->state(fn() => [
            'status' => BlogPost::STATUS_PUBLISHED,
            'published_at' => now()->addDay(),
        ]);
    }
}
