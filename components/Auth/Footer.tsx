import React from 'react'
import FazaLogo from '@/assets/icons/fazal-logo.svg'
import Image from 'next/image'
import Link from 'next/link'
import { useDictionary } from '@/dictionaries/DictionaryProvider'
function Footer() {
    const { placeholders } = useDictionary();
    return (
        <div className=' w-full flex flex-col gap-2 justify-center items-center'>
            <Image src={FazaLogo} alt='faza-logo' />
            <div className="flex w-full max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1">
                <Link href='/contact-us' className='text-green-1 text-[12px] font-normal'> {placeholders["contact" as keyof typeof placeholders] ?? "Contact"}</Link>
                <div className='h-1 w-1 bg-green-1 rounded-full'></div>
                <Link href='/terms-conditions' className='text-green-1 text-[12px] font-normal'>{placeholders["terms_condition" as keyof typeof placeholders] ?? "Terms and Conditions"}</Link>
                <div className='h-1 w-1 bg-green-1 rounded-full'></div>
                <Link href='/privacy-policy' className='text-green-1 text-[12px] font-normal'>{placeholders["privacy_policy" as keyof typeof placeholders] ?? "Privacy Policy"}</Link>
            </div>
        </div>
    )
}

export default Footer