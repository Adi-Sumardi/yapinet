<?php

namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

/**
 * Menulis file opsi klien MySQL (chmod 600) dari konfigurasi database
 * Laravel, untuk dipakai `mysqldump --defaults-extra-file` di deploy.sh.
 * Diperlukan karena passthru()/exec() dinonaktifkan di PHP Hostinger dan
 * password di .env bisa berisi karakter yang sulit di-parse dari bash.
 */
#[Signature('app:write-db-client-config {path : Lokasi file .cnf yang ditulis}')]
#[Description('Tulis file opsi mysqldump dari config database (untuk backup sebelum migrasi)')]
class WriteDbClientConfig extends Command
{
    public function handle(): int
    {
        $connection = config('database.connections.'.config('database.default'));

        if (! in_array($connection['driver'] ?? null, ['mysql', 'mariadb'], true)) {
            $this->warn('Koneksi database bukan MySQL/MariaDB — backup dilewati.');

            return self::FAILURE;
        }

        $quote = fn ($value) => '"'.addcslashes((string) $value, '\\"').'"';
        $path = $this->argument('path');

        file_put_contents($path, implode("\n", [
            '[client]',
            'user='.$quote($connection['username']),
            'password='.$quote($connection['password']),
            'host='.$quote($connection['host']),
            'port='.$quote($connection['port']),
            '',
        ]));
        chmod($path, 0600);

        // Baris terakhir stdout = nama database, dibaca deploy.sh.
        $this->line($connection['database']);

        return self::SUCCESS;
    }
}
