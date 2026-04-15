import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <div className='bg-[#F6F9FC] px-6 pt-8 text-gray-500/80 md:px-16 lg:px-24 xl:px-32'>
            <div className='grid gap-10 md:grid-cols-2 xl:grid-cols-[1.3fr_0.7fr_0.7fr_1fr] xl:gap-8'>
                <div className='max-w-80'>
                    <img src={assets.logo} alt="logo" className='mb-4 h-8 md:h-9 invert opacity-80' />
                    <p className='text-sm'>
                        Discover the world's most extraordinary places to stay, from boutique hotels to luxury villas and private islands.
                    </p>
                    <div className='flex items-center gap-3 mt-4'>
                        <img src={assets.instagramIcon} alt="instagram-icon" className='w-6' />
                        <img src={assets.facebookIcon} alt="facebook-icon" className='w-6' />
                        <img src={assets.twitterIcon} alt="twitter-icon" className='w-6' />
                        <img src={assets.linkendinIcon} alt="linkedin-icon" className='w-6' />
                    </div>
                </div>

                <div>
                    <p className='font-playfair text-lg text-gray-800'>COMPANY</p>
                    <ul className='mt-3 flex flex-col gap-2 text-sm'>
                        <li><Link to="/about">About</Link></li>
                        <li><Link to="#">Careers</Link></li>
                        <li><Link to="#">Press</Link></li>
                        <li><Link to="#">Blog</Link></li>
                        <li><Link to="#">Partners</Link></li>
                    </ul>
                </div>

                <div>
                    <p className='font-playfair text-lg text-gray-800'>SUPPORT</p>
                    <ul className='mt-3 flex flex-col gap-2 text-sm'>
                        <li><Link to="#">Help Center</Link></li>
                        <li><Link to="#">Safety Information</Link></li>
                        <li><Link to="#">Cancellation Options</Link></li>
                        <li><Link to="#">Contact Us</Link></li>
                        <li><Link to="#">Accessibility</Link></li>
                    </ul>
                </div>

                <div className='max-w-80'>
                    <p className='font-playfair text-lg text-gray-800'>STAY UPDATED</p>
                    <p className='mt-3 text-sm'>
                        Subscribe to our newsletter for travel inspiration and special offers.
                    </p>
                    <div className='mt-4 flex w-full items-center'>
                        <input type="text" className='h-9 min-w-0 flex-1 rounded-l border border-gray-300 bg-white px-3 outline-none' placeholder='Your email' />
                        <button className='flex items-center justify-center bg-black h-9 w-9 aspect-square rounded-r'>
                            <img src={assets.arrowIcon} alt="arrow-icon" className='w-3.5 invert' />
                        </button>
                    </div>
                </div>
            </div>
            <hr className='border-gray-300 mt-8' />
            <div className='flex flex-col items-center justify-between gap-3 py-5 text-center md:flex-row md:text-left'>
                <p>© {new Date().getFullYear()} QuickStay. All rights reserved.</p>
                <ul className='flex flex-wrap items-center justify-center gap-4'>
                    <li><Link to="#">Privacy</Link></li>
                    <li><Link to="#">Terms</Link></li>
                    <li><Link to="#">Sitemap</Link></li>
                </ul>
            </div>
        </div>
    )
}

export default Footer;