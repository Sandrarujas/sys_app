"use client";

import { useState, useEffect, useContext } from "react";
import { useParams } from "react-router-dom";
import axiosInstance from "../api/axiosInstances"; 
import { AuthContext } from "../context/AuthContext";
import Post from "../components/Post";
import EditProfileModal from "../components/EditProfileModal";

import styles from "../styles/Profile.module.css";

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
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axiosInstance.get(`/api/users/${encodeURIComponent(username)}`);
        setProfile(res.data);
        setIsFollowing(res.data.isFollowing);

        const postsRes = await axiosInstance.get(`/api/posts/user/${encodeURIComponent(username)}`);
        setPosts(postsRes.data);
      } catch (error) {
        setError("Error al cargar el perfil");
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [username]);

  const handleFollow = async () => {
    try {
      if (isFollowing) {
        await axiosInstance.delete(`/api/users/${profile.id}/unfollow`);
      } else {
        await axiosInstance.post(`/api/users/${profile.id}/follow`);
      }
      setIsFollowing(!isFollowing);
      setProfile((prev) => ({
        ...prev,
        followers: isFollowing ? prev.followers - 1 : prev.followers + 1,
      }));
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
    }
  };

  const handleProfileUpdate = (updatedData) => {
    setProfile((prevProfile) => ({
      ...prevProfile,
      ...updatedData,
    }));

    if (updatedData.profileImage) {
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.user && post.user.id === profile.id
            ? { ...post, user: { ...post.user, profileImage: updatedData.profileImage } }
            : post
        )
      );
    }
  };

  const handlePostUpdate = (updatedPost) => {
    console.log("Actualizando publicación:", updatedPost);
    setPosts((prevPosts) =>
      prevPosts.map((post) => (post.id === updatedPost.id ? { ...post, ...updatedPost } : post))
    );
  };

  const handlePostDelete = (postId) => {
    console.log("Eliminando publicación:", postId);
    setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
  };

  const incrementProfileComments = () => {
    setProfile((prev) => ({
      ...prev,
      comments: prev.comments + 1,
    }));
  };

  const incrementProfileLikes = (liked) => {
    setProfile((prev) => ({
      ...prev,
      likes: prev.likes + (liked ? 1 : -1),
    }));
  };

  if (loading) return <div className={styles["loading"]}>Cargando perfil...</div>;
  if (error) return <div className={styles["error"]}>{error}</div>;
  if (!profile) return <div className={styles["error"]}>Usuario no encontrado</div>;

  // Función para evitar concatenar base URL dos veces
  const getProfileImageUrl = (url) => {
    if (!url) return "/placeholder.svg?height=150&width=150";
    if (url.startsWith("http")) return url;
    return `${process.env.REACT_APP_API_BASE_URL || "http://localhost:5000"}${url}`;
  };

  return (
    <div className={styles["profile-container"]}>
      <div className={styles["profile-header"]}>
        <div className={styles["profile-image-container"]}>
          <img
            src={getProfileImageUrl(profile.profileImage)}
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
              onClick={handleFollow}
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
          {posts.length > 0 ? (
            posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                onPostUpdate={handlePostUpdate}
                onPostDelete={handlePostDelete}
                onCommentAdded={incrementProfileComments}
                onLikeToggled={incrementProfileLikes}
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
          onProfileUpdate={handleProfileUpdate}
        />
      )}
    </div>
  );
};

export default Profile;
