@extends('layouts.auth', ['title' => 'Izinkan Akses — Yapinet'])

@section('content')
    <h1>Izinkan Akses</h1>
    <p class="lead">
        <span class="client-name">{{ $client->name }}</span> meminta akses ke akun Yapinet
        <strong>{{ $user->full_name }}</strong> ({{ $user->primary_email }}).
    </p>

    @if (count($scopes))
        <ul class="scopes">
            @foreach ($scopes as $scope)
                <li>{{ $scope->description }}</li>
            @endforeach
        </ul>
    @endif

    <form method="POST" action="{{ route('passport.authorizations.approve') }}">
        @csrf
        <input type="hidden" name="state" value="{{ $request->query('state') }}">
        <input type="hidden" name="client_id" value="{{ $client->id }}">
        <input type="hidden" name="auth_token" value="{{ $authToken }}">
        <button type="submit">Izinkan</button>
    </form>

    <form method="POST" action="{{ route('passport.authorizations.deny') }}">
        @csrf
        @method('DELETE')
        <input type="hidden" name="state" value="{{ $request->query('state') }}">
        <input type="hidden" name="client_id" value="{{ $client->id }}">
        <input type="hidden" name="auth_token" value="{{ $authToken }}">
        <button type="submit" class="secondary">Tolak</button>
    </form>
@endsection
