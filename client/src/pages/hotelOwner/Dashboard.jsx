import { useCallback, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import Title from '../../components/Title';
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const Dashboard = () => {

    const { currency, user, getToken, axios, fetchUser, fetchRooms, navigate, ownerDashboardRefreshKey } = useAppContext();
    const [isDeletingHotel, setIsDeletingHotel] = useState(false);

    const [dashboardData, setDashboardData] = useState({
        bookings: [],
        totalBookings: 0,
        totalRooms: 0,
        totalRevenue: 0,
    });

    const fetchDashboardData = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/bookings/hotel', { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                setDashboardData(data.dashboardData)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [axios, getToken, toast])

    useEffect(() => {
        if (user) {
            fetchDashboardData();
        }
    }, [user, fetchDashboardData, ownerDashboardRefreshKey]);

    const deleteHotel = async () => {
        const confirmed = window.confirm('Delete your hotel? This will also delete all rooms and related bookings.');
        if (!confirmed) return;

        try {
            setIsDeletingHotel(true);
            const { data } = await axios.delete('/api/hotels/owner', { headers: { Authorization: `Bearer ${await getToken()}` } });

            if (data.success) {
                toast.success(data.message);
                await fetchUser();
                await fetchRooms();
                navigate('/');
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
        <div>
            <Title align='left' font='outfit' title='Dashboard' subTitle='Monitor your room listings, track bookings and analyze revenue—all in one place. Stay updated with real-time insights to ensure smooth operations.' />
            <div className='flex flex-wrap items-start justify-between gap-4 my-8'>
                <div className='flex gap-4 flex-wrap'>
                <div className='bg-primary/3 border border-primary/10 rounded flex p-4 pr-8'>
                    <img className='max-sm:hidden h-10' src={assets.totalBookingIcon} alt="" />
                    <div className='flex flex-col sm:ml-4 font-medium'>
                        <p className='text-blue-500 text-lg'>Total Bookings</p>
                        <p className='text-neutral-400 text-base'>{ dashboardData.totalBookings }</p>
                    </div>
                </div>
                <div className='bg-primary/3 border border-primary/10 rounded flex p-4 pr-8'>
                    <img className='max-sm:hidden h-10' src={assets.listIcon} alt="" />
                    <div className='flex flex-col sm:ml-4 font-medium'>
                        <p className='text-blue-500 text-lg'>Total Rooms</p>
                        <p className='text-neutral-400 text-base'>{ dashboardData.totalRooms }</p>
                    </div>
                </div>
                <div className='bg-primary/3 border border-primary/10 rounded flex p-4 pr-8'>
                    <img className='max-sm:hidden h-10' src={assets.totalRevenueIcon} alt="" />
                    <div className='flex flex-col sm:ml-4 font-medium'>
                        <p className='text-blue-500 text-lg'>Total Revenue</p>
                        <p className='text-neutral-400 text-base'>{currency} { dashboardData.totalRevenue }</p>
                    </div>
                </div>
                </div>
                <button onClick={deleteHotel} disabled={isDeletingHotel} className='rounded border border-red-200 px-5 py-3 text-red-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'>
                    {isDeletingHotel ? 'Deleting Hotel...' : 'Delete Hotel'}
                </button>
            </div>

            <h2 className='text-xl text-blue-950/70 font-medium mb-5'>Recent Bookings</h2>
            {/* Table with heads User Name, Room Name, Amount Paid, Payment Status */}
            <div className='w-full max-w-3xl text-left border border-gray-300 rounded-lg max-h-80 overflow-y-scroll'>
                <table className='w-full' >
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
