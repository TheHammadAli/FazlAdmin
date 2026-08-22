"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { Facebook, Linkedin, AtSign, Share2 } from "lucide-react";
import DoodleButton from "@/components/Ui/DoodleButton";
import {
    useGetSocialLinksForAdminQuery,
    useUpdateSocialLinksMutation,
} from "@/store/services/adminService";

type SocialLinksForm = {
    facebookUrl: string;
    twitterUrl: string;
    threadsUrl: string;
    linkedinUrl: string;
};

type ApiSocialLinks = {
    facebookUrl?: string | null;
    twitterUrl?: string | null;
    threadsUrl?: string | null;
    linkedinUrl?: string | null;
};

const EMPTY_FORM: SocialLinksForm = {
    facebookUrl: "",
    twitterUrl: "",
    threadsUrl: "",
    linkedinUrl: "",
};

const FIELDS: { key: keyof SocialLinksForm; label: string; icon: typeof Facebook; placeholder: string }[] = [
    { key: "facebookUrl", label: "Facebook", icon: Facebook, placeholder: "https://facebook.com/yourpage" },
    { key: "twitterUrl", label: "X / Twitter", icon: AtSign, placeholder: "https://x.com/yourhandle" },
    { key: "threadsUrl", label: "Threads", icon: Share2, placeholder: "https://threads.net/@yourhandle" },
    { key: "linkedinUrl", label: "LinkedIn", icon: Linkedin, placeholder: "https://linkedin.com/company/yourpage" },
];

function AdminSocialLinks() {
    const { data, isLoading, isFetching } = useGetSocialLinksForAdminQuery(undefined);
    const [updateSocialLinks, { isLoading: isSaving }] = useUpdateSocialLinksMutation();

    const [form, setForm] = useState<SocialLinksForm>(EMPTY_FORM);

    useEffect(() => {
        const links = (data as { data?: ApiSocialLinks } | undefined)?.data;
        if (!links) return;
        setForm({
            facebookUrl: links.facebookUrl ?? "",
            twitterUrl: links.twitterUrl ?? "",
            threadsUrl: links.threadsUrl ?? "",
            linkedinUrl: links.linkedinUrl ?? "",
        });
    }, [data]);

    const loading = isLoading || isFetching;

    async function handleSubmit() {
        try {
            const body: SocialLinksForm = {
                facebookUrl: form.facebookUrl.trim(),
                twitterUrl: form.twitterUrl.trim(),
                threadsUrl: form.threadsUrl.trim(),
                linkedinUrl: form.linkedinUrl.trim(),
            };
            await updateSocialLinks(body).unwrap();
            toast.success("Social links updated");
        } catch (err) {
            const errorData = err as { data?: { message?: string } };
            toast.error(errorData?.data?.message ?? "Something went wrong");
        }
    }

    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        Social Links
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">
                        Manage the social media links shown in the site footer
                    </p>
                </div>
            </div>

            <div className="bg-white pb-10">
                <div className="container mx-auto max-w-[560px] px-5 pt-6 lg:px-10">
                    {loading ? (
                        <div className="space-y-6">
                            {FIELDS.map((field) => (
                                <div key={field.key} className="h-[52px] animate-pulse rounded bg-gray-200" />
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {FIELDS.map((field) => {
                                const Icon = field.icon;
                                return (
                                    <div key={field.key}>
                                        <label
                                            htmlFor={field.key}
                                            className="flex items-center gap-1.5 text-[14px] font-normal text-gray-11"
                                        >
                                            <Icon className="h-4 w-4" strokeWidth={2} />
                                            {field.label}
                                        </label>
                                        <input
                                            id={field.key}
                                            type="url"
                                            value={form[field.key]}
                                            onChange={(event) =>
                                                setForm((prev) => ({ ...prev, [field.key]: event.target.value }))
                                            }
                                            placeholder={field.placeholder}
                                            className="mt-2 w-full border-0 border-b border-gray-9 bg-transparent py-2 text-[14px] text-[#001907] outline-none focus:border-green-1"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    <DoodleButton
                        type="button"
                        disabled={loading || isSaving}
                        onClick={handleSubmit}
                        className="mt-8 h-[40px] min-w-[140px] cursor-pointer rounded-[8px] border border-green-1 bg-green-1 px-4 text-[14px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSaving ? <BeatLoader color="white" size={8} /> : "Save"}
                    </DoodleButton>
                </div>
            </div>
        </section>
    );
}

export default AdminSocialLinks;
