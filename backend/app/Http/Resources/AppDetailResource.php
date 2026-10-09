<?php

namespace App\Http\Resources;

use App\Models\YapinetApp;
use Illuminate\Http\Request;

/** @mixin YapinetApp */
class AppDetailResource extends MenuItemResource
{
    public function toArray(Request $request): array
    {
        return parent::toArray($request) + [
            'open_url' => $this->open_url,
            'cards' => SummaryCardResource::collection($this->summaries),
        ];
    }
}
