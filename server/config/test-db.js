require('dotenv').config()
const mysql = require('mysql2/promise')

async function testConnection() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306,
      waitForConnections: true,
      connectionLimit: 1,
      queueLimit: 0,
    })

    const connection = await pool.getConnection()
    console.log('✅ Conexión a la base de datos exitosa!')

    const [rows] = await connection.query('SELECT NOW() AS currentTime')
    console.log('Hora actual en la DB:', rows[0].currentTime)

    connection.release()
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message)
    process.exit(1)
  }
}

testConnection()

// Si el script termina muy rápido y no ves la consola, ejecuta con:
// node test-db-connection.js | tee output.log
