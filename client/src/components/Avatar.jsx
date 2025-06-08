import { useState } from 'react';

const BASE_URL = process.env.REACT_APP_API_URL;

const Avatar = ({ src, username, size = 40, version = "" }) => {
  const [error, setError] = useState(false);

  const getImageUrl = (imagePath) => {
    if (!imagePath || error) {
      return `/placeholder.svg?height=${size}&width=${size}`;
    }

    const isAbsolute = imagePath.startsWith("http") || imagePath.startsWith("//");
    const fullUrl = isAbsolute ? imagePath : `${BASE_URL}${imagePath}`;

    return version ? `${fullUrl}?v=${version}` : fullUrl;
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
