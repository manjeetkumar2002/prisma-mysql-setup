# Node.js + Prisma 6 + MySQL Setup (Windows)

A step-by-step guide to recreate a Node.js project using **Prisma ORM 6**, **MySQL**, and a single `index.js` file for database queries.

> This guide uses Prisma 6 because it supports the straightforward `@prisma/client` + CommonJS (`require`) setup shown here. Keep `prisma` and `@prisma/client` on the same major version.

## 1. Prerequisites

Install these first:

- **Node.js** (LTS recommended): https://nodejs.org/
- **MySQL Server**
- **MySQL Workbench** (optional, useful for running SQL commands)
- **VS Code** (recommended)

Verify Node.js and npm in PowerShell:

```powershell
node --version
npm --version
```

## 2. Create the project

Open PowerShell and run:

```powershell
cd "$HOME\Desktop"
mkdir prisma-mysql-project
cd prisma-mysql-project

npm init -y
npm install -D prisma@6
npm install @prisma/client@6 dotenv
npm install -D nodemon
```

If a project already exists, do not recreate the folder. Open PowerShell in that project directory and continue from the relevant step.

## 3. Initialize Prisma 6

Run:

```powershell
npx prisma init --datasource-provider mysql
```

If the command creates a `prisma.config.ts` file from a previous Prisma 7/8 setup, delete that file for this Prisma 6 configuration.

Check the installed versions:

```powershell
npx prisma --version
npm list prisma @prisma/client
```

Both `prisma` and `@prisma/client` should be version **6.x**.

## 4. Create the MySQL database

Open MySQL Workbench and connect to your local MySQL Server.

Open a new SQL tab and execute:

```sql
CREATE DATABASE IF NOT EXISTS mydatabase;
```

Typical local connection details are:

- Host: `localhost`
- Port: `3306`
- Username: often `root`

Use the host, port, username, and password configured on your own machine. These values can differ.

## 5. Configure `.env`

In the project root, create or edit a file named `.env`:

```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/mydatabase"
```

Replace `YOUR_PASSWORD` with your actual MySQL password. Do not include the placeholder literally.

### If the password contains special characters

Characters such as `@`, `#`, `/`, `:`, and `%` may need URL encoding in the username/password portion of the connection URL.

Examples:

| Character | Encoded value |
|---|---|
| `@` | `%40` |
| `#` | `%23` |
| `/` | `%2F` |
| `:` | `%3A` |
| `%` | `%25` |

For example, if the password were `my@pass#1`, its URL-encoded form would be `my%40pass%231`:

```env
DATABASE_URL="mysql://root:my%40pass%231@localhost:3306/mydatabase"
```

This is only an example. Use your own password, and do not share it in chats or commit it to Git.

## 6. Configure `prisma/schema.prisma`

Replace the contents of `prisma/schema.prisma` with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id    Int    @id @default(autoincrement())
  name  String
  email String @unique
  age   Int?
}
```

This defines a `User` table with an auto-incrementing ID, a name, a unique email, and an optional age.

## 7. Create the table with a migration

Ensure the MySQL server is running, then execute in the project directory:

```powershell
npx prisma migrate dev --name init
```

This creates a migration and applies it to the configured database. Prisma Client is usually generated as part of the migration workflow. You can also run:

```powershell
npx prisma generate
```

If the `User` table or migration already exists, do not repeatedly create a new `init` migration. Check your existing migration status first:

```powershell
npx prisma migrate status
```

## 8. Create `index.js`

Create `index.js` in the project root:

```javascript
require("dotenv").config();

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  // CREATE / INSERT
  const user = await prisma.user.create({
    data: {
      name: "Manjeet",
      email: "manjeet@example.com",
      age: 22,
    },
  });
  console.log("Inserted:", user);

  // READ / SELECT ALL
  const users = await prisma.user.findMany();
  console.log("All users:", users);

  // READ / SELECT ONE
  const oneUser = await prisma.user.findUnique({
    where: { email: "manjeet@example.com" },
  });
  console.log("One user:", oneUser);

  // UPDATE
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { age: 23 },
  });
  console.log("Updated:", updatedUser);

  // DELETE (uncomment only when you want to delete this record)
  // const deletedUser = await prisma.user.delete({
  //   where: { id: user.id },
  // });
  // console.log("Deleted:", deletedUser);
}

