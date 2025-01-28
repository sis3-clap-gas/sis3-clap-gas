const mysql = require('mysql2');
require('dotenv').config();

let connection;

function createConnection() {
  connection = mysql.createPool({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: process.env.DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

function handleError(error) {
  if (error.fatal) {
    console.log('Error fatal en la conexión:', error);
    createConnection();
  }
}

createConnection();
connection.on('error', handleError);

module.exports = connection;
