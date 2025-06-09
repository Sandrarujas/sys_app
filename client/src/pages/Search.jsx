"use client";

import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import axios from "axios"; 
import Post from "../components/Post";
import styles from "../styles/Search.module.css";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const Search = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const query = searchParams.get("q") || "";

  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!query) {
        setLoading(false);
        setUsers([]);
        setPosts([]);
        return;
      }

      setLoading(true);
      setError("");

      try {
        if (activeTab === "users") {
          const res = await axios.get(`${BASE_URL}/api/search/users?q=${encodeURIComponent(query)}`);
          setUsers(res.data);
        } else {
          const res = await axios.get(`${BASE_URL}/api/search/posts?q=${encodeURIComponent(query)}`);
          setPosts(res.data);
        }
      } catch (error) {
        console.error("Error en búsqueda:", error);
        setError("Error al realizar la búsqueda");
      } finally {
        setLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, activeTab]);

  const handleFollow = async (userId, isFollowing, index) => {
    try {
      if (isFollowing) {
        await axios.delete(`${BASE_URL}/api/users/${userId}/unfollow`);
      } else {
        await axios.post(`${BASE_URL}/api/users/${userId}/follow`);
      }

      const updatedUsers = [...users];
      updatedUsers[index].isFollowing = !isFollowing;
      setUsers(updatedUsers);
    } catch (error) {
      console.error("Error al seguir/dejar de seguir:", error);
    }
  };

  return (
    <div className={styles["search-container"]}>
      <h1>Resultados de búsqueda: "{query}"</h1>

      <div className={styles["search-tabs"]}>
        <button
          className={`${styles["tab-button"]} ${activeTab === "users" ? styles["active"] : ""}`}
          onClick={() => setActiveTab("users")}
        >
          Usuarios
        </button>
        <button
          className={`${styles["tab-button"]} ${activeTab === "posts" ? styles["active"] : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          Publicaciones
        </button>
      </div>

      {loading ? (
        <div className={styles.loading}>Buscando...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : activeTab === "users" ? (
        <div className={styles["users-results"]}>
          {users.length > 0 ? (
            users.map((user, index) => (
              <div key={user.id} className={styles["user-card"]}>
                <Link to={`${BASE_URL}/profile/${user.username}`} className={styles["user-info"]}>
                  <img
                    src={
                      user.profileImage
                        ? user.profileImage.startsWith("http")
                          ? user.profileImage
                          : `${process.env.REACT_APP_API_BASE_URL}${user.profileImage}`
                        : "/placeholder.svg?height=50&width=50"
                    }
                    alt={user.username}
                    className={styles["user-image"]}
                  />
                  <div className={styles["user-details"]}>
                    <h3 className={styles["user-username"]}>{user.username}</h3>
                    <p className={styles["user-bio"]}>{user.bio || "Sin biografía"}</p>
                  </div>
                </Link>
                <button
                  className={`${styles["follow-button"]} ${
                    user.isFollowing ? styles["following"] : ""
                  }`}
                  onClick={() => handleFollow(user.id, user.isFollowing, index)}
                >
                  {user.isFollowing ? "Dejar de Seguir" : "Seguir"}
                </button>
              </div>
            ))
          ) : (
            <p className={styles["no-results"]}>No se encontraron usuarios con "{query}"</p>
          )}
        </div>
      ) : (
        <div className={styles["posts-results"]}>
          {posts.length > 0 ? (
            posts.map((post) => <Post key={post.id} post={post} />)
          ) : (
            <p className={styles["no-results"]}>No se encontraron publicaciones con "{query}"</p>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;
