import homeGreen from "@/assets/icons/home-active-icon.svg";
import homeGray from "@/assets/icons/home-gray-icon.svg";
import servicesGray from "@/assets/icons/services-gray-icon.svg";
import servicesGreen from "@/assets/icons/services-green-icon.svg";
import sellingGray from "@/assets/icons/selling-gray-icon.svg";
import sellingGreen from "@/assets/icons/selling-green-icon.svg";
import feedGray from "@/assets/icons/feed-gray-icon.svg";
import feedGreen from "@/assets/icons/feed-green-icon.svg";
import chatGray from "@/assets/icons/chat-gray-icon.svg";
import chatGreen from "@/assets/icons/chat-green-icon.svg";
import updatesGreen from "@/assets/icons/notification-green-icon.svg";
import updatesGray from "@/assets/icons/notification-gray-icon.svg";
import React from "react";

export const links = [
  {
    title: "Home",
    href: "/home",
    icon: { active: homeGreen, inactive: homeGray },
  },
  {
    title: "Services",
    href: "/services",
    icon: { active: servicesGreen, inactive: servicesGray },
  },
  {
    title: "Selling",
    href: "/selling",
    icon: { active: sellingGreen, inactive: sellingGray },
  },
  {
    title: "Feed",
    href: "/feed",
    icon: { active: feedGreen, inactive: feedGray },
  },
  {
    title: "Chat",
    href: "/chat",
    icon: { active: chatGreen, inactive: chatGray },
  },
  {
    title: "Updates",
    href: "/updates",
    icon: { active: updatesGreen, inactive: updatesGray },
  },
];
