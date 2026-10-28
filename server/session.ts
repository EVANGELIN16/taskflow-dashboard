
import "dotenv/config";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;
const isProduction = process.env.NODE_ENV === "production";

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters");
}

const PgSession = connectPgSimple(session);

const pool = new pg.Pool({
  connectionString,
});

export const sessionMiddleware = session({
  store: new PgSession({
    pool,
    tableName: "user_sessions",
    createTableIfMissing: true,
  }),
  name: "taskflow.sid",
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: 1000 * 60 * 60 * 24,
    path: "/",
  },
});
