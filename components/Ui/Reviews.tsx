"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import penUnderline from "@/assets/icons/pen-underline-icon.svg";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import Modal from "@/components/Ui/Modals/Modal";
import AddReviewModal from "@/components/Ui/AddReviewModal";
import { useGetAvgReviewsQuery, useGetReviewsListQuery, useWriteReviewMutation } from "@/store/services/reviewService";
import { getUserId } from "@/utils/getUserId";
import { toast } from "react-hot-toast";
import moment from "moment";
import noImageAvtar from "@/assets/images/no-image-av.png";
import AvatarUi from "./AvatarUi";
import formatFromNowShort from "@/utils/formatFromNowShort";
import { useRequireSignIn } from "@/custom-hooks/useRequireSignIn";

const STAR_EMPTY = "#7878804D";
const STAR_FILLED = "#FFB03A";
const STAR_PATH =
    "M12 3.09l2.35 4.76 5.26.77-3.8 3.7.9 5.24L12 14.9l-4.71 2.47.9-5.24-3.8-3.7 5.26-.77L12 3.09z";

export function AvgRatingStars({
    rating,
    isLoading,
    size = 28,
}: {
    rating: number | undefined;
    isLoading: boolean;
    size?: number;
}) {
    const r = Math.min(5, Math.max(0, Number(rating) || 0));
    const rounded = Math.round(r * 2) / 2;

    return (
        <div className="flex items-center  shrink-0" aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => {
                const full = rounded >= i;
                const half = !full && rounded >= i - 0.5;
                return (
                    <span
                        key={i}
                        className="relative inline-block shrink-0"
                        style={{ width: size, height: size }}
                    >
                        <svg
                            viewBox="0 0 24 24"
                            style={{ width: size, height: size }}
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fill={STAR_EMPTY}
                                stroke={STAR_EMPTY}
                                strokeWidth={1}
                                strokeLinejoin="round"
                                d={STAR_PATH}
                            />
                        </svg>
                        {!isLoading && (full || half) && (
                            <span
                                className="absolute left-0 top-0 h-full overflow-hidden "
                                style={{ width: full ? "100%" : "50%" }}
                            >
                                <svg
                                    viewBox="0 0 24 24"
                                    style={{ width: size, height: size }}
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        fill={STAR_FILLED}
                                        stroke={STAR_FILLED}
                                        strokeWidth={1}
                                        strokeLinejoin="round"
                                        d={STAR_PATH}
                                    />
                                </svg>
                            </span>
                        )}
                    </span>
                );
            })}
        </div>
    );
}

const REVIEW_FEEDBACK_TOAST_MS = 2500;
const REVIEWS_PAGE_SIZE = 2;



type ReviewsProps = {
    type: "product" | "service" | "selling";
    id: string;
    allowAddReview?: boolean;
};

type ReviewItem = {
    _id?: string;
    comment: string;
    rating: number;
    createdAt: string;
    userId: { name: string; image: string };
};

