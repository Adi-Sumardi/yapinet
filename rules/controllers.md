# Controllers

Lokasi: `backend/app/Http/Controllers/`.

## Struktur folder

```
Http/
  Controllers/
    Api/                 ← dipakai SPA (user login)
      AuthController, MeController, MenuController, AppController
    Api/Admin/           ← hanya admin (middleware `admin`)
      AppController, AppConnectionTestController, UserController,
      UserAccessController, SettingController, AuditLogController
    Api/Integration/     ← dipanggil server aplikasi anak
      HandoffController, OAuthUserController
    Web/                 ← halaman Blade (login sesi SSO, consent)
      WebAuthController
  Requests/              ← FormRequest, dikelompokkan sama dengan controller
    Admin/StoreAppRequest.php, Admin/UpdateAppRequest.php, ...
  Resources/             ← API Resource
    MenuItemResource, AppDetailResource, Admin/AppResource, Admin/UserResource, ...
  Middleware/
    EnsureIsAdmin
```

## Aturan

1. **Controller tipis.** Satu method: ambil input tervalidasi → panggil
   service/action → kembalikan Resource. Target ≤ 25 baris per method.
2. **Validasi selalu di FormRequest**, bukan `$request->validate()` di
   controller (kecuali endpoint sangat kecil yang sudah ada). Pesan validasi
   Bahasa Indonesia (`messages()` / `attributes()`).
3. **Otorisasi**:
   - Rute admin: grup middleware `['auth:sanctum', 'admin']`.
   - Akses per aplikasi (user biasa): cek lewat `AppAccessPolicy` / scope
     `visibleTo($user)` — jangan menulis ulang query akses di tiap controller.
   - Admin tidak boleh mengubah/menghapus dirinya sendiri secara berbahaya
     (hapus, cabut admin, nonaktifkan) → cek di FormRequest `authorize()` atau policy.
4. **Respons lewat API Resource.** Jangan `response()->json($model)` mentah.
   Status: `201` untuk create (`->response()->setStatusCode(201)`), `204` untuk delete.
5. **Route model binding** (`{app}`, `{user}`) untuk admin; `{slug}` untuk
   user — resolve via `YapinetApp::active()->where('slug', $slug)->firstOrFail()`.
6. **Logika bisnis di `app/Services` atau `app/Actions`**:
   - `Services/SettingsService` — baca/tulis pengaturan + cache.
   - `Services/AppSummaryFetcher` — panggil URL API, validasi kontrak, normalisasi.
   - `Services/SafeUrlValidator` — cek SSRF (lihat `security.md`).
   - `Services/AuditLogger` — satu pintu menulis audit log.
   - `Actions/GrantDefaultAccess` — auto-grant saat user / menu dibuat.
   - `Actions/ReorderApps`, `Actions/DeleteUser`, …
7. **Transaksi DB** (`DB::transaction`) untuk operasi yang menulis > 1 tabel.
8. **Setiap aksi admin yang mengubah data → audit log** (lewat `AuditLogger`).
9. **Tidak ada pemanggilan API aplikasi anak saat request user**, kecuali:
   tombol Refresh (rate-limited) dan Tes Koneksi admin.
10. **Exception → respons JSON**: biarkan handler Laravel; gunakan
    `abort(403, 'pesan')` / `abort_unless` untuk kasus sederhana.

## Contoh

```php
// Api/Admin/AppController.php
public function store(StoreAppRequest $request, CreateApp $createApp): JsonResponse
{
    $app = $createApp($request->validated(), $request->user());

    return (new AppResource($app))->response()->setStatusCode(201);
}

public function update(UpdateAppRequest $request, YapinetApp $app, UpdateApp $updateApp): AppResource
{
    return new AppResource($updateApp($app, $request->validated(), $request->user()));
}

public function destroy(Request $request, YapinetApp $app, AuditLogger $audit): Response
{
    $app->delete(); // soft delete
    $audit->log($request->user(), 'admin.app_deleted', app: $app);

    return response()->noContent();
}
```

```php
// Requests/Admin/StoreAppRequest.php
public function rules(): array
{
    return [
        'name' => ['required', 'string', 'max:100'],
        'slug' => ['required', 'alpha_dash', 'max:50', Rule::unique('apps')->withoutTrashed()],
        'color' => ['required', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        'icon_type' => ['required', Rule::enum(IconType::class)],
        'icon_text' => ['required_if:icon_type,initials', 'nullable', 'string', 'max:3'],
        'open_url' => ['required', 'url:https'],
        'open_mode' => ['required', Rule::enum(OpenMode::class)],
        'summary_url' => ['nullable', 'url:https', new SafeExternalUrl],
        'auth_type' => ['required', Rule::enum(AuthType::class)],
        'api_key' => ['nullable', 'string', 'max:500'],
        // ...
    ];
}
```
