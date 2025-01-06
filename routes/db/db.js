const mysql = require('mysql2');


const connection = mysql.createConnection({
  host: process.env.DBHOST, 
  user: process.env.DBUSER,     
  password: process.env.DBPASSWORD,
  database: process.env.DB
});

connection.connect((error) => {
  if (error) {
    console.error('Error de conexión a la base de datos:', error);
    return;
  }
  console.log('Conexión exitosa a la base de datos MySQL');
});


module.exports = connection;
