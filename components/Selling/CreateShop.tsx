"use client";
import React, { useEffect, useRef, useState } from "react";
import chevDown from "@/assets/icons/chev-down-icon.svg";
import { BeatLoader } from "react-spinners";
import chevron from "@/assets/icons/chev-down-icon.svg";
import addIcon from "@/assets/icons/add.svg";

import Image from "next/image";
import { useDictionary } from "@/dictionaries/DictionaryProvider";
import toast from "react-hot-toast";
import DoodleButton from "@/components/Ui/DoodleButton";
import { useClickOutside } from "@/custom-hooks/useClickOutside";
import { useDebounce } from "use-debounce";
import { useGetLocationsQuery } from "@/store/services/authService";
import locationIcon from "@/assets/icons/location-icon.svg";
import { useCreateShopMutation } from "@/store/services/sellingService";
import ShopCreated from "./ShopCreated";
interface Location {
  description?: string;
  type?: string;
  coordinates?: {
    lat?: number;
    lng?: number;
  };
}
function CreateShop() {
  const [status, setStatus] = useState("form");
  const [createdData, setCreatedData] = useState<{ id: string }>({ id: "" });
  const { placeholders, error_messages, pages, info_messages } =
    useDictionary();
  const locationRef = useRef<HTMLDivElement | null>(null);
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [location, setLocation] = useState<Location>({});
  const [createShop, { isLoading, isSuccess, isError, error, data }] =
    useCreateShopMutation();
  const [locationError, setLocationError] = useState("");
  const [profile, setProfile] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  //   const [email, setEmail] = useState("");
  //   const [emailError, setEmailError] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [debouncedLocationSearch] = useDebounce(locationSearch, 500);
  const [description, setDescription] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const {
    data: locationsData,
    isLoading: isLocationsLoading,
    isFetching: isLocationsFetching,
  } = useGetLocationsQuery(
    {
      q: debouncedLocationSearch,
    },
    { skip: locationSearch?.trim() == "" || locationSearch == null }
  );

  useClickOutside(locationRef, () => {
    setIsLocationOpen(false);
  });

  useEffect(() => {
    if (isSuccess) {
      toast.success(data?.message);
      const timer = setTimeout(() => {
        setStatus("success");
        setCreatedData(data?.data);
      }, 500);

      return () => clearTimeout(timer);
    }
    if (isError && "data" in error) {
      toast.error(
        (error?.data as { message?: string })?.message ||
        "something went wrong!"
      );
    }
  }, [isSuccess, isError, data, error]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let isValid: boolean = true;
    const checkField = (
      value: string,
      setter: React.Dispatch<React.SetStateAction<string>>,
      message: string
    ) => {
      if (value?.trim() === "") {
        setter(message);
        isValid = false;
      } else {
        setter("");
      }
    };

    checkField(name, setNameError, error_messages.shop_name_required);
    checkField(
      description,
      setDescriptionError,
      error_messages.description_required
    );
    if (Object.keys(location).length === 0) {
      setLocationError(error_messages.shop_location_required);
      isValid = false;
    } else {
      setLocationError("");
    }

    // if (email.trim() === "") {
    //   setEmailError(error_messages.shop_email_required);
    //   isValid = false;
    // } else if (!regex.test(email)) {
    //   setEmailError(error_messages.valid_email);
    //   isValid = false;
    // } else {
    //   setEmailError("");
    // }

    if (isValid) {
      const payload = {
        title: name,
        // email: email,
        address: location?.description,
        location: {
          type: "Point",
          coordinates: [location?.coordinates?.lat, location?.coordinates?.lng],
        },
        description: description,
      };
      const formData = new FormData();
      (Object.keys(payload) as (keyof typeof payload)[]).forEach((key) => {
        const value = payload[key];
        if (value !== undefined) {
          if (key === "location") {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, String(value));
          }
        }
      });

      if (profile && profile !== null) {
        formData.append("image", profile);
      }
      if (banner) {
        formData.append("banner", banner);
      }
      // formData.delete("address");

      createShop(formData);
    }
  };
  return (
    <div>
      <div className="px-6 h-[61px] border-b-[1px] border-gray-9 bg-white w-full  flex justify-center">
        <div className="w-full   flex items-center gap-[6px] font-normal text-[14px] mt-5">
          <span className="text-gray-8">{pages.selling}</span>
          <Image
            src={chevron}
            alt="chevron"
            className="-rotate-90 rtl:rotate-90"
          />
          <span className="text-green-1">{placeholders.create_shop}</span>
        </div>
      </div>
      <div className=" px-6 xl:px-0 flex justify-center">
        {status === "success" ? (
          <ShopCreated id={createdData?.id} />
        ) : (
          <form
            onSubmit={handleSubmit}
            className={`w-full  max-w-[422px] pt-4
             ${isLoading && "pointer-events-none"}
          `}
          >


            <h1 className="font-medium text-[18px] text-black-1">
              {info_messages.add_shop_details}
            </h1>
            <h4 className="text-[14px] font-normal text-gray-8">
              {info_messages.fill_details}
            </h4>
            <label
              htmlFor="shop-banner"
              className="relative mt-4 block w-full cursor-pointer overflow-hidden rounded-[16px] bg-[#E6FBFB]  h-[105px]"
            >
              {banner ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(banner)}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full flex-col items-center justify-center">
                  <span className="text-[14px] font-medium text-green-1 underline">
                    {info_messages.add_banner}
                  </span>
                  <span className="mt-1 text-[12px] font-normal text-[#4B514F]">
                    {info_messages.banner_resolution}
                  </span>
                </span>
              )}
            </label>
            <input
              id="shop-banner"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  setBanner(e.target.files[0]);
                }
              }}
            />
            <div className="mt-5 flex gap-[14px] items-center  w-full ">
              <div className="h-[62px] overflow-hidden  font-medium text-[16px] text-black-2 rounded-[22px] w-[62px] bg-[#E6FBFB] flex items-center justify-center">
                {profile !== null ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={URL.createObjectURL(profile as Blob) ?? ""}
                    alt=""
                    className="object-cover h-full w-full"
                  />
                ) : (
                  <Image src={addIcon} alt="add_icon" className=" " />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setProfile(e.target.files[0]);
                  }
                }}
                id="profile-photo"
              />
              <label
                htmlFor="profile-photo"
                className=" flex flex-col "
              >
                <span className="text-[14px] font-medium text-green-1 underline cursor-pointer"
                > {info_messages.add_logo}</span>
                <span className="mt-1 text-[12px] font-normal text-[#4B514F]">
                  {info_messages.banner_resolution}
                </span>
              </label>
            </div>
            {/*  name */}
            <div className="space-y-1 mt-5 w-full">
              <p
                className={`text-[14px] font-normal  ${nameError ? "text-red-1" : "text-gray-8"
                  }`}
              >
                {info_messages.shop_name}
              </p>
              <input
                type="text"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                className="h-[28px] text-[15px] text-black-1 font-normal focus:outline-none w-full border-gray-9 border-b-[1px] "
              />
              {nameError && (
                <p className="text-red-1 text-[14px] font-normal">
                  {nameError}
                </p>
              )}
            </div>

            {/* email address */}
            {/* <div className="space-y-1 mt-5 w-full">
            <p
              className={`text-[14px] font-normal  ${
                emailError ? "text-red-1" : "text-gray-8"
              }`}
            >
              {info_messages.shop_email}
            </p>
            <input
              type="email"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setEmail(e.target.value)
              }
              value={email}
              className="h-[28px] text-[15px] text-black-1 disabled:text-gray-6  font-normal focus:outline-none w-full border-gray-9 border-b-[1px] "
            />
            {emailError && (
              <p className="text-red-1 text-[14px] font-normal">{emailError}</p>
            )}
          </div> */}

            {/* location */}
            <div className="mt-5 w-full">
              <div
                className={`text-[14px] font-normal w-full ${locationError ? "text-red-1" : "text-gray-8"
                  }`}
              >
                {info_messages.shop_location}
              </div>
              <div ref={locationRef} className="relative inline-block w-full">
                <div
                  className="pb-1 w-full  flex items-center  justify-between mt-1 cursor-pointer"
                  onClick={() => {
                    setIsLocationOpen(!isLocationOpen);
                  }}
                >
                  <h2 className="text-[15px] font-normal text-black-1">
                    {location?.description
                      ? location.description
                      : placeholders.choose_location}
                  </h2>
                  <Image
                    src={chevDown}
                    alt="chev-down"
                    className="h-[16px] w-[12px]"
                    height={100}
                    width={100}
                  />
                </div>
                <div className="h-[1px]  bg-gray-9"></div>
                {isLocationOpen && (
                  <div className="absolute z-20  w-full bg-white pt-1   ">
                    <input
                      type="text"
                      placeholder={placeholders.search_country}
                      className="w-full px-4 font-light py-2 outline-none  text-sm border border-gray-200 rounded-md  "
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                    />
                    <div className="max-h-[250px] border overflow-scroll border-gray-200 rounded-md shadow-md mt-2">
                      {!isLocationsLoading &&
                        !isLocationsFetching &&
                        locationsData?.data?.length > 0 &&
                        locationsData?.data?.map(
                          (data: Location, index: number) => (
                            <div
                              onClick={() => {
                                setLocation(data);
                                setIsLocationOpen(false);
                              }}
                              className="text-[15px]  text-gray-8 px-4 py-2 text-sm cursor-pointer font-light hover:bg-gray-100"
                              key={index}
                            >
                              <div className="flex items-center gap-2">
                                <Image
                                  src={locationIcon}
                                  alt=""
                                  className="h-[18px] w-[14px]"
                                />
                                <div>
                                  <h2>{data?.description}</h2>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      {!isLocationsLoading &&
                        !isLocationsFetching &&
                        locationsData?.data?.length === 0 && (
                          <div className="text-[15px]  text-gray-8 px-4 py-2 text-sm cursor-pointer font-light hover:bg-gray-100">
                            No locations found
                          </div>
                        )}
                      {(isLocationsLoading || isLocationsFetching) && (
                        <div className="w-full space-y-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <div
                              key={index}
                              className="bg-gray-100 h-[40px] animate-pulse"
                            ></div>
                          ))}
                        </div>
                      )}
                      {!locationsData &&
                        !isLocationsLoading &&
                        !isLocationsFetching && (
                          <div className="text-[15px]  text-gray-8 px-4 py-2 text-sm cursor-pointer font-light hover:bg-gray-100">
                            No locations found
                          </div>
                        )}
                    </div>
                  </div>
                )}
                {locationError && (
                  <p className="text-red-1 text-[14px] font-normal">
                    {locationError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1 w-full">
              <Image
                src={locationIcon}
                className="h-[13px] w-[11px]"
                alt="Country Flag"
              />
              <p className="text-[#030303] font-medium text-[14px] underline cursor-pointer">
                {placeholders.choose_map_location}
              </p>
            </div>
            <div className="space-y-1 mt-5 w-full">
              <p
                className={`text-[14px] font-normal  ${descriptionError ? "text-red-1" : "text-gray-8"
                  }`}
              >
                {info_messages.describe_shop}
              </p>
              <textarea
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                draggable={false}
                className="h-[132px] resize-none text-[15px] text-black-1 font-normal focus:outline-none w-full border-gray-9 border-b-[1px] "
              />
              {descriptionError && (
                <p className="text-red-1 text-[14px] font-normal">
                  {descriptionError}
                </p>
              )}
            </div>
            <DoodleButton
              type="submit"
              disabled={isLoading}
              className="mt-6  h-[55px] w-full rounded-[12px] text-white font-medium text-[16px]  bg-green-1 cursor-pointer"
            >
              {isLoading ? (
                <BeatLoader color="white" size={8} />
              ) : (
                info_messages.enter_shop
              )}
            </DoodleButton>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateShop;
