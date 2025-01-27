const mysql = require('mysql2');
require('dotenv').config();

const connection = mysql.createPool({
  host: process.env.DBHOST, 
  user: process.env.DBUSER,     
  password: process.env.DBPASSWORD,
  database: process.env.DB,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

connection.getConnection((error, conn) => {
  if (error) {
    console.error('Error de conexión a la base de datos:', error);
    return;
  }
  console.log('Conexión exitosa a la base de datos MySQL');
  conn.release();
});


module.exports = connection;
