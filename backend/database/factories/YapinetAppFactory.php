<?php

namespace Database\Factories;

use App\Models\YapinetApp;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/** @extends Factory<YapinetApp> */
class YapinetAppFactory extends Factory
{
    protected $model = YapinetApp::class;

    public function definition(): array
    {
        $slug = Str::slug(fake()->unique()->words(2, true));

        return [
            'code' => Str::upper(Str::substr(str_replace('-', '', $slug), 0, 16)),
            'slug' => $slug,
            'name' => Str::title(str_replace('-', ' ', $slug)),
            'icon_type' => 'initials',
            'icon_text' => Str::upper(Str::substr($slug, 0, 2)),
            'color' => '#3E7CB1',
            'sort_order' => fake()->numberBetween(1, 50),
            'is_active' => true,
            'open_url' => "https://{$slug}.example.com",
            'open_mode' => 'link',
            'summary_url' => "https://{$slug}.example.com/api/integrations/yapinet/summary",
            'auth_type' => 'none',
            'detail_layout' => 'auto',
            'grant_to_all' => true,
        ];
    }

    public function inactive(): static
    {
        return $this->state(['is_active' => false]);
    }

    public function linkOnly(): static
    {
        return $this->state(['summary_url' => null, 'detail_layout' => 'link_only']);
    }
}
