<?php

namespace App\Services;

use App\Contracts\SummaryFetcher;
use App\Models\YapinetApp;
use App\Services\Adapters\GenericHttpSummaryFetcher;
use App\Services\Adapters\SianggarSummaryFetcher;

/**
 * Maps an app's registry code to the adapter that knows how to fetch its
 * summary. Unknown/new codes fall back to the generic HTTP adapter so a
 * new child app can be onboarded purely through the App Registry (FR-07)
 * before anyone writes a dedicated adapter class for it.
 */
class AppAdapterResolver
{
    /** @var array<string, class-string<SummaryFetcher>> */
    protected array $map = [
        'SNGR' => SianggarSummaryFetcher::class,
    ];

    public function resolve(YapinetApp $app): SummaryFetcher
    {
        $class = $this->map[$app->code] ?? GenericHttpSummaryFetcher::class;

        return app($class);
    }
}
