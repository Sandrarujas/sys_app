const pool = require("../config/db") // Cambia esta ruta al archivo donde configuras el pool

async function testConnection() {
  try {
    const [rows] = await pool.query("SELECT 1 + 1 AS solution")
    console.log("Resultado de prueba:", rows[0].solution) // Debería imprimir: 2
    process.exit(0) // Salir con éxito
  } catch (error) {
    console.error("Error en prueba de conexión:", error)
    process.exit(1) // Salir con error
  }
}

testConnection()
