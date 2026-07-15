"use client";

import ReactPaginate from "react-paginate";

type PaginationProps = {
    pageCount: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    className?: string;
};

function Pagination({
    pageCount,
    currentPage,
    onPageChange,
    className = "",
}: PaginationProps) {
    if (pageCount <= 1) {
        return null;
    }

    return (
        <div className={`py-8 ${className}`.trim()}>
            <ReactPaginate
                breakLabel="..."
                nextLabel="Next"
                previousLabel="Prev"
                onPageChange={({ selected }) => onPageChange(selected + 1)}
                pageRangeDisplayed={3}
                marginPagesDisplayed={1}
                pageCount={pageCount}
                forcePage={currentPage - 1}
                renderOnZeroPageCount={null}
                containerClassName="relative flex w-full items-center justify-center gap-2 px-12"
                pageClassName="inline-flex cursor-pointer"
                pageLinkClassName="flex h-9 min-w-9 items-center justify-center rounded-[6px] border border-gray-9 px-3 text-[14px] text-[#4B514F] transition-colors hover:border-green-1 hover:text-green-1"
                activeLinkClassName="!border-green-1 !bg-green-1 !text-white hover:!text-white"
                previousClassName="absolute left-0 top-1/2 inline-flex -translate-y-1/2"
                nextClassName="absolute right-0 top-1/2 inline-flex -translate-y-1/2"
                previousLinkClassName="flex cursor-pointer h-9 items-center justify-center rounded-[6px] border border-gray-9 px-3 text-[14px] text-[#4B514F] transition-colors hover:border-green-1 hover:text-green-1"
                nextLinkClassName="flex cursor-pointer h-9 items-center justify-center rounded-[6px] border border-gray-9 px-3 text-[14px] text-[#4B514F] transition-colors hover:border-green-1 hover:text-green-1"
                disabledLinkClassName="cursor-not-allowed opacity-40 hover:!border-gray-9 hover:!text-[#4B514F]"
                breakClassName="inline-flex"
                breakLinkClassName="flex h-9 min-w-9 items-center justify-center text-[14px] text-[#4B514F]"
            />
        </div>
    );
}

export default Pagination;
