"use client";
import React, { useEffect, useState } from "react";
import CreateService from "./CreateService";
import ServiceDetail from "./ServiceDetail";
import { useGetUserServiceQuery } from "@/store/services/sellingService";
import { getCookie } from "cookies-next";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import ServiceDetailSkeleton from "../Ui/ServiceDetailPageSkelton";

function Services() {
  const [hasMounted, setHasMounted] = useState(false);
  const id = getCookie("userId");
  const {
    data: service,
    isLoading: serviceLoading,
    isFetching: serviceFetching,
    isError,
  } = useGetUserServiceQuery(id, {
    skip: !id,
    refetchOnMountOrArgChange: true,
  });
  const { error_messages } = useDictionary();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const isQueryLoading = Boolean(id) && (serviceLoading || serviceFetching);
  const loading = !hasMounted || isQueryLoading;
  const hasService = (service?.data?.length ?? 0) > 0;

  return (
    <div>
      {loading && <ServiceDetailSkeleton />}

      {!loading && hasService && (
        <ServiceDetail serviceData={service?.data?.[0]} />
      )}

      {!loading && !hasService && <CreateService />}

      {hasMounted && isError && (
        <div className="flex h-[80vh] w-full items-center justify-center text-red-1">
          {error_messages.something_went_wrong}
        </div>
      )}
    </div>
  );
}

export default Services;
