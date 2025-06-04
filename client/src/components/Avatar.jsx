// client/src/components/Avatar.jsx
import { useState } from 'react';

const Avatar = ({ src, username, size = 40, version = "" }) => {
  const [error, setError] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath || error) return `/placeholder.svg?height=${size}&width=${size}`;

    const baseUrl = imagePath.startsWith("http")
      ? imagePath
      : `${imagePath}`;

    return version ? `${baseUrl}?v=${version}` : baseUrl;
  };

  return (
    <img
      src={getImageUrl(src)}
      alt={username || "Usuario"}
      className="avatar-image"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: '50%',
        objectFit: 'cover'
      }}
      onError={() => setError(true)}
    />
  );
};

export default Avatar;