function Reviews({ type, id, allowAddReview }: ReviewsProps) {
    const { requireSignIn } = useRequireSignIn();
    const { placeholders, currentLanguage } = useDictionary();
    type PlaceholderKey = keyof typeof placeholders;
    const ph = (key: PlaceholderKey) => placeholders[key];

    const reviewModalRef = useRef<HTMLDivElement>(null);
    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [visibleReviews, setVisibleReviews] = useState<ReviewItem[]>([]);
    const [writeReview, { isLoading }] = useWriteReviewMutation();
    const { data: reviewsList, isLoading: isLoadingReviewsList } = useGetReviewsListQuery({
        itemId: id,
        itemType: type,
        page: currentPage,
        limit: REVIEWS_PAGE_SIZE,
    });
    const { data: avgReview, isLoading: isLoadingAvgReview } = useGetAvgReviewsQuery(
        { type, id },
        { skip: !id || !type }
    );
    const avgRating = avgReview?.data?.avgRating;
    const reviewCount = avgReview?.data?.count ?? 0;
    const totalPages = Number(reviewsList?.data?.totalPages ?? 1) || 1;
    const canReadMore = totalPages > currentPage;
    const canSeeLess = currentPage > 1 && currentPage >= totalPages;
    const isReviewsLoading = isLoadingReviewsList && visibleReviews.length === 0;

    useEffect(() => {
        setCurrentPage(1);
        setVisibleReviews([]);
    }, [id, type]);

    useEffect(() => {
        const pageReviews: ReviewItem[] = reviewsList?.data?.reviews ?? [];
        if (currentPage === 1) {
            setVisibleReviews(pageReviews);
            return;
        }

        setVisibleReviews((prev) => {
            const seen = new Set(prev.map((review) => review._id));
            const next = [...prev];
            pageReviews.forEach((review) => {
                if (!review._id || !seen.has(review._id)) {
                    next.push(review);
                }
            });
            return next;
        });
    }, [reviewsList?.data?.reviews, currentPage]);

    const handlePaginationClick = () => {
        if (canReadMore) {
            setCurrentPage((prev) => prev + 1);
            return;
        }
        if (canSeeLess) {
            setCurrentPage(1);
            setVisibleReviews([]);
        }
    };
    const handleWriteReview = ({ rating, comment }: { rating: number, comment: string }) => {
        try {
            const body = {
                userId: getUserId() ?? "",
                itemId: id,
                itemType: type,
                rating: rating,
                comment: comment
            }
            writeReview(body).unwrap().then((res) => {
                toast.success(res.message, { duration: REVIEW_FEEDBACK_TOAST_MS });
                window.setTimeout(() => {
                    setReviewModalOpen(false);
                }, REVIEW_FEEDBACK_TOAST_MS);
            }).catch((err: { data?: { message?: string } }) => {
                toast.error(err.data?.message ?? "", {
                    duration: REVIEW_FEEDBACK_TOAST_MS,
                });
                window.setTimeout(() => {
                    setReviewModalOpen(false);
                }, REVIEW_FEEDBACK_TOAST_MS);
            });
        }
        catch (error) {
            console.log(error);

        }

    }

    return (
        <>
            <Modal
                editModalRef={reviewModalRef}
                open={reviewModalOpen}
                setOpen={setReviewModalOpen}
                centered={true}
            >
                <AddReviewModal setOpen={setReviewModalOpen} onSubmit={handleWriteReview} loading={isLoading} />
            </Modal>
            <div className="mt-8 w-full sm:mt-10 md:max-w-[496px]">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:gap-[22px]">
                        <h1 className="text-[17px] font-medium sm:text-[19px]">{ph("reviews")}</h1>
                        <div className="flex flex-wrap items-center gap-1">
                            <div className="pt-0.5 sm:pt-1">
                                <AvgRatingStars
                                    rating={avgRating}
                                    isLoading={isLoadingAvgReview}
                                    size={24}
                                />
                            </div>

                            <span className="text-[13px] font-medium tabular-nums sm:text-[14px]">
                                {isLoadingAvgReview ? (
                                    "…"
                                ) : (
                                    <>
                                        {avgRating != null
                                            ? Number(avgRating).toFixed(1)
                                            : "—"}{" "}
                                        ({reviewCount})
                                    </>
                                )}
                            </span>
                        </div>
                    </div>
                    {allowAddReview && (
                        <button
                            type="button"
                            className="flex shrink-0 items-center gap-2 self-start sm:self-center"
                            onClick={() => requireSignIn(() => setReviewModalOpen(true))}
                        >
                            <Image src={penUnderline} alt="" className="h-4 w-4 sm:h-auto sm:w-auto" />
                            <span className="text-[14px] font-normal text-green-1 hover:underline sm:text-[16px]">
                                {ph("write_a_review")}
                            </span>
                        </button>
                    )}
                </div>
                <div className="mt-6 grid grid-cols-1 gap-5 sm:mt-8 sm:grid-cols-2 sm:gap-6">
                    {isReviewsLoading ? (
                        Array.from({ length: REVIEWS_PAGE_SIZE }).map((_, index) => (
                            <div key={`skeleton-${index}`} className="flex justify-between gap-2 animate-pulse">
                                <div className="flex gap-2">
                                    <div className="h-[34px] w-[34px] rounded-full bg-[#E5E7EB]" />
                                    <div className="space-y-2">
                                        <div className="h-3 w-[110px] rounded bg-[#E5E7EB]" />
                                        <div className="h-4 w-[90px] rounded bg-[#E5E7EB]" />
                                        <div className="h-3 w-[180px] rounded bg-[#E5E7EB]" />
                                        <div className="h-3 w-[140px] rounded bg-[#E5E7EB]" />
                                    </div>
                                </div>
                                <div className="h-3 w-8 rounded bg-[#E5E7EB] mt-1" />
                            </div>
                        ))
                    ) : visibleReviews.length ? (
                        visibleReviews.map((review: ReviewItem, index: number) => (
                            <div
                                key={review._id ?? index}
                                className="flex items-start justify-between gap-2 border-b border-[#E5E7EB] pb-5 last:border-b-0 last:pb-0 sm:border-b-0 sm:pb-0"
                            >
                                <div className="flex min-w-0 flex-1 gap-2">
                                    <div className="h-[34px] w-[34px] shrink-0">
                                        <AvatarUi
                                            image={review?.userId?.image ?? noImageAvtar.src}
                                            name={review?.userId?.name ?? ""}
                                            className="h-[34px] first-letter:capitalize bg-green-1/50 min-w-[34px] w-[34px] rounded-full object-cover"
                                        />
                                    </div>
                                    <div className="min-w-0 flex-1 space-y-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <h2 className="min-w-0 truncate text-[12px] font-medium capitalize text-[#030303]">
                                                {review?.userId?.name ?? ""}
                                            </h2>
                                            <span className="shrink-0 text-[12px] font-light text-[#4B514F] sm:hidden">
                                                {formatFromNowShort(
                                                    review?.createdAt,
                                                    currentLanguage === "ur" ? "ur" : "en",
                                                )}
                                            </span>
                                        </div>
                                        <AvgRatingStars
                                            rating={review?.rating}
                                            isLoading={isLoadingReviewsList}
                                            size={18}
                                        />
                                        <p className="break-words text-[13px] font-light leading-relaxed text-[#4B514F] sm:line-clamp-3">
                                            {review?.comment}
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden shrink-0 text-[13px] font-light text-[#4B514F] sm:block">
                                    {formatFromNowShort(
                                        review?.createdAt,
                                        currentLanguage === "ur" ? "ur" : "en",
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full flex h-[120px] items-center justify-center px-2 text-center text-[14px] text-[#4B514F] sm:h-[150px]">
                            {ph("no_review_available")}
                        </div>
                    )}
                </div>
                {(canReadMore || canSeeLess) && (
                    <button
                        type="button"
                        onClick={handlePaginationClick}
                        className="mt-5 flex h-[44px] w-full cursor-pointer items-center justify-center rounded-[8px] bg-[#F6F6F6] text-[14px] font-medium sm:mt-6 sm:h-[46px]"
                    >
                        {canReadMore ? ph("read_more_reviews") : ph("see_less")}
                    </button>
                )}
            </div>
        </>



    )
}

export default Reviews