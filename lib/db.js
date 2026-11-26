import { neon } from '@neondatabase/serverless';
// Connects lazily so the build works without a database.
export const sql = (...args) => neon(process.env.DATABASE_URL)(...args);
