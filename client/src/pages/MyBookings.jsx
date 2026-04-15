import { useCallback, useEffect, useState } from 'react'
import Title from '../components/Title'
import { assets } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MyBookings = () => {

    const { axios, getToken, user } = useAppContext();
    const [bookings, setBookings] = useState([]);


    const fetchUserBookings = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/bookings/user', { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                setBookings(data.bookings)
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [axios, getToken])

    const handlePayment = async (bookingId) => {
        try {
            const { data } = await axios.post('/api/bookings/stripe-payment', { bookingId }, { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                window.location.href = data.url
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (user) {
            fetchUserBookings();
        }
    }, [user, fetchUserBookings]);

    return (
        <div className='py-28 md:pb-35 md:pt-32 px-4 md:px-16 lg:px-24 xl:px-32'>
            <Title title='My Bookings' subTitle='Easily manage your past, current, and upcoming hotel reservations in one place. Plan your trips seamlessly with just a few clicks' align='left' />
            <div className="mt-8 w-full max-w-6xl text-gray-800">
                <div className="hidden md:grid md:grid-cols-[3fr_2fr_1fr] w-full border-b border-gray-300 font-medium text-base py-3">
                    <div className="w-1/3">Hotels</div>
                    <div className="w-1/3">Date & Timings</div>
                    <div className="w-1/3">Payment</div>
                </div>

                {bookings.map((booking) => (
                    <div key={booking._id} className="grid w-full grid-cols-1 gap-5 border-b border-gray-300 py-6 first:border-t md:grid-cols-[3fr_2fr_1fr] md:gap-4">
                        <div className="flex flex-col md:flex-row">
                            <img
                                className="h-52 w-full rounded object-cover shadow sm:h-56 md:h-auto md:w-44"
                                src={booking.room?.images && booking.room.images.length > 0 ? booking.room.images[0] : assets.defaultHotelImg}
                                alt="hotel-img"
                            />
                            <div className="mt-3 flex flex-col gap-1.5 md:ml-4 md:mt-0">
                                <p className="font-playfair text-xl md:text-2xl">
                                    {booking.hotel?.name || 'Unknown Hotel'}
                                    <span className="font-inter text-sm"> ({booking.room?.roomType || 'N/A'})</span>
                                </p>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <img src={assets.locationIcon} alt="location-icon" />
                                    <span>{booking.hotel?.address || 'Unknown Address'}</span>
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <img src={assets.guestsIcon} alt="guests-icon" />
                                    <span>Guests: {booking.guests}</span>
                                </div>
                                <p className="text-base">Total: ${booking.totalPrice}</p>
                            </div>
                        </div>

                        <div className="mt-1 flex flex-col gap-4 sm:flex-row sm:gap-8 md:mt-3 md:items-center md:gap-12">
                            <div>
                                <p>Check-In:</p>
                                <p className="text-gray-500 text-sm">{new Date(booking.checkInDate).toDateString()}</p>
                            </div>
                            <div>
                                <p>Check-Out:</p>
                                <p className="text-gray-500 text-sm">{new Date(booking.checkOutDate).toDateString()}</p>
                            </div>
                        </div>

                        <div className="flex flex-col items-start justify-center pt-1 md:pt-3">
                            <div className="flex items-center gap-2">
                                <div className={`h-3 w-3 rounded-full ${booking.isPaid ? "bg-green-500" : "bg-red-500"}`}></div>
                                <p className={`text-sm ${booking.isPaid ? "text-green-500" : "text-red-500"}`}>
                                    {booking.isPaid ? "Paid" : "Unpaid"}
                                </p>
                            </div>
                            {!booking.isPaid && (
                                <button onClick={()=> handlePayment(booking._id)} className="px-4 py-1.5 mt-4 text-xs border border-gray-400 rounded-full hover:bg-gray-50 transition-all cursor-pointer">
                                    Pay Now
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default MyBookings