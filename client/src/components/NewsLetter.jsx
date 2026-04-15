import Title from './Title'
import { assets } from '../assets/assets'

const NewsLetter = () => {
    return (
        <div className='mx-4 my-20 flex w-auto max-w-5xl flex-col items-center rounded-2xl bg-gray-900 px-4 py-12 text-white md:mx-6 md:py-16 lg:mx-auto lg:w-full'>
            <Title title="Stay Inspired" subTitle="Join our newsletter and be the first to discover new destinations, exclusive offers, and travel inspiration." />
            <div className='mt-6 flex w-full max-w-2xl flex-col items-stretch justify-center gap-4 md:flex-row'>
                <input type="text" className='w-full rounded border border-white/20 bg-white/10 px-4 py-2.5 outline-none' placeholder='Enter your email' />
                <button className='flex items-center justify-center gap-2 rounded bg-black px-4 py-2.5 transition-all active:scale-95 group md:px-7'>
                    Subscribe
                    <img src={assets.arrowIcon} alt="arrow-icon" className='w-3.5 invert group-hover:translate-x-1 transition-all' />
                </button>
            </div>
            <p className='text-gray-500 mt-6 text-xs text-center'>By subscribing, you agree to our Privacy Policy and consent to receive updates.</p>
        </div>
    )
}

export default NewsLetter