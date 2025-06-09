require('dotenv').config()
const pool = require('./db')  // ajusta la ruta si es diferente

async function testDb() {
  try {
    // Probar conexión
    const [rows] = await pool.query('SELECT 1 + 1 AS result')
    console.log('Conexión a la base de datos OK, resultado:', rows[0].result)

    // Intentar insertar un usuario de prueba
    const username = 'testuser'
    const email = 'testuser@example.com'

    // Verificar si ya existe para evitar error de duplicados
    const [existing] = await pool.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    )
    if (existing.length > 0) {
      console.log('Usuario de prueba ya existe. No se inserta.')
    } else {
      const [result] = await pool.query(
        'INSERT INTO users (username, email) VALUES (?, ?)',
        [username, email]
      )
      console.log('Usuario de prueba insertado con ID:', result.insertId)
    }
  } catch (error) {
    console.error('Error en test de base de datos:', error)
  } finally {
    pool.end()
  }
}

testDb()
