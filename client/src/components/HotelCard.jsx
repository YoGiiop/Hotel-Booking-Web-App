import { Link } from 'react-router-dom'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext';

const HotelCard = ({room,index}) => {

    const { currency } = useAppContext();

    return (
        <Link to={'/rooms/' + room._id} onClick={() => scrollTo(0, 0)} key={room._id} className='relative w-full max-w-70 overflow-hidden rounded-xl bg-white text-gray-500/90 shadow-[0px_4px_4px_rgba(0,0,0,0.05)]'>
            <img src={room.images?.[0] || assets.defaultHotelImg} alt="hotel-img" draggable="false" className='h-56 w-full object-cover' />
            {index % 2 === 0 && <p className='px-3 py-1 absolute top-3 left-3 text-xs bg-white text-gray-800 font-medium rounded-full'>Best Seller</p>}
            <div className='p-4 pt-5'>
                <div className='flex items-start justify-between gap-3'>
                    <p className='font-playfair text-xl font-medium text-gray-800 break-words'>{room.hotel?.name || 'Hotel'}</p>
                    <div className='flex shrink-0 items-center gap-1'>
                        <img src={assets.starIconFilled} alt="star-icon" /> 4.5
                    </div>
                </div>
                <div className='mt-1 flex items-start gap-1 text-sm'>
                    <img src={assets.locationIcon} alt="location-icon" className='mt-0.5 shrink-0' />
                    <span className='break-words'>{room.hotel?.address || 'Address unavailable'}</span>
                </div>
                <div className='mt-4 flex items-center justify-between gap-3'>
                    <p><span className='text-xl text-gray-800'>{currency}{room.pricePerNight}</span>/night</p>
                    <button className='rounded border border-gray-300 px-4 py-2 text-sm font-medium transition-all cursor-pointer hover:bg-gray-50'>Book Now</button>
                </div>
            </div>
        </Link>
    )
}

export default HotelCard