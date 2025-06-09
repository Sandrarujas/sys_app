"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Admin.module.css";
import { useNavigate } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Verificar si es admin
  const admin = isAdmin();

  useEffect(() => {
    if (!admin) {
      // Si no es admin, puedes redirigir o mostrar error
      navigate("/");
      return;
    }

    fetchUsers(currentPage);
  }, [currentPage, admin, navigate]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token found");
        setUsers([]);
        setPagination({ total: 0, pages: 1 });
        setLoading(false);
        return;
      }

      const response = await fetch(`${BASE_URL}/api/admin/users?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Respuesta completa del backend:", data);

        if (Array.isArray(data.users)) {
          const safeUsers = data.users.filter((user) => user && user.username);
          console.log("Usuarios filtrados (válidos):", safeUsers);
          setUsers(safeUsers);
        } else {
          setUsers([]);
          console.warn("La API no devolvió un array de usuarios");
        }

        setPagination({
          total: data.total || 0,
          pages: data.pages || 1,
        });
      } else {
        console.error("Error al obtener usuarios:", response.status);
        setUsers([]);
      }
    } catch (error) {
      console.error("Error en fetchUsers:", error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const filteredUsers = users.filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className={styles["admin-users-container"]}>
      <h1>Administrar Usuarios</h1>

      <input
        type="text"
        placeholder="Buscar por usuario"
        value={searchTerm}
        onChange={handleSearchChange}
        className={styles["search-input"]}
      />

      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <>
          <table className={styles["users-table"]}>
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Email</th>
                <th>Admin</th>
                <th>Creado</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.isAdmin ? "Sí" : "No"}</td>
                    <td>{formatDate(user.created_at)}</td>
                    <td>{user.status ? "Activo" : "Inactivo"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5">No se encontraron usuarios.</td>
                </tr>
              )}
            </tbody>
          </table>

          <div className={styles["pagination-controls"]}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage <= 1}
            >
              Anterior
            </button>
            <span>
              Página {currentPage} de {pagination.pages}
            </span>
            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, pagination.pages))}
              disabled={currentPage >= pagination.pages}
            >
              Siguiente
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminUsers;
