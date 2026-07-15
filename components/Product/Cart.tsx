import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import chevron from "@/assets/icons/chev-down-icon.svg";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { RadioGroup } from "@headlessui/react";
import { Clock } from "lucide-react";
import { Star } from "lucide-react";
import noImageAvtar from "@/assets/images/no-image-av.png";
import penIcon from "@/assets/icons/pen-icon.svg";
import easyPaisaIcon from "@/assets/icons/easypaisa-icon.svg";
import cashOnDelivery from "@/assets/icons/cash-delivery.svg";
import { useOrderProductMutation } from "@/store/services/sellingService";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { BeatLoader } from "react-spinners";
import DoodleButton from "@/components/Ui/DoodleButton";
import addIcon from "@/assets/icons/add.svg";
import { useGetAvgReviewsQuery } from "@/store/services/reviewService";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  clearCart,
  getCartLineId,
  type CartItem,
} from "@/store/reducers/cartReducer";
import { useRequireSignIn } from "@/custom-hooks/useRequireSignIn";

const DELIVERY_FEE = 250;
const SALES_TAX = 90;

function resolveOwnerId(
  item: CartItem,
): { owner: string; ownerModel: "Shop" | "User" } | null {
  const shop = item.shopId as string | { _id?: string } | undefined;
  const owner = item.ownerId as string | { _id?: string } | undefined;

  if (shop) {
    const id = typeof shop === "object" ? shop._id : shop;
    if (id) return { owner: id, ownerModel: "Shop" };
  }
  if (owner) {
    const id = typeof owner === "object" ? owner._id : owner;
    if (id) return { owner: id, ownerModel: "User" };
  }
  return null;
}

function buildCheckoutItems(
  cartItems: CartItem[],
  product: { data?: { id?: string; title?: string; price?: number; images?: string[]; shopId?: unknown; ownerId?: unknown } } | undefined,
  selectedVariants: Record<string, string>,
  shopData: { title?: string; image?: string } | undefined,
  ownerData: { name?: string; image?: string; _id?: string } | undefined,
): CartItem[] {
  if (cartItems.length > 0) return cartItems;
  if (!product?.data?.id) return [];

  return [
    {
      id: getCartLineId(product.data.id, selectedVariants),
      productId: product.data.id,
      title: product.data.title ?? "",
      price: Number(product.data.price) || 0,
      image: product.data.images?.[0] ?? "",
      shopId: product.data.shopId as CartItem["shopId"],
      ownerId: product.data.ownerId as CartItem["ownerId"],
      selectedVariants,
      quantity: 1,
      sellerLabel: shopData?.title ?? ownerData?.name ?? "",
      sellerImage: shopData?.image ?? ownerData?.image ?? "",
    },
  ];
}

