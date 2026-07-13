<?php

namespace App\Contracts;

use App\DTO\SummaryResult;
use App\Models\Unit;
use App\Models\YapinetApp;

/**
 * One adapter per child app (Sianggar, Simaya, Simonik, Simoy, SiHaris,
 * Simonas, ...). Implementations translate that app's real API into the
 * uniform SummaryResult shape the dashboard renders — see Bab 06
 * "Kontrak Integrasi API" in the Yapinet blueprint.
 */
interface SummaryFetcher
{
    public function fetch(YapinetApp $app, ?Unit $unit): SummaryResult;
}
