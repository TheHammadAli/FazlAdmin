"use client";

import React, { useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import chevronIcon from "@/assets/icons/chevron.svg";
import crossIcon from "@/assets/icons/cross-icon.svg";
import cartIcon from "@/assets/icons/my-cart.svg";
import noImageAvtar from "@/assets/images/no-image-av.png";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import DoodleButton from "@/components/Ui/DoodleButton";
import { useAppDispatch, useAppSelector } from "@/store/store";
import {
  clearCart,
  removeFromCart,
  updateCartQuantity,
  type CartItem,
} from "@/store/reducers/cartReducer";
import { useGetAvgReviewsQuery } from "@/store/services/reviewService";

const DELIVERY_FEE = 250;
const SALES_TAX = 90;

function StarRating({
  rating,
  reviewCount,
}: {
  rating: number;
  reviewCount: number;
}) {
  const filledStars = Math.min(5, Math.max(0, Math.round(rating)));

  return (
    <div className="mt-1 flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          className={`h-4 w-4 ${index < filledStars
            ? "fill-yellow-400 text-yellow-400"
            : "fill-[#E5E5E5] text-[#E5E5E5]"
            }`}
        />
      ))}
      <span className="ms-1 text-[14px] font-light text-[#4B514F]">
        ({reviewCount})
      </span>
    </div>
  );
}

function CartLineItem({
  item,
  onRemove,
  onUpdateQuantity,
}: {
  item: CartItem;
  onRemove: (id: string) => void;
  onUpdateQuantity: (id: string, quantity: number) => void;
}) {
  const { placeholders } = useDictionary();
  const { data: avgReview } = useGetAvgReviewsQuery(
    { type: "product", id: item.productId },
    { skip: !item.productId },
  );

  const reviewCount = avgReview?.data?.count ?? 0;
  const avgRating = avgReview?.data?.avgRating ?? 0;
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex items-start gap-4 py-5">
      <Image
        src={item.image || noImageAvtar}
        alt={item.title}
        width={76}
        height={76}
        unoptimized
        className="h-[76px] w-[76px] shrink-0 rounded-xl object-cover"
      />

      <div className="min-w-0 flex-1">
        <h3 className="text-[16px] font-medium leading-snug text-[#030303]">
          {item.title}
        </h3>
        <StarRating rating={avgRating} reviewCount={reviewCount} />
        <p className="mt-1 text-[15px] font-medium text-green-1">
          {placeholders.Rs} {lineTotal.toLocaleString()}
        </p>



      </div>

      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          aria-label={placeholders.remove_from_cart}
          onClick={() => onRemove(item.id)}
          className="mt-1 flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-gray-9"
        >
          <Image src={crossIcon} alt="" width={12} height={12} />
        </button>
        <div className=" flex w-fit items-center gap-2 rounded-lg border border-[#E5E5E5] px-2 py-1">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center text-[18px] text-[#030303] hover:bg-gray-9 rounded"
          >
            −
          </button>
          <span className="min-w-[20px] text-center text-[14px] font-medium text-[#030303]">
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
            className="flex h-7 w-7 cursor-pointer items-center justify-center text-[18px] text-[#030303] hover:bg-gray-9 rounded"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

function MyCart() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { placeholders, info_messages } = useDictionary();
  const items = useAppSelector((state) => state.cartReducer.items);

  const productCount = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotal = useMemo(
    () =>
      items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items],
  );

  const totalToPay = subtotal + DELIVERY_FEE + SALES_TAX;

  const ph = (key: keyof typeof placeholders) => placeholders[key];

  const productCountLabel =
    productCount === 1
      ? `1 ${ph("product")}`
      : `${productCount} ${ph("products")}`;

  const handleGoToCheckout = () => {
    const first = items[0];
    if (!first) return;
    router.push(
      `/buy-product?id=${first.productId}&cartLine=${first.id}&step=cart`,
    );
  };

  if (items.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 border-b border-gray-9 flex items-center justify-center">
          <div className="h-[72px] w-full max-w-[522px] flex items-center gap-2 px-4 text-[14px] sm:px-0">
            <span className="text-gray-11">{ph("profile")}</span>
            <Image src={chevronIcon} alt="" className="ltr:rotate-180" />
            <span className="text-green-2">{ph("my_cart")}</span>
          </div>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center px-5 py-10">
          <div className="flex max-w-[320px] flex-col items-center text-center">
            <Image
              src={cartIcon}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12"
            />
            <h2 className="mt-2 text-[22px] font-medium leading-snug text-[#030303]">
              {info_messages.cart_empty}
            </h2>
            <p className=" text-[15px] font-light leading-relaxed text-[#4B514F]">
              {info_messages.cart_empty_subtitle}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-gray-9 flex items-center justify-center">
        <div className="h-[72px] w-full max-w-[522px] flex items-center gap-2 px-4 text-[14px] sm:px-0">
          <span className="text-gray-11">{ph("profile")}</span>
          <Image src={chevronIcon} alt="" className="ltr:rotate-180" />
          <span className="text-green-2">{ph("my_cart")}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-y-auto px-4 pb-8 sm:px-0">
        <div className="w-full max-w-[522px] py-6 lg:px-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-[20px] font-medium text-[#030303]">
                {ph("total")}
              </h1>
              <p className="mt-0.5 text-[14px] font-light text-[#4B514F]">
                {productCountLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => dispatch(clearCart())}
              className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#D3D3D3] px-3 py-2 text-[14px] font-normal text-[#030303] hover:bg-gray-9"
            >
              <Image src={crossIcon} alt="" width={10} height={10} />
              {ph("remove_all")}
            </button>
          </div>

          <div className="mt-2 divide-y divide-[#E5E5E5]">
            {items.map((item) => (
              <CartLineItem
                key={item.id}
                item={item}
                onRemove={(id) => dispatch(removeFromCart(id))}
                onUpdateQuantity={(id, quantity) =>
                  dispatch(updateCartQuantity({ id, quantity }))
                }
              />
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-[16px] font-medium text-[#030303]">
              {ph("summary")}
            </h2>
            <div className="mt-4 space-y-3 text-[15px] font-light text-[#4B514F]">
              <div className="flex justify-between">
                <span>{ph("subtotal")}</span>
                <span className="text-[#030303]">
                  {ph("Rs")} {subtotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{ph("delivery_fee")}</span>
                <span className="text-[#030303]">
                  {ph("Rs")} {DELIVERY_FEE.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>{ph("sale_tax")}</span>
                <span className="text-[#030303]">
                  {ph("Rs")} {SALES_TAX.toLocaleString()}
                </span>
              </div>
            </div>

            <hr className="my-4 border-[#E5E5E5]" />

            <div className="flex justify-between text-[15px] font-medium text-[#030303]">
              <span>{ph("total_pay")}</span>
              <span>
                {ph("Rs")} {totalToPay.toLocaleString()}
              </span>
            </div>

            <DoodleButton
              type="button"
              onClick={handleGoToCheckout}
              className="mt-6 h-[48px] w-full cursor-pointer rounded-xl bg-green-1 text-[16px] font-medium text-white hover:bg-green-2"
            >
              {ph("go_to_checkout")}
            </DoodleButton>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyCart;
