"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import styles from "../styles/Admin.module.css";
import { useNavigate } from "react-router-dom";

const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const admin = isAdmin();

  useEffect(() => {
    fetchUsers(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/admin/users?page=${page}&limit=10`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.users)) {
          setUsers(data.users);
        } else {
          setUsers([]);
          console.warn("La API no devolvió un array de usuarios");
        }
        setPagination({ total: data.totalUsers || 0, pages: data.totalPages || 1 });
      } else {
        const errorText = await response.text();
        console.error("Error en la respuesta:", response.status, errorText);
        setUsers([]);
        setPagination({ total: 0, pages: 1 });
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setUsers([]);
      setPagination({ total: 0, pages: 1 });
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId, username) => {
    if (
      !window.confirm(
        `¿Estás seguro de que quieres eliminar al usuario "${username}"? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${BASE_URL}/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchUsers(currentPage);
        alert("Usuario eliminado correctamente");
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error al eliminar el usuario");
    }
  };

  if (loading) {
    return <div className={styles["admin-loading"]}>Cargando usuarios...</div>;
  }

  // Aseguramos que users sea siempre un array antes de filtrar
  const filteredUsers = (Array.isArray(users) ? users : []).filter((user) =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={styles["admin-users"]}>
      <button
        className={styles["admin-btn"]}
        onClick={() => navigate(-1)}
        style={{ marginBottom: "10px" }}
      >
        ← Volver atrás
      </button>

      <div className={styles["admin-header"]}>
        <h1>Gestión de Usuarios</h1>
        <p>Total: {pagination.total} usuarios</p>
        <button onClick={() => fetchUsers(currentPage)} className={styles["admin-btn"]}>
          Recargar
        </button>
        <input
          type="text"
          placeholder="Filtrar por nombre de usuario"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles["filter-input"]}
        />
      </div>

      <div className={styles["users-table"]}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Usuario</th>
              <th>Email</th>
              <th>Rol</th>
              <th>Fecha Registro</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles["role-badge"]} ${styles[user.role]}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString()}</td>
                  <td>
                    <div className={styles["user-actions"]}>
                      {admin && user.role !== "admin" && (
                        <button
                          className={`${styles["action-btn"]} ${styles["delete"]}`}
                          onClick={() => deleteUser(user.id, user.username)}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">No se encontraron usuarios con ese nombre.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles["pagination"]}>
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>
          Anterior
        </button>
        <span>
          Página {currentPage} de {pagination.pages}
        </span>
        <button
          disabled={currentPage === pagination.pages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Siguiente
        </button>
      </div>
    </div>
  );
};

export default AdminUsers;
