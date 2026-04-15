import { useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import Title from '../../components/Title'
import toast from 'react-hot-toast'
import { useAppContext } from '../../context/AppContext'

const AddRoom = () => {

    const { axios, getToken, fetchRooms, navigate, refreshOwnerDashboard } = useAppContext()

    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })
    const [loading, setLoading] = useState(false);
    const [ownerHotels, setOwnerHotels] = useState([])
    const [selectedHotelId, setSelectedHotelId] = useState('')

    const [inputs, setInputs] = useState({
        roomType: '',
        pricePerNight: 0,
        amenities: {
            'Free WiFi': false,
            'Free Breakfast': false,
            'Room Service': false,
            'Mountain View': false,
            'Pool Access': false
        }
    })

    useEffect(() => {
        const fetchOwnerHotels = async () => {
            try {
                const { data } = await axios.get('/api/hotels/owner', { headers: { Authorization: `Bearer ${await getToken()}` } })
                if (data.success) {
                    setOwnerHotels(data.hotels)
                    if (data.hotels.length === 1) {
                        setSelectedHotelId(data.hotels[0]._id)
                    }
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                toast.error(error.message)
            }
        }

        fetchOwnerHotels()
    }, [axios, getToken])

    const onSubmitHandler = async (e) => {
        e.preventDefault()
        // Check if all inputs are filled
        if (!selectedHotelId || !inputs.roomType || !inputs.pricePerNight || !inputs.amenities || !Object.values(images).some(image => image)) {
            toast.error("Please fill in all the details")
            return;
        }
        setLoading(true);
        try {
            const formData = new FormData()
            formData.append('hotelId', selectedHotelId)
            formData.append('roomType', inputs.roomType)
            formData.append('pricePerNight', inputs.pricePerNight)
            // Converting Amenities to Array & keeping only enabled Amenities
            const amenities = Object.keys(inputs.amenities).filter(key => inputs.amenities[key])
            formData.append('amenities', JSON.stringify(amenities))

            // Adding Images to FormData
            Object.keys(images).forEach((key) => {
                images[key] && formData.append('images', images[key])
            })

            const { data } = await axios.post('/api/rooms/', formData, { headers: { Authorization: `Bearer ${await getToken()}` } })

            if (data.success) {
                toast.success(data.message)
                await fetchRooms()
                refreshOwnerDashboard()
                setInputs({
                    roomType: '',
                    pricePerNight: 0,
                    amenities: {
                        'Free WiFi': false,
                        'Free Breakfast': false,
                        'Room Service': false,
                        'Mountain View': false,
                        'Pool Access': false
                    }
                })
                setImages({ 1: null, 2: null, 3: null, 4: null })
                navigate('/owner/list-room')
            } else {
                toast.error(data.message)
            }

        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmitHandler} className='max-w-4xl'>
            <Title align='left' font='outfit' title='Add Room' subTitle='Fill in the details carefully and accurate room details, pricing, and amenities, to enhance the user booking experience.' />
            <div className='mt-6 max-w-sm'>
                <p className='text-gray-800'>Hotel</p>
                <select className='border opacity-70 border-gray-300 mt-1 rounded p-2 w-full' value={selectedHotelId} onChange={(e) => setSelectedHotelId(e.target.value)}>
                    <option value=''>Select Hotel</option>
                    {ownerHotels.map((hotel) => (
                        <option key={hotel._id} value={hotel._id}>{hotel.name}</option>
                    ))}
                </select>
            </div>
            {/* Upload Area For Images */}
            <p className='text-gray-800 mt-10'>Images</p>
            <div className='my-2 grid grid-cols-2 gap-4 sm:flex sm:flex-wrap'>
                {Object.keys(images).map((key) => (
                    <label key={key} htmlFor={`roomImage${key}`}>
                        <img className='h-20 w-20 rounded-lg object-cover cursor-pointer opacity-80' src={images[key] ? URL.createObjectURL(images[key]) : assets.uploadArea} alt="" />
                        <input type="file" accept='image/*' id={`roomImage${key}`} hidden
                            onChange={e => setImages({ ...images, [key]: e.target.files[0] })} />
                    </label>
                ))}
            </div>

            <div className='mt-4 flex w-full flex-col gap-4 sm:flex-row'>

                <div className='flex-1 sm:max-w-56'>
                    <p className='mt-4 text-gray-800'>Room Type</p>
                    <select className='border opacity-70 border-gray-300 mt-1 rounded p-2 w-full' value={inputs.roomType} onChange={(e) => setInputs({ ...inputs, roomType: e.target.value })}>
                        <option value=''>Select Room Type</option>
                        <option value='Single Bed'>Single Bed</option>
                        <option value='Double Bed'>Double Bed</option>
                        <option value='Luxury Room'>Luxury Room</option>
                        <option value='Family Suite'>Family Suite</option>
                    </select>
                </div>

                <div className='sm:w-40'>
                    <p className='mt-4 text-gray-800'>Price <span className='text-xs'>/night</span></p>
                    <input type="number" placeholder='0' className='border border-gray-300 mt-1 rounded p-2 w-full' value={inputs.pricePerNight} onChange={(e) => setInputs({ ...inputs, pricePerNight: e.target.value })} />
                </div>

            </div>

            <p className='text-gray-800 mt-4'>Amenities</p>
            <div className='mt-1 grid max-w-md gap-2 text-gray-400 sm:grid-cols-2'>
                {Object.keys(inputs.amenities).map((amenity, index) => (
                    <div key={index}>
                        <input type='checkbox' id={`amenities${index + 1}`} checked={inputs.amenities[amenity]}
                            onChange={() => setInputs({ ...inputs, amenities: { ...inputs.amenities, [amenity]: !inputs.amenities[amenity] } })}
                        />
                        <label htmlFor={`amenities${index + 1}`}> {amenity} </label>
                    </div>
                ))}
            </div>

            <button className='bg-primary text-white px-8 py-2 rounded mt-8 cursor-pointer' disabled={loading}>
                {loading ? "Adding..." : "Add Room"}
            </button>
        </form>
    )
}

export default AddRoom
