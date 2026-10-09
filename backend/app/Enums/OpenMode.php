<?php

namespace App\Enums;

/** Cara menu dibuka saat user klik "Buka Aplikasi". */
enum OpenMode: string
{
    case Link = 'link';
    case NewTab = 'new_tab';
    case Handoff = 'handoff';
    case OAuth = 'oauth';
}
