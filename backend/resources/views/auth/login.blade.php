@extends('layouts.auth', ['title' => 'Masuk — Yapinet'])

@section('content')
    <h1>Masuk ke Yapinet</h1>
    <p class="lead">Diperlukan untuk melanjutkan proses masuk aplikasi.</p>

    @if ($errors->any())
        <div class="error">{{ $errors->first() }}</div>
    @endif

    <a class="button" href="{{ route('login.google') }}">Masuk dengan Google</a>
@endsection
