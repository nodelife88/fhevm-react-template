import React, { useState } from "react";
import { createAvatar } from "@dicebear/core";
import { dylan } from "@dicebear/collection";

interface CustomAvatarProps {
  name: string;
  src?: string;
  size?: number;
}

const Avatar: React.FC<CustomAvatarProps> = ({ name, src, size = 40 }) => {
  const [imageError, setImageError] = useState(false);

  function onError(e: React.SyntheticEvent<HTMLImageElement, Event>): void {
    setImageError(true);
  }

  const avatarSvg = createAvatar(dylan, {
    seed: name,
    size,
  }).toDataUri();

  const shouldShowCustomImage = src && !imageError;

  return (
    <div
      className="relative flex items-center justify-center rounded-full overflow-hidden bg-gray-200"
      style={{ width: size, height: size }}
    >
      {shouldShowCustomImage ? (
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover"
          onError={onError}
        />
      ) : (
        <img
          src={avatarSvg}
          alt={name}
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
};

export default Avatar;
