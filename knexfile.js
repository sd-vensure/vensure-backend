// Update with your config settings.



/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'mysql2',
    connection: {
      host: process.env.MYSQL_HOST_MAIN,
      user: process.env.MYSQL_USER_MAIN,
      password: process.env.MYSQL_PASSWORD_MAIN,
      database: process.env.MYSQL_DATABASE_MAIN
    },
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    pool: {
      min: 2,
      max: 10,
      afterCreate: (conn, done) => {
        conn.on('error', (err) => {
          if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was lost. Reconnecting...');
          } else {
            console.error('Database connection error:', err);
          }
        });
        done(null, conn);
      },
    },
    acquireConnectionTimeout: 10000

  },
  
  production: {
    client: 'mysql2',
    connection: {
      host: process.env.MYSQL_HOST_MAIN,
      user: process.env.MYSQL_USER_MAIN,
      password: process.env.MYSQL_PASSWORD_MAIN,
      database: process.env.MYSQL_DATABASE_MAIN
    },
    migrations: {
      directory: './src/db/migrations',
    },
    seeds: {
      directory: './src/db/seeds',
    },
    pool: {
      min: 2,
      max: 10,
      afterCreate: (conn, done) => {
        conn.on('error', (err) => {
          if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection was lost. Reconnecting...');
          } else {
            console.error('Database connection error:', err);
          }
        });
        done(null, conn);
      },
    },
    acquireConnectionTimeout: 10000

  },


  // production: {
  //   client: 'postgresql',
  //   connection: {
  //     database: 'my_db',
  //     user:     'username',
  //     password: 'password'
  //   },
  //   pool: {
  //     min: 2,
  //     max: 10
  //   },
  //   migrations: {
  //     tableName: 'knex_migrations'
  //   }
  // }

};
