<?php

namespace App\Enums;

/** Cara Yapinet mengautentikasi diri ke URL API ringkasan aplikasi anak. */
enum AuthType: string
{
    case None = 'none';
    case Bearer = 'bearer';
    case Header = 'header';
}
