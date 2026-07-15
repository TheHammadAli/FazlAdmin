import React from "react";
import Feed from "@/components/Feed/Feed";

function page() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-2 h-[calc(100dvh-80px)] lg:h-full lg:min-h-0">
      <Feed />
    </div>
  );
}

export default page;
