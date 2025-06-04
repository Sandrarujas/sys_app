import React, { useEffect, useState } from "react";
import styles from "../styles/NotificationModal.module.css"; // 👈 CSS module

const NotificationModal = ({ notification, onClose, onNavigate }) => {
  const [commentContent, setCommentContent] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (notification.type === "comment" && !notification.commentContent) {
      const fetchComment = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/notifications/${notification.id}/comment`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          if (!res.ok) throw new Error("Error al cargar comentario");
          const data = await res.json();
          setCommentContent(data.content);
        } catch (error) {
          console.error(error);
          setCommentContent("No se pudo cargar el comentario");
        } finally {
          setLoading(false);
        }
      };
      fetchComment();
    } else {
      setCommentContent(notification.commentContent || null);
    }
  }, [notification]);

  if (!notification) return null;

  const handleNavigate = () => {
    if (notification.type === "follow") {
      onNavigate(`/profile/${notification.senderUsername}`);
    } else if (notification.postId) {
      onNavigate(`/post/${notification.postId}`);
    }
    onClose();
  };

  return (
    <div className={styles["modal-backdrop"]} onClick={onClose}>
      <div className={styles["modal-content"]} onClick={(e) => e.stopPropagation()}>
        <button className={styles["modal-close"]} onClick={onClose}>
          &times;
        </button>

        <h2>Detalle de la Notificación</h2>
        <p>
          <strong>{notification.senderUsername}</strong> {getText(notification)}
        </p>

        {notification.postContent && (
          <div className={styles["modal-post-content"]}>
            <p>{notification.postContent}</p>
          </div>
        )}

        {notification.type === "comment" && (
          <div>
            <h4>Comentario:</h4>
            {loading ? <p>Cargando comentario...</p> : <p>{commentContent}</p>}
          </div>
        )}

        <button className={styles["modal-action-button"]} onClick={handleNavigate}>
          Ver {notification.type === "follow" ? "perfil" : "publicación"}
        </button>
      </div>
    </div>
  );
};

const getText = (notification) => {
  switch (notification.type) {
    case "like":
      return "le dio me gusta a tu publicación.";
    case "comment":
      return "comentó en tu publicación.";
    case "follow":
      return "comenzó a seguirte.";
    default:
      return "interactuó contigo.";
  }
};

export default NotificationModal;
