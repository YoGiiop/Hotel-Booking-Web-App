import { useCallback, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import Title from '../../components/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const Dashboard = () => {

    const { currency, user, getToken, axios, fetchUser, fetchRooms, navigate, ownerDashboardRefreshKey, setShowHotelReg, refreshOwnerDashboard } = useAppContext();
    const [isDeletingHotel, setIsDeletingHotel] = useState(false);
    const [ownerHotels, setOwnerHotels] = useState([]);
    const [selectedHotelId, setSelectedHotelId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [dashboardData, setDashboardData] = useState({
        bookings: [],
        totalHotels: 0,
        totalBookings: 0,
        totalRooms: 0,
        totalRevenue: 0,
        totalProfit: 0,
    });

    const fetchOwnerHotels = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/hotels/owner', { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                setOwnerHotels(data.hotels)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [axios, getToken])

    const fetchDashboardData = useCallback(async () => {
        try {
            const params = new URLSearchParams()

            if (selectedHotelId) params.set('hotelId', selectedHotelId)
            if (startDate) params.set('startDate', startDate)
            if (endDate) params.set('endDate', endDate)

            const queryString = params.toString()
            const { data } = await axios.get(`/api/bookings/hotel${queryString ? `?${queryString}` : ''}`, { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                setDashboardData((prev) => ({ ...prev, ...data.dashboardData }))
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [axios, endDate, getToken, selectedHotelId, startDate])

    useEffect(() => {
        if (user) {
            fetchDashboardData();
            fetchOwnerHotels();
        }
    }, [user, fetchDashboardData, fetchOwnerHotels, ownerDashboardRefreshKey]);

    useEffect(() => {
        setDashboardData((prev) => ({ ...prev, totalHotels: ownerHotels.length }))
        if (!selectedHotelId && ownerHotels.length === 1) {
            setSelectedHotelId(ownerHotels[0]._id)
        }
    }, [ownerHotels, selectedHotelId]);

    const clearDateFilters = () => {
        setStartDate('')
        setEndDate('')
    }

    const deleteHotel = async (hotelId) => {
        const confirmed = window.confirm('Delete your hotel? This will also delete all rooms and related bookings.');
        if (!confirmed) return;

        try {
            setIsDeletingHotel(true);
            const { data } = await axios.delete(`/api/hotels/${hotelId}`, { headers: { Authorization: `Bearer ${await getToken()}` } });

            if (data.success) {
                toast.success(data.message);
                await fetchUser();
                await fetchRooms();
                await fetchOwnerHotels();
                refreshOwnerDashboard?.();
                if (ownerHotels.length === 1) {
                    navigate('/');
                } else {
                    fetchDashboardData();
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsDeletingHotel(false);
        }
    }

    return (
        <div className='min-w-0'>
            <Title align='left' font='outfit' title='Dashboard' subTitle='Monitor your room listings, track bookings and analyze revenue—all in one place. Stay updated with real-time insights to ensure smooth operations.' />
            <div className='mt-8 grid gap-4 rounded-xl border border-gray-200 p-5 sm:grid-cols-2 xl:grid-cols-4'>
                <div className='sm:col-span-2 xl:col-span-1'>
                    <label htmlFor='hotelFilter' className='block text-sm font-medium text-gray-700'>Hotel</label>
                    <select id='hotelFilter' value={selectedHotelId} onChange={(e) => setSelectedHotelId(e.target.value)} className='mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none'>
                        <option value=''>All Hotels</option>
                        {ownerHotels.map((hotel) => (
                            <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor='startDate' className='block text-sm font-medium text-gray-700'>Start Date</label>
                    <input id='startDate' type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} className='mt-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none' />
                </div>
                <div>
                    <label htmlFor='endDate' className='block text-sm font-medium text-gray-700'>End Date</label>
                    <input id='endDate' type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} className='mt-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none' />
                </div>
                <button onClick={clearDateFilters} className='self-end rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 cursor-pointer'>
                    Clear Dates
                </button>
            </div>
            <div className='my-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5'>
                <div className='flex rounded border border-primary/10 bg-primary/3 p-4'>
                    <img className='max-sm:hidden h-10' src={assets.homeIcon} alt="" />
                    <div className='flex flex-col sm:ml-4 font-medium'>
                        <p className='text-blue-500 text-lg'>Total Hotels</p>
                        <p className='text-neutral-400 text-base'>{ dashboardData.totalHotels }</p>
                    </div>
                </div>
                <div className='flex rounded border border-primary/10 bg-primary/3 p-4'>
                    <img className='max-sm:hidden h-10' src={assets.totalBookingIcon} alt="" />
                    <div className='flex flex-col sm:ml-4 font-medium'>
                        <p className='text-blue-500 text-lg'>Total Bookings</p>
                        <p className='text-neutral-400 text-base'>{ dashboardData.totalBookings }</p>
                    </div>
                </div>
                <div className='flex rounded border border-primary/10 bg-primary/3 p-4'>
                    <img className='max-sm:hidden h-10' src={assets.listIcon} alt="" />
                    <div className='flex flex-col sm:ml-4 font-medium'>
                        <p className='text-blue-500 text-lg'>Total Rooms</p>
                        <p className='text-neutral-400 text-base'>{ dashboardData.totalRooms }</p>
                    </div>
                </div>
                <div className='flex rounded border border-primary/10 bg-primary/3 p-4'>
                    <img className='max-sm:hidden h-10' src={assets.totalRevenueIcon} alt="" />
                    <div className='flex flex-col sm:ml-4 font-medium'>
                        <p className='text-blue-500 text-lg'>Total Revenue</p>
                        <p className='text-neutral-400 text-base'>{currency} { dashboardData.totalRevenue }</p>
                    </div>
                </div>
                <div className='flex rounded border border-primary/10 bg-primary/3 p-4'>
                    <img className='max-sm:hidden h-10' src={assets.totalRevenueIcon} alt="" />
                    <div className='flex flex-col sm:ml-4 font-medium'>
                        <p className='text-blue-500 text-lg'>Profit</p>
                        <p className='text-neutral-400 text-base'>{currency} { dashboardData.totalProfit }</p>
                    </div>
                </div>
            </div>

            <div className='mb-8 rounded-xl border border-gray-200 p-5'>
                <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
                    <div>
                        <p className='text-lg font-medium text-gray-800'>Your Hotels</p>
                        <p className='text-sm text-gray-500'>Manage each hotel separately when you have more than one property.</p>
                    </div>
                    <button onClick={() => setShowHotelReg(true)} className='rounded bg-primary px-4 py-2 text-white cursor-pointer'>
                        Add Hotel
                    </button>
                </div>
                <div className='mt-4 grid gap-3'>
                    {ownerHotels.map((hotel) => (
                        <div key={hotel._id} className='flex flex-col gap-3 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between'>
                            <div>
                                <p className='font-medium text-gray-800'>{hotel.name}</p>
                                <p className='text-sm text-gray-500'>{hotel.city}</p>
                            </div>
                            <button onClick={() => deleteHotel(hotel._id)} disabled={isDeletingHotel} className='rounded border border-red-200 px-4 py-2 text-red-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'>
                                {isDeletingHotel ? 'Deleting...' : 'Delete Hotel'}
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <h2 className='text-xl text-blue-950/70 font-medium mb-5'>Recent Bookings</h2>
            {/* Table with heads User Name, Room Name, Amount Paid, Payment Status */}
            <div className='max-h-80 w-full max-w-5xl overflow-auto rounded-lg border border-gray-300 bg-white text-left'>
                <table className='min-w-[640px] w-full' >
                    <thead className='bg-gray-50'>
                        <tr>
                            <th className='py-3 px-4 text-gray-800 font-medium'>User Name</th>
                            <th className='py-3 px-4 text-gray-800 font-medium max-sm:hidden'>Room Name</th>
                            <th className='py-3 px-4 text-gray-800 font-medium text-center'>Total Amount</th>
                            <th className='py-3 px-4 text-gray-800 font-medium text-center'>Payment Status</th>
                        </tr>
                    </thead>
                    <tbody className='text-sm'>
                        {
                            dashboardData.bookings.map((item, index) => (
                                <tr key={index}>
                                    <td className='py-3 px-4 text-gray-700 border-t border-gray-300'>
                                        {item && item.user && item.user.username ? item.user.username : 'Unknown User'}
                                    </td>
                                    <td className='py-3 px-4 text-gray-400 border-t border-gray-300 max-sm:hidden'>
                                        {item && item.room && item.room.roomType ? item.room.roomType : 'N/A'}
                                    </td>
                                    <td className='py-3 px-4 text-gray-400 border-t border-gray-300 text-center'>
                                        {currency} {item && item.totalPrice ? item.totalPrice : '0'}
                                    </td>
                                    <td className='py-3 px-4  border-t border-gray-300 flex'>
                                        <button className={`py-1 px-3 text-xs rounded-full mx-auto ${item && item.isPaid ? "bg-green-200 text-green-600" : "bg-amber-200 text-yellow-600"}`}>
                                            {item && item.isPaid ? "Completed" : "Pending"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
            </div>

        </div>
    )
}

export default Dashboard
