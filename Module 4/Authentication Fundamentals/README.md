# Authentication Fundamentals Starter

## Setup

```powershell
npm install
Copy-Item .env.example .env
npm run db:push
npm start
```

The SQLite datasource keeps local setup self-contained. Do not commit `.env` or `prisma/dev.db`.

## Endpoints

- `POST /auth/register`
- `POST /auth/login`

Both endpoints accept JSON. Registration requires `name`, `email`, and `password`; login requires `email` and `password`. Emails are trimmed and lowercased before lookup or storage. Passwords are hashed with bcrypt before persistence. Successful responses contain only the user's `id`, `name`, and `email`.

Invalid request fields return `400`, duplicate registration returns `409`, and invalid login credentials return the same generic `401` response whether the email is unknown or the password is incorrect. Set `BCRYPT_COST` in `.env` to a bcrypt cost from 4 through 31; the default is 12.

Example requests:

```powershell
curl.exe -X POST http://localhost:3000/auth/register `
  -H "Content-Type: application/json" `
  -d '{ "name": "Sam", "email": "sam@example.com", "password": "correct horse battery staple" }'

curl.exe -X POST http://localhost:3000/auth/login `
  -H "Content-Type: application/json" `
  -d '{ "email": "sam@example.com", "password": "correct horse battery staple" }'
```
