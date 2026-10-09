<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/** Upload ikon menu / logo. SVG ditolak karena bisa berisi skrip (rules/security.md §5). */
class UploadController extends Controller
{
    public function image(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:png,jpg,jpeg,webp', 'max:512'],
        ], ['file.mimes' => 'Gunakan gambar PNG, JPG, atau WEBP.', 'file.max' => 'Ukuran gambar maksimal 512 KB.']);

        $path = $request->file('file')->store('uploads', 'public');

        return response()->json(['data' => ['url' => Storage::disk('public')->url($path)]], 201);
    }
}
