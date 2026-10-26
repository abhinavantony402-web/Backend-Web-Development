# Session Authentication API

Express and Prisma API demonstrating signed-cookie authentication backed by a server-side session store.

## Setup

Copy `.env.example` to `.env`, then replace `COOKIE_SECRET` with a random value of at least 32 characters. For example, use `openssl rand -hex 32`. Keep `.env` out of version control.

```sh
npm install
npm run setup
npm run dev
```

`npm run setup` generates the Prisma client, creates the local SQLite database, and seeds the demo user.

Seeded demo account: `sam@example.com` / `SessionDemo!48`.

## Configuration and session storage

- `DATABASE_URL` selects the Prisma database; the example uses local SQLite.
- `COOKIE_SECRET` signs the `sid` cookie and must be at least 32 characters.
- `COOKIE_SECURE=false` permits HTTP during local development. `COOKIE_SECURE=true` enables the `Secure` flag; production always enables it regardless of this setting.
- `SESSION_TTL_MS` controls the session and cookie lifetime in milliseconds (one hour by default).
- `PORT` selects the HTTP port (3000 by default).

The cookie contains only a cryptographically random opaque session ID. The API verifies its signature and resolves it to a user ID in the server-side session store before returning identity data. Passwords and password hashes are never placed in cookies or responses.

The supplied session store is an in-memory `Map` for learning and local execution only. Sessions disappear when the process restarts, and this store is not shared across API instances. Production deployments require a shared expiring store such as Redis.

## Endpoints

- `POST /auth/login` accepts `{ "email": "...", "password": "..." }`, sets a signed `sid` cookie, and returns safe user fields.
- `GET /auth/me` returns the authenticated user's safe identity fields.
- `POST /auth/logout` destroys the current server session when valid and clears the cookie. It always returns `204`.

Unauthenticated requests to `/auth/me` receive the same generic `401` response for missing, invalid, expired, and orphaned sessions. Login uses the same generic `401` for unknown email and incorrect password.

## Verify with curl

Start the server, then log in and save the cookie:

```sh
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"sam@example.com","password":"SessionDemo!48"}' \
  http://localhost:3000/auth/login
```

The response includes `Set-Cookie` with `sid`, `HttpOnly`, and `SameSite=Lax`. Use the saved cookie to retrieve identity:

```sh
curl -i -b cookies.txt http://localhost:3000/auth/me
```

Without a cookie, or with an altered cookie value, `/auth/me` returns `401`:

```sh
curl -i http://localhost:3000/auth/me
```

Log out using the same cookie jar. The response clears `sid`; the old cookie cannot authenticate afterward:

```sh
curl -i -b cookies.txt -c cookies.txt -X POST http://localhost:3000/auth/logout
curl -i -b cookies.txt http://localhost:3000/auth/me
```

In production, `Secure` is always set. Test Secure-cookie transmission over HTTPS; HTTP clients correctly do not send Secure cookies.
