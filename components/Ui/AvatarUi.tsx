"use client";
import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/Ui/Avatar";
const AvatarUi = ({
    name,
    image,
    className,
}: {
    name: string | null;
    image?: any;
    className?: string;
}) => {
    const firstLetter = name ? name?.charAt(0)?.toUpperCase() : "-";
    return (
        <Avatar className={className}>
            <AvatarImage src={image ?? undefined} />
            <AvatarFallback className=" ">{firstLetter}</AvatarFallback>
        </Avatar>
    );
};

export default AvatarUi;
