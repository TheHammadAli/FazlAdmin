"use client";

import { useMemo } from "react";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import {
  useGetAllCategoriesQuery,
  type GetAllCategoriesParams,
} from "@/store/services/sellingService";

type CategoriesQueryOptions = Parameters<typeof useGetAllCategoriesQuery>[1];

export function useCategoriesQuery(
  params: GetAllCategoriesParams = "",
  options?: CategoriesQueryOptions,
) {
  const { currentLanguage } = useDictionary();

  const queryArg = useMemo(() => {
    const normalized =
      typeof params === "string"
        ? params
          ? { type: params }
          : {}
        : { ...params };

    return { ...normalized, lang: currentLanguage };
  }, [params, currentLanguage]);

  return useGetAllCategoriesQuery(queryArg, options);
}
