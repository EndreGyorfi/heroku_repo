module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 3001),
  url: env('', 'http://localhost:3001'),
  admin: {
    auth: {
      secret: env('ADMIN_JWT_SECRET', 'e003dd2c5fec30b628a5d4c7d5476d08'),
    },
  },
});
