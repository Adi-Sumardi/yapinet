<?php

namespace App\Services\Adapters;

/**
 * Example of how a child app with real quirks would override the generic
 * contract — Sianggar surfaces both pengajuan anggaran and LPJ as separate
 * counters, so its headline formatting could be customized here once its
 * real API is confirmed. For now it behaves identically to the generic
 * fetcher; replace this comment with real overrides when the Sianggar API
 * contract is finalized.
 */
class SianggarSummaryFetcher extends GenericHttpSummaryFetcher
{
    //
}
