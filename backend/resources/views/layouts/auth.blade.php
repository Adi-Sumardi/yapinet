<!doctype html>
<html lang="id">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title ?? 'Yapinet' }}</title>
    <style>
        :root { color-scheme: light; }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            min-height: 100svh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f4f6fb;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #14213d;
            padding: 1.5rem;
        }
        .card {
            width: 100%;
            max-width: 380px;
            background: #fff;
            border: 1px solid #e5e9f2;
            border-radius: 16px;
            padding: 2rem 1.75rem;
            box-shadow: 0 10px 30px rgba(20, 33, 61, 0.06);
        }
        h1 { font-size: 1.15rem; font-weight: 700; margin: 0 0 .35rem; }
        p.lead { margin: 0 0 1.5rem; font-size: .875rem; color: #64748b; }
        label { display: block; font-size: .7rem; font-weight: 600; letter-spacing: .03em; text-transform: uppercase; color: #94a3b8; margin-bottom: .35rem; }
        input[type=email], input[type=password] {
            width: 100%; padding: .75rem 1rem; margin-bottom: 1rem;
            border: 1px solid #dfe4ee; border-radius: 10px; font-size: .9rem;
        }
        button {
            width: 100%; padding: .85rem; border: none; border-radius: 10px;
            background: #2f5fd0; color: #fff; font-weight: 600; font-size: .9rem; cursor: pointer;
        }
        button.secondary { background: #f1f4fa; color: #14213d; margin-top: .6rem; }
        .error { background: #fef2f2; color: #b91c1c; font-size: .8rem; padding: .6rem .8rem; border-radius: 8px; margin-bottom: 1rem; }
        .scopes { list-style: none; padding: 0; margin: 0 0 1.5rem; font-size: .85rem; }
        .scopes li { padding: .4rem 0; border-bottom: 1px solid #f1f4fa; }
        .client-name { font-weight: 700; color: #2f5fd0; }
    </style>
</head>
<body>
    <div class="card">
        @yield('content')
    </div>
</body>
</html>
