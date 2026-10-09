<?php

namespace App\Enums;

enum SummaryStatus: string
{
    case Ok = 'ok';
    case Warning = 'warning';
    case Critical = 'critical';
    case Degraded = 'degraded';
}