main()
  .catch((error) => {
    console.error("Database operation failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Important:** Running the `create` query more than once with the same email will fail because `email` is unique. For repeatable tests, use a new email or change the example to an upsert.

## 9. Run the project

From the project root in PowerShell:

```powershell
node index.js
```

Optional: use nodemon while developing:

```powershell
npx nodemon index.js
```

## 10. Recommended `package.json` scripts

In `package.json`, update the `scripts` section to include:

```json
"scripts": {
  "start": "node index.js",
  "dev": "nodemon index.js",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:status": "prisma migrate status"
}
```

Keep the existing `name`, `version`, dependencies, and other package fields. Do not replace the entire `package.json` with only the snippet above.

Then use:

```powershell
npm start
npm run dev
npm run db:generate
npm run db:status
```

For a named migration, run the command directly:

```powershell
npx prisma migrate dev --name add_user_fields
```

## 11. Expected project structure

```text
prisma-mysql-project/
├── node_modules/
├── prisma/
│   ├── migrations/
│   └── schema.prisma
├── .env
├── .gitignore
├── index.js
├── package-lock.json
└── package.json
```

Prisma 6's default generator writes the client to `node_modules/@prisma/client`; you do not need a custom `generated/prisma` directory for this setup.

## 12. Keep secrets and generated files out of Git

Create or update `.gitignore`:

```gitignore
node_modules/
.env
generated/
```

Never commit your real database password. If you publish the project, share an `.env.example` with a placeholder instead:

```env
DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/mydatabase"
```

## 13. Common errors

### `P1000: Authentication failed`

- Check the MySQL username and password.
- Confirm that the connection works in MySQL Workbench.
- URL-encode special characters in the connection URL.
- Do not assume that Workbench opening without a prompt means the password is empty; it may be saved.

### `P1001: Can't reach database server`

- Make sure the MySQL Server service is running.
- Verify the host and port (commonly `localhost:3306`).
- Confirm that the server is listening on the configured port.

### `Environment variable not found: DATABASE_URL`

- Ensure `.env` is in the project root, next to `package.json`.
- Ensure the variable is named exactly `DATABASE_URL`.
- Check that `prisma/schema.prisma` contains `url = env("DATABASE_URL")`.

### `Schema must contain a datasource block`

Make sure `prisma/schema.prisma` has a `datasource db { provider = "mysql" ... }` block and that you are running the expected Prisma 6 CLI.

### `Cannot find module '@prisma/client'`

Run:

```powershell
npm install @prisma/client@6
npx prisma generate
```

Also confirm that `prisma` and `@prisma/client` are both version 6.

### `Unique constraint failed on the fields: (email)`

The email already exists. Use a different email, query the existing user, or use `upsert` if that is the intended behavior.

## 14. Quick setup checklist

- [ ] Node.js and npm work in PowerShell.
- [ ] MySQL Server is running and Workbench can connect.
- [ ] Database `mydatabase` exists.
- [ ] `.env` contains the correct `DATABASE_URL`.
- [ ] `prisma` and `@prisma/client` are both version 6.
- [ ] `prisma/schema.prisma` contains the MySQL datasource and models.
- [ ] `npx prisma migrate dev --name init` succeeds.
- [ ] `npx prisma generate` succeeds.
- [ ] `node index.js` runs successfully.

---

**Workflow summary:** Update your models in `prisma/schema.prisma` → run a migration → write database queries in `index.js` → run `node index.js`.
