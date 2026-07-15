"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "./Avatar";
const AvatarComponent = ({
  name,
  image,
  className,
}: {
  name: string | null;
  image: string | undefined | null;
  className?: string;
}) => {
  const firstLetter = name ? name?.charAt(0)?.toUpperCase() : "-";
  return (
    <Avatar className={className}>
      <AvatarImage src={image ?? undefined} />
      <AvatarFallback>{firstLetter}</AvatarFallback>
    </Avatar>
  );
};

export default AvatarComponent;
