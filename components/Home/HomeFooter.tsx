"use client";

import type { ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import FazalLogo from "@/assets/icons/fazal-logo.svg";
import FacebookIcon from "@/assets/icons/facebook.svg";
import ThreadsIcon from "@/assets/icons/mail.svg";
import LinkedInIcon from "@/assets/icons/linked-in.svg";
import XIcon from "@/assets/icons/xicon.svg";
import PhoneIconFooter from "@/assets/icons/phone-icon-footer.svg";
import GmailIconFooter from "@/assets/icons/gmail-icon-footer.svg";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import { useCategoriesQuery } from "@/custom-hooks/useCategoriesQuery";
import { getFeedCategoryLabel } from "@/utils/getFeedCategoryLabel";

type CategoryItem = {
    _id: string;
    name?: string | { en?: string; ur?: string };
};

type FooterLink = {
    label: string;
    href: string;
};

type SocialLink = {
    label: string;
    href: string;
    icon: StaticImageData;
};

const SOCIAL_LINKS: SocialLink[] = [
    { label: "Facebook", href: "#", icon: FacebookIcon },
    { label: "Threads", href: "#", icon: ThreadsIcon },
    { label: "LinkedIn", href: "#", icon: LinkedInIcon },
    { label: "X", href: "#", icon: XIcon },
];

const FOOTER_LINK_CLASS =
    "text-[13px] font-light text-gray-8 transition-colors hover:text-green-1 sm:text-[14px]";

function FooterColumn({
    title,
    children,
    className = "",
}: {
    title: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <div className={`w-max min-w-0 shrink-0 ${className}`}>
            <h3 className="text-[15px] font-medium text-[#030303] sm:text-[16px]">
                {title}
            </h3>
            <div className="mt-3 sm:mt-4">{children}</div>
        </div>
    );
}

function HomeFooter() {
    const router = useRouter();
    const { placeholders, info_messages, pages, currentLanguage } = useDictionary();
    const { data: categories } = useCategoriesQuery({ type: "product" });

    const popularCategories = useMemo(() => {
        const items: FooterLink[] = [
            ...((categories?.data ?? []) as CategoryItem[])
                .slice(0, 4)
                .map((category) => ({
                    label: category.name as string,
                    href: `/home/search-list?tab=products&categoryId=${category._id}`,
                })),
        ];

        return items;
    }, [categories?.data, currentLanguage, pages.home]);

    const companyLinks: FooterLink[] = [
        { label: placeholders.about, href: "/about" },
        { label: placeholders.contact, href: "/contact-us" },
        { label: info_messages.blog, href: "#" },
    ];

    return (
        <footer className="mt-8 bg-[#EEF2F3] -mx-4 px-4 py-8 sm:mt-20 sm:-mx-5 sm:px-5 sm:py-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-10 xl:gap-16">
                <div className="max-w-[320px] shrink-0">
                    <Image
                        src={FazalLogo}
                        alt={placeholders.market}
                        className="h-[38px] w-auto"
                    />
                    <p className="mt-3 max-w-[244px] text-[14px] font-light leading-tight text-gray-8">
                        {info_messages.footer_tagline}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2.5 sm:mt-8">
                        {SOCIAL_LINKS.map(({ label, href, icon }) => (
                            <a
                                key={label}
                                href={href}
                                aria-label={label}
                                className="inline-flex shrink-0  transition-opacity hover:opacity-90"
                            >
                                <Image
                                    src={icon}
                                    alt={label}
                                    className="h-9 w-9 sm:h-10 sm:w-10"
                                />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 xs:grid-cols-2 sm:gap-10 lg:flex lg:shrink-0 lg:gap-10 xl:gap-16">
                    <FooterColumn title={info_messages.popular_categories}>
                        <ul className="">
                            {popularCategories.map((item) => (
                                <li key={`${item.label}-${item.href}`}>
                                    <button
                                        type="button"
                                        onClick={() => router.push(item.href)}
                                        className={`cursor-pointer text-left ${FOOTER_LINK_CLASS}`}
                                    >
                                        {item.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </FooterColumn>

                    <FooterColumn title={placeholders.company}>
                        <ul className="">
                            {companyLinks.map((item) => (
                                <li key={item.label}>
                                    {item.href === "#" ? (
                                        <span className={FOOTER_LINK_CLASS}>
                                            {item.label}
                                        </span>
                                    ) : (
                                        <Link
                                            href={item.href}
                                            className={FOOTER_LINK_CLASS}
                                        >
                                            {item.label}
                                        </Link>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </FooterColumn>

                    <FooterColumn title={info_messages.contact_info} className="xs:col-span-2 lg:col-span-1">
                        <ul className="">
                            <li>
                                <a
                                    href={`tel:${info_messages.footer_phone.replace(/\s/g, "")}`}
                                    className={`inline-flex items-center gap-2 whitespace-nowrap ${FOOTER_LINK_CLASS}`}
                                >
                                    <Image
                                        src={PhoneIconFooter}
                                        alt=""
                                        className=" h-[13px] w-3 shrink-0"
                                    />
                                    <span>{info_messages.footer_phone}</span>
                                </a>
                            </li>
                            <li>
                                <a
                                    href={`mailto:${info_messages.footer_email}`}
                                    className={`inline-flex items-center gap-2 ${FOOTER_LINK_CLASS}`}
                                >
                                    <Image
                                        src={GmailIconFooter}
                                        alt=""
                                        className=" h-[9px] w-[13px] shrink-0"
                                    />
                                    <span>{info_messages.footer_email}</span>
                                </a>
                            </li>
                        </ul>
                    </FooterColumn>
                </div>
            </div>
        </footer>
    );
}

export default HomeFooter;
