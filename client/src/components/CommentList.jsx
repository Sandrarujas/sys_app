// client/src/components/CommentList.jsx (modificado)
import { Link } from "react-router-dom"
import Avatar from "./Avatar"
import styles from "../styles/Post.module.css"

const CommentList = ({ comments }) => {
  return (
    <div className="comments-list">
      {comments.length > 0 ? (
        comments.map((comment) => (
          <div key={comment.id} className="comment">
            <div className="comment-header">
              <Link to={`/profile/${comment.user.username}`} className="comment-user">
                <Avatar 
                  src={comment.user.profileImage} 
                  username={comment.user.username} 
                  size={30}
                  className={styles["comment-user-image"]}
                />
                <span className={styles["comment-username"]}>{comment.user.username}</span>
              </Link>
              <span className={styles["comment-date"]}>{new Date(comment.createdAt).toLocaleDateString()}</span>
            </div>
            <div className={styles["comment-content"]}>
              <p>{comment.content}</p>
            </div>
          </div>
        ))
      ) : (
        <p className={styles["no-comments"]}>No hay comentarios aún.</p>
      )}
    </div>
  )
}

export default CommentList