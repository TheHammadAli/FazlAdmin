"use client";
import React, { useEffect, useState } from "react";
import Cart from "./Cart";
import { useGetProductDetailQuery } from "@/store/services/homeService";
import { useSearchParams } from "next/navigation";
import { useGetShopDetailQuery } from "@/store/services/sellingService";
import BuyProductDetail from "./BuyProductDetail";
import BuyProductDetailSkeleton from "./BuyProductDetailSkeleton";
import { useGetProductOwnerDetailQuery } from "@/store/services/authService";
import { useAppSelector } from "@/store/store";
import { useRequireSignIn } from "@/custom-hooks/useRequireSignIn";
import { useRouter } from "next/navigation";
import { getUserId } from "@/utils/getUserId";

function BuyProduct() {
  const router = useRouter();
  const { isGuest, requireSignIn } = useRequireSignIn();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const userId = getUserId() ?? "";
  const cartLineId = searchParams.get("cartLine");
  const initialStep = searchParams.get("step") === "cart" ? "cart" : "product";
  const [step, setStep] = useState<"product" | "cart">(initialStep);
  const cartItems = useAppSelector((state) => state.cartReducer.items);

  const {
    data: product,
    isLoading,
    isFetching,
    isSuccess,
  } = useGetProductDetailQuery(
    { id: id!, ...(userId ? { userId } : {}) },
    {
      skip: !id,
    },
  );
  const shopData = product?.data?.shopId;
  const ownerData = product?.data?.ownerId;

  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    if (!id || !cartLineId) return;
    const line = cartItems.find((item) => item.id === cartLineId);
    if (line && line.productId === id) {
      setSelectedVariants(line.selectedVariants);
    }
  }, [id, cartLineId, cartItems]);

  useEffect(() => {
    if (isGuest && step === "cart") {
      router.push("/signin");
      setStep("product");
    }
  }, [isGuest, step, router]);

  const loading = isLoading || isFetching;

  return (
    <div>
      {step === "product" &&
        (loading ? (
          <BuyProductDetailSkeleton />
        ) : (
          <BuyProductDetail
            setStep={(val) => {
              if (val === "cart") {
                requireSignIn(() => setStep(val));
              } else {
                setStep(val);
              }
            }}
            selectedVariants={selectedVariants}
            setSelectedVariants={setSelectedVariants}
            product={product}
            shopData={shopData}
            ownerData={ownerData}
          />
        ))}
      {step === "cart" && (
        <Cart
          ownerData={ownerData}
          product={product}
          selectedVariants={selectedVariants}
          shopData={shopData}
        />
      )}
    </div>
  );
}

export default BuyProduct;