function Cart({ product, shopData, selectedVariants, ownerData }: any) {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cartReducer.items);
  const { isGuest, requireSignIn } = useRequireSignIn();
  const { pages, placeholders, info_messages, error_messages } =
    useDictionary();
  const router = useRouter();
  const [deliveryMethod, setDeliveryMethod] = useState("delivery");
  const [toogleChoose, setToogleChoose] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [orderProduct, { isLoading }] = useOrderProductMutation();
  const { data: avgReview, isLoading: isLoadingAvgReview } = useGetAvgReviewsQuery(
    { type: "product", id: product?.data?.id ?? "" },
    { skip: !product?.data?.id || !product?.data?.id }
  );
  const reviewCount = avgReview?.data?.count ?? 0;
  const avgRating = avgReview?.data?.avgRating ?? 0;


  const { user } =
    typeof window !== "undefined"
      ? JSON.parse(localStorage.getItem("user") || "{}")
      : "";

  const checkoutItems = useMemo(
    () =>
      buildCheckoutItems(
        cartItems,
        product,
        selectedVariants as Record<string, string>,
        shopData,
        ownerData,
      ),
    [cartItems, product, selectedVariants, shopData, ownerData],
  );

  const subtotal = useMemo(
    () =>
      checkoutItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      ),
    [checkoutItems],
  );

  const deliveryFee = deliveryMethod === "delivery" ? DELIVERY_FEE : 0;
  const totalAmount = subtotal + deliveryFee + SALES_TAX;

  useEffect(() => {
    if (isGuest) {
      router.push("/signin");
    }
  }, [isGuest, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    requireSignIn(async () => {
      if (checkoutItems.length === 0) return;

      try {
        let lastMessage = "";
        for (let i = 0; i < checkoutItems.length; i++) {
          const item = checkoutItems[i];
          const ownerInfo = resolveOwnerId(item);
          if (!ownerInfo) continue;

          const lineSubtotal = item.price * item.quantity;
          const isLast = i === checkoutItems.length - 1;
          const fees = isLast ? deliveryFee + SALES_TAX : 0;

          const res = await orderProduct({
            buyer: user?.id,
            owner: ownerInfo.owner,
            ownerModel: ownerInfo.ownerModel,
            product: item.productId,
            deliveryOption: deliveryMethod,
            status: "pending",
            paymentType: "cashonDelivery",
            amount: lineSubtotal + fees,
            variant: item.selectedVariants,
            quantity: item.quantity,
          }).unwrap();

          lastMessage = (res as { message?: string })?.message ?? lastMessage;
        }

        dispatch(clearCart());
        toast.success(lastMessage || "Order placed successfully");
        setTimeout(() => {
          router.push("/home");
        }, 800);
      } catch (err) {
        toast.error(
          (err as { data?: { message?: string } })?.data?.message ||
            "something went wrong!",
        );
      }
    });
  };

  return (
    <div className=" ">
      <div className="h-full min-h-screen  flex flex-col items-center">
        <div className="px-5 sm:px-10 h-[61px] border-b-[1px] border-gray-9 bg-white w-full  flex justify-center">
          <div className="w-full   flex items-center gap-[6px] font-normal text-[14px] mt-5">
            <span className="text-gray-8">{pages.home}</span>
            <Image
              src={chevron}
              alt="chevron"
              className="-rotate-90 rtl:rotate-90"
            />
            <span className="text-green-1">{product?.data?.title}</span>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="md:flex w-full h-full ">
          {/* Left Section */}
          <div className="md:min-h-screen w-full md:w-[50%] md:border-r-[1px] border-[#E5E5E5] p-5 md:p-8 bg-white space-y-6">
            {/* Delivery Options */}
            <div>
              <h2 className="text-[#4B514F]  text-[14px]  font-normal mb-3">
                {info_messages.receive_order}
              </h2>
              <RadioGroup value={deliveryMethod} onChange={setDeliveryMethod}>
                <div className="space-y-3">
                  <RadioGroup.Option value="delivery">
                    {({ checked }) => (
                      <div className="flex items-center gap-2 cursor-pointer">
                        <span
                          className={`h-[18px] w-[18px] rounded-full border ${checked
                            ? "border-4 border-green-1"
                            : "border-[#E5E5E5]"
                            }`}
                        />
                        <span className="text-[#030303] text-[15px] ">
                          {placeholders.delivery}
                        </span>
                      </div>
                    )}
                  </RadioGroup.Option>

                  <RadioGroup.Option value="self-pickup">
                    {({ checked }) => (
                      <div className="flex items-center gap-2 cursor-pointer">
                        <span
                          className={`h-[18px] w-[18px] rounded-full border ${checked
                            ? "border-4 border-green-1"
                            : "border-[#E5E5E5]"
                            }`}
                        />
                        <span className="text-[#030303] text-[15px] ">
                          {placeholders.self_pickup}
                        </span>
                      </div>
                    )}
                  </RadioGroup.Option>
                </div>
              </RadioGroup>
            </div>

            <hr className="border-[#E5E5E5] " />

            {/* Delivery Details */}
            {deliveryMethod === "delivery" && (
              <div>
                <div className="flex items-center gap-2 text-gray-800">
                  <span className="text-[15px] text-[#030303]">
                    {user?.address ?? ""}
                  </span>
                </div>
              </div>
            )}
            {deliveryMethod === "self-pickup" && (
              <div className="flex justify-between items-center">
                <div>
                  {" "}
                  <h3 className="text-[#030303]  text-[16px] font-medium">
                    {" "}
                    {shopData?.title}
                  </h3>
                  <h3 className="text-[#4B514F] text-[16px] font-normal mb-2">
                    {shopData?.address}
                  </h3>
                </div>
                {/* <Image src={penIcon} alt="pen-icon" /> */}
              </div>
            )}
            <hr className="border-[#E5E5E5] " />

            <div>
              <h3 className="text-[#4B514F] text-[14px] font-normal mb-2">
                {placeholders.delivery_detail}
              </h3>
              <div className="flex items-center gap-2 text-gray-800">
                <Clock className="h-[16px] w-[16px] text-gray-600" />
                <span className="text-[15px] text-[#030303]">
                  {info_messages.home_delivery}
                </span>
              </div>
            </div>
            <hr className="border-[#E5E5E5] " />

            {/* Payment */}
            <div>
              <h3 className="text-[#4B514F] text-[14px] font-normal mb-2">
                {placeholders.payment}
              </h3>
              {toogleChoose && (
                <div className="mb-5">
                  {/* Easypaisa */}
                  {(!paymentMethod || paymentMethod === "easypaisa") && (
                    <div className="flex justify-between">
                      <div className="flex gap-2 items-center">
                        <Image src={easyPaisaIcon} alt="easypaisa-icon" />
                        <span className="text-[#030303] text-[16px] font-medium">
                          {placeholders["easypaisa" as keyof typeof placeholders] ?? "Easypaisa"}
                        </span>
                      </div>
                      <div>
                        <div
                          className="pointer-events-none  flex items-center gap-2 cursor-pointer"
                          onClick={() =>
                            setPaymentMethod((prev) =>
                              prev === "easypaisa" ? "" : "easypaisa"
                            )
                          }
                        >
                          <span
                            className={`h-[24px] w-[24px] rounded-full border ${paymentMethod === "easypaisa"
                              ? "border-4 border-green-1"
                              : "border-[#E5E5E5]"
                              }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <hr className="border-[#E5E5E5] mt-5" />

                  {/* Cash on Delivery */}
                  {(!paymentMethod || paymentMethod === "cashondelivery") && (
                    <div className="flex justify-between mt-5">
                      <div className="flex gap-2 items-center">
                        <Image src={cashOnDelivery} alt="cashondelivery-icon" />
                        <span className="text-[#030303] text-[16px] font-medium">
                          {placeholders["cash_on_delivery" as keyof typeof placeholders] ??
                            "Cash on Delivery"}
                        </span>
                      </div>
                      <div>
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() =>
                            setPaymentMethod((prev) =>
                              prev === "cashondelivery" ? "" : "cashondelivery"
                            )
                          }
                        >
                          <span
                            className={`h-[24px] w-[24px] rounded-full border ${paymentMethod === "cashondelivery"
                              ? "border-4 border-green-1"
                              : "border-[#E5E5E5]"
                              }`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="w-full flex items-center justify-between">
                <span className="text-[15px] text-[#030303] font-normal">
                  {!paymentMethod
                    ? placeholders.choose_payment_method
                    : placeholders.choose_another_payment_method}
                </span>
                <Image
                  src={addIcon}
                  alt="add-icon"
                  className="cursor-pointer"
                  onClick={() => {
                    setToogleChoose(true);
                    setPaymentMethod("");
                  }}
                />
              </div>
            </div>

            {/* Pay Button */}
            <DoodleButton
              type="submit"
              disabled={isLoading || paymentMethod === ""}
              className="disabled:opacity-50 disabled:cursor-not-allowed  disabled:pointer-none cursor-pointer hidden md:block w-full border-green-1  bg-green-1  text-white font-medium py-3 rounded-lg transition"
            >
              {isLoading ? (
                <BeatLoader color="#ffffff" size={8} />
              ) : (
                placeholders.pay_now
              )}
            </DoodleButton>
          </div>
          {/* Right Section */}
          <div className="p-5 md:p-8 ">
            <div className="  md:w-[364px] bg-white  ">
              {/* Product Info */}
              {/* <div className="flex items-start gap-4">
                <Image
                  src={product?.data?.shopId && shopData?.image
                    ? shopData.image
                    : product?.data?.ownerId && ownerData?.image
                      ? ownerData.image
                      : noImageAvtar} // replace with actual product image
                  alt="Red Cowboy Hat"
                  width={100}
                  height={100}
                  unoptimized
                  className="rounded-xl h-[76px] w-[76px] object-cover"
                />
                <div>
                  <p className="text-sm text-[#4B514F] text-[14px]">
                    {product?.data?.shopId
                      ? shopData?.title
                      : product?.data?.ownerId
                        ? ownerData?.name
                        : ""}
                  </p>
                  <h2 className="font-medium text-[#030303] text-[16px]">
                    {product?.data?.title ?? ""}
                  </h2>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                    <span className="text-sm font-medium">{avgRating.toFixed(1)}</span>
                    <span className="text-sm text-gray-500">
                      (                  {reviewCount}
                      ) {reviewCount === 1 ? placeholders.review : placeholders.reviews}
                    </span>
                  </div>
                </div>
              </div> */}

              {/* <hr className="my-4 border-[#E5E5E5]" /> */}

              {/* Price Breakdown */}
              <div className="space-y-2 text-[#4B514F] text-[15px] font-light">
                <div className="flex justify-between">
                  <span>{placeholders.subtotal}</span>
                  <span>
                    {placeholders.Rs} {subtotal.toLocaleString()}
                  </span>
                </div>
                {deliveryMethod === "delivery" && (
                  <div className="flex justify-between">
                    <span>{placeholders.delivery_fee}</span>
                    <span>
                      {placeholders.Rs} {DELIVERY_FEE.toLocaleString()}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>{placeholders.sale_tax}</span>
                  <span>
                    {placeholders.Rs} {SALES_TAX.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Total */}
              <div className="flex justify-between font-medium text-[15px] mt-3">
                <span>{placeholders.total_pay}</span>
                <span>
                  {placeholders.Rs} {totalAmount.toLocaleString()}
                </span>
              </div>
              <DoodleButton
                disabled={isLoading || paymentMethod === ""}
                type="submit"
                className="disabled:opacity-50 disabled:cursor-not-allowed  cursor-pointer md:hidden mt-5 w-full border-green-1 hover:border-[1px] bg-green-1 hover:bg-white hover:text-green-1  text-white font-medium py-3 rounded-lg transition"
              >
                {isLoading ? (
                  <BeatLoader color="white" size={8} />
                ) : (
                  placeholders.pay_now
                )}
              </DoodleButton>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Cart;
