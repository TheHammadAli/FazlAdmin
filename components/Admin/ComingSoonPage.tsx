type ComingSoonPageProps = {
    title: string;
    description: string;
};

function ComingSoonPage({ title, description }: ComingSoonPageProps) {
    return (
        <section>
            <div className="bg-[#F6F8FA] pt-10 pb-5">
                <div className="container mx-auto px-5 lg:px-10">
                    <h1 className="text-[20px] font-semibold text-[#001907] sm:text-[22px]">
                        {title}
                    </h1>
                    <p className="mt-1 text-[12px] font-normal text-gray-11">{description}</p>
                </div>
            </div>

            <div className="bg-white pb-16">
                <div className="container mx-auto px-5 pt-10 lg:px-10">
                    <div className="flex flex-col items-center justify-center rounded-[12px] border border-dashed border-gray-9 py-16 text-center">
                        <p className="text-[15px] font-medium text-[#001907]">Coming soon</p>
                        <p className="mt-1 max-w-[360px] text-[13px] text-gray-11">
                            This section is under development and will be available in a future update.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

export default ComingSoonPage;
