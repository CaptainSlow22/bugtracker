import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT,
    user: process.env.PGUSER,
    password: process.env.PGPASS,
    database: process.env.PGDB 
});

export default pool;