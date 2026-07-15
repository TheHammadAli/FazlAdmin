import Image from "next/image";
import authBgImage from "@/assets/images/new-auth-bg-image.png";

type AuthImagePanelProps = {
  className?: string;
  imageClassName?: string;
};

export default function AuthImagePanel({
  className = "relative hidden h-full shrink-0 overflow-hidden lg:block lg:w-1/2 ltr:lg:pl-8 ltr:xl:pl-24 rtl:lg:pr-8 rtl:xl:pr-24",
  imageClassName = "h-full w-full object-cover",
}: AuthImagePanelProps) {
  return (
    <div className={className}>
      <Image
        src={authBgImage}
        alt="auth-image"
        className={imageClassName}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[18%] min-h-[100px] bg-gradient-to-b from-white to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[18%] min-h-[100px] bg-gradient-to-t from-white to-transparent" />
    </div>
  );
}
