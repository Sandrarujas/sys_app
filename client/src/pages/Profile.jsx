"use client";

import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import Post from "../components/Post";
import EditProfileModal from "../components/EditProfileModal";

import styles from "../styles/Profile.module.css";

const BASE_URL = process.env.REACT_APP_API_URL;

const Profile = () => {
  const { username } = useParams();
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const isOwnProfile = user && profile && user.id === profile.id;

  useEffect(() => {
    console.log("Efecto useEffect - fetchProfile llamado con username:", username);

    const fetchProfile = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/users/${username}`);
        console.log("Perfil recibido:", res.data);
        setProfile(res.data);
        setIsFollowing(res.data.isFollowing);

        const postsRes = await axios.get(`${BASE_URL}/api/posts/user/${username}`);
        console.log("Posts recibidos:", postsRes.data);

        if (Array.isArray(postsRes.data)) {
          setPosts(postsRes.data);
        } else if (postsRes.data && Array.isArray(postsRes.data.posts)) {
          setPosts(postsRes.data.posts);
        } else {
          console.warn("Formato inesperado de posts:", postsRes.data);
          setPosts([]);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error al obtener perfil o posts:", err);
        setError("Error al cargar el perfil");
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  if (loading) return <div className={styles.loading}>Cargando perfil...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!profile) return <div className={styles.error}>Usuario no encontrado</div>;

  return (
    <div className={styles["profile-container"]}>
      <div className={styles["profile-header"]}>
        <div className={styles["profile-image-container"]}>
          <img
            src={
              profile.profileImage
                ? `${BASE_URL}${profile.profileImage}`
                : "/placeholder.svg?height=150&width=150"
            }
            alt={profile.username}
            className={styles["profile-image"]}
          />
          {isOwnProfile && (
            <button className={styles["edit-profile-image-button"]} onClick={() => setIsEditModalOpen(true)}>
              Cambiar foto
            </button>
          )}
        </div>
        <div className={styles["profile-info"]}>
          <div className={styles["profile-username-container"]}>
            <h1 className={styles["profile-username"]}>{profile.username}</h1>
            {isOwnProfile && (
              <button className={styles["edit-profile-button"]} onClick={() => setIsEditModalOpen(true)}>
                Editar perfil
              </button>
            )}
          </div>
          <div className={styles["profile-stats"]}>
            <div className={styles["profile-stat"]}>
              <span className={styles["stat-count"]}>{profile.posts}</span>
              <span className={styles["stat-label"]}>Publicaciones</span>
            </div>
            <div className={styles["profile-stat"]}>
              <span className={styles["stat-count"]}>{profile.followers}</span>
              <span className={styles["stat-label"]}>Seguidores</span>
            </div>
            <div className={styles["profile-stat"]}>
              <span className={styles["stat-count"]}>{profile.following}</span>
              <span className={styles["stat-label"]}>Siguiendo</span>
            </div>
            <div className={styles["profile-stat"]}>
              <span className={styles["stat-count"]}>{profile.comments}</span>
              <span className={styles["stat-label"]}>Comentarios</span>
            </div>
            <div className={styles["profile-stat"]}>
              <span className={styles["stat-count"]}>{profile.likes}</span>
              <span className={styles["stat-label"]}>Me gusta</span>
            </div>
          </div>
          {user && user.id !== profile.id && (
            <button
              className={`${styles["follow-button"]} ${isFollowing ? styles["following"] : ""}`}
              onClick={() => {
                try {
                  if (isFollowing) {
                    axios.delete(`${BASE_URL}/api/users/${profile.id}/unfollow`);
                  } else {
                    axios.post(`${BASE_URL}/api/users/${profile.id}/follow`);
                  }
                  setIsFollowing(!isFollowing);
                  setProfile({
                    ...profile,
                    followers: isFollowing ? profile.followers - 1 : profile.followers + 1,
                  });
                } catch (e) {
                  console.error("Error en follow/unfollow:", e);
                }
              }}
            >
              {isFollowing ? "Dejar de Seguir" : "Seguir"}
            </button>
          )}
        </div>
      </div>
      <div className={styles["profile-bio"]}>
        <p>{profile.bio || "Sin biografía"}</p>
      </div>
      <div className={styles["profile-posts"]}>
        <h2>Publicaciones</h2>
        <div className={styles["posts-container"]}>
          {!Array.isArray(posts) ? (
            <p>Error: posts no es un array.</p>
          ) : posts.length > 0 ? (
            posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                onPostUpdate={(updatedPost) => {
                  console.log("Actualizando publicación:", updatedPost);
                  setPosts((prev) =>
                    prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
                  );
                }}
                onPostDelete={(postId) => {
                  console.log("Eliminando publicación:", postId);
                  setPosts((prev) => prev.filter((p) => p.id !== postId));
                }}
              />
            ))
          ) : (
            <p>No hay publicaciones disponibles.</p>
          )}
        </div>
      </div>

      {isOwnProfile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          profile={profile}
          onProfileUpdate={(updatedData) =>
            setProfile((prev) => ({ ...prev, ...updatedData }))
          }
        />
      )}
    </div>
  );
};

export default Profile;
