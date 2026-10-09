<?php

namespace App\Services;

use Closure;

/**
 * Mencegah SSRF: URL API ringkasan diisi admin lalu dipanggil dari server,
 * jadi host-nya tidak boleh mengarah ke jaringan internal hosting
 * (rules/security.md §4). IP hasil resolve dikembalikan supaya pemanggil
 * bisa "mengunci" koneksi ke IP itu (cegah DNS rebinding).
 */
class SafeUrlValidator
{
    /** @var Closure(string): list<string> */
    private Closure $resolver;

    public function __construct(?Closure $resolver = null)
    {
        $this->resolver = $resolver ?? fn (string $host): array => $this->resolveDns($host);
    }

    /**
     * @return array{ok: bool, error: ?string, host: ?string, port: ?int, ip: ?string}
     */
    public function check(string $url): array
    {
        $parts = parse_url($url);
        $scheme = strtolower($parts['scheme'] ?? '');
        $host = strtolower($parts['host'] ?? '');

        if (! $host || ! in_array($scheme, ['http', 'https'], true)) {
            return $this->fail('URL tidak valid.');
        }

        $port = $parts['port'] ?? ($scheme === 'https' ? 443 : 80);

        // Development lokal memanggil dev server aplikasi anak di 127.0.0.1.
        if (app()->environment('local')) {
            return ['ok' => true, 'error' => null, 'host' => $host, 'port' => $port, 'ip' => null];
        }

        if ($scheme !== 'https') {
            return $this->fail('URL harus diawali https://.');
        }

        $ips = ($this->resolver)($host);

        if ($ips === []) {
            return $this->fail("Host {$host} tidak ditemukan.");
        }

        foreach ($ips as $ip) {
            if (! filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
                return $this->fail('URL mengarah ke alamat jaringan internal dan tidak diizinkan.');
            }
        }

        return ['ok' => true, 'error' => null, 'host' => $host, 'port' => $port, 'ip' => $ips[0]];
    }

    /** @return list<string> */
    private function resolveDns(string $host): array
    {
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }

        $ips = gethostbynamel($host) ?: [];

        foreach (@dns_get_record($host, DNS_AAAA) ?: [] as $record) {
            $ips[] = $record['ipv6'];
        }

        return array_values(array_unique($ips));
    }

    private function fail(string $error): array
    {
        return ['ok' => false, 'error' => $error, 'host' => null, 'port' => null, 'ip' => null];
    }
}
