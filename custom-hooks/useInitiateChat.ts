import { useInitiateChatMutation } from "@/store/services/chatService";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
const useInitiateChat = () => {
  const [initiateChat, { isLoading }] = useInitiateChatMutation();
  const router = useRouter();
  const onInitiateChat = async (buyerId: string, sellerId: string) => {
    try {
      await initiateChat({ buyerId, sellerId })
        .unwrap()
        .then((result) => {
          router.push(`/chat?chatId=${result?.data?._id ?? result?.data?.id}`);
        });
    } catch (error) {
      toast.error(
        (error as { data?: { message?: string } })?.data?.message ||
          "Something went wrong",
      );
    }
  };
  return {
    onInitiateChat,
    isLoading,
  };
};
export default useInitiateChat;
