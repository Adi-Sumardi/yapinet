@extends('layouts.auth', ['title' => 'Masuk — Yapinet'])

@section('content')
    <h1>Masuk ke Yapinet</h1>
    <p class="lead">Diperlukan untuk melanjutkan proses masuk aplikasi.</p>

    @if ($errors->any())
        <div class="error">{{ $errors->first() }}</div>
    @endif

    <form method="POST" action="{{ route('login.attempt') }}">
        @csrf

        <label for="email">Email</label>
        <input type="email" id="email" name="email" value="{{ old('email') }}" required autofocus>

        <label for="password">Password</label>
        <input type="password" id="password" name="password" required>

        <button type="submit">Masuk</button>
    </form>
@endsection
