import React, { useCallback, useEffect, useState } from 'react'
import { assets } from '../../assets/assets'
import Title from '../../components/Title'
import { useAppContext } from '../../context/AppContext';
import toast from 'react-hot-toast';

const amenityOptions = [
    'Free WiFi',
    'Free Breakfast',
    'Room Service',
    'Mountain View',
    'Pool Access'
]

const createImageSlots = (images = []) => Array.from({ length: 4 }, (_, index) => ({
    preview: images[index] || '',
    existingUrl: images[index] || '',
    file: null
}))

const ListRoom = () => {

    const { axios, getToken, user, refreshOwnerDashboard } = useAppContext()
    const [rooms, setRooms] = useState([])
    const [ownerHotels, setOwnerHotels] = useState([])
    const [selectedHotelId, setSelectedHotelId] = useState('')
    const [editingRoom, setEditingRoom] = useState(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [editForm, setEditForm] = useState({
        roomType: '',
        pricePerNight: '',
        amenities: [],
        images: createImageSlots()
    })

    // Fetch Rooms of the Hotel Owner
    const fetchRooms = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/rooms/owner', { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                setRooms(data.rooms)
            }
            else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [axios, getToken])

    const fetchOwnerHotels = useCallback(async () => {
        try {
            const { data } = await axios.get('/api/hotels/owner', { headers: { Authorization: `Bearer ${await getToken()}` } })
            if (data.success) {
                setOwnerHotels(data.hotels)
                setSelectedHotelId((prev) => prev || data.hotels[0]?._id || '')
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }, [axios, getToken])

    // Toggle Availability of the Room
    const toggleAvailability = useCallback(async (roomId) => {
        const { data } = await axios.post("/api/rooms/toggle-availability", { roomId }, { headers: { Authorization: `Bearer ${await getToken()}` } })
        if (data.success) {
            toast.success(data.message)
            fetchRooms()
        } else {
            toast.error(data.message)
        }
    }, [axios, getToken, fetchRooms])

    const openEditModal = (room) => {
        setEditingRoom(room)
        setEditForm({
            roomType: room.roomType,
            pricePerNight: room.pricePerNight,
            amenities: room.amenities || [],
            images: createImageSlots(room.images || [])
        })
    }

    const closeEditModal = () => {
        if (isSaving) return
        setEditingRoom(null)
        setEditForm({ roomType: '', pricePerNight: '', amenities: [], images: createImageSlots() })
    }

    const toggleAmenity = (amenity) => {
        setEditForm((prev) => ({
            ...prev,
            amenities: prev.amenities.includes(amenity)
                ? prev.amenities.filter((item) => item !== amenity)
                : [...prev.amenities, amenity]
        }))
    }

    const updateImageSlot = (index, file) => {
        setEditForm((prev) => ({
            ...prev,
            images: prev.images.map((image, imageIndex) => {
                if (imageIndex !== index) return image

                if (!file) {
                    return { preview: '', existingUrl: '', file: null }
                }

                return {
                    preview: URL.createObjectURL(file),
                    existingUrl: '',
                    file
                }
            })
        }))
    }

    const removeImageSlot = (index) => {
        setEditForm((prev) => ({
            ...prev,
            images: prev.images.map((image, imageIndex) => imageIndex === index ? { preview: '', existingUrl: '', file: null } : image)
        }))
    }

    const updateRoom = async (event) => {
        event.preventDefault()

        if (!editingRoom) return
        if (!editForm.roomType || !editForm.pricePerNight) {
            toast.error('Room type and price are required')
            return
        }

        const keptImages = editForm.images.filter((image) => image.existingUrl).map((image) => image.existingUrl)
        const newImages = editForm.images.filter((image) => image.file).map((image) => image.file)

        if (keptImages.length + newImages.length === 0) {
            toast.error('At least one room image is required')
            return
        }

        try {
            setIsSaving(true)
            const formData = new FormData()
            formData.append('roomType', editForm.roomType)
            formData.append('pricePerNight', editForm.pricePerNight)
            formData.append('amenities', JSON.stringify(editForm.amenities))
            formData.append('existingImages', JSON.stringify(keptImages))
            newImages.forEach((image) => formData.append('images', image))

            const { data } = await axios.put(`/api/rooms/${editingRoom._id}`, formData, { headers: { Authorization: `Bearer ${await getToken()}` } })

            if (data.success) {
                toast.success(data.message)
                closeEditModal()
                fetchRooms()
                refreshOwnerDashboard()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const deleteRoom = async (roomId) => {
        const confirmed = window.confirm('Delete this room? This will also remove related bookings for this room.')
        if (!confirmed) return

        try {
            setIsDeleting(true)
            const { data } = await axios.delete(`/api/rooms/${roomId}`, { headers: { Authorization: `Bearer ${await getToken()}` } })

            if (data.success) {
                toast.success(data.message)
                if (editingRoom?._id === roomId) {
                    closeEditModal()
                }
                fetchRooms()
                refreshOwnerDashboard()
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setIsDeleting(false)
        }
    }

    // Fetch Rooms when user is logged in
    useEffect(() => {
        if (user) {
            fetchRooms()
            fetchOwnerHotels()
        }
    }, [user, fetchOwnerHotels, fetchRooms])

    const filteredRooms = selectedHotelId
        ? rooms.filter((room) => room.hotel?._id === selectedHotelId)
        : rooms

    return (
        <div className='min-w-0'>
            <Title align='left' font='outfit' title='Room Listings' subTitle='View, edit, or manage all listed rooms. Keep the information up-to-date to provide the best experience for users.' />
            <p className='text-gray-500 mt-8'>Total Rooms: {rooms.length}</p>
            {ownerHotels.length > 0 && (
                <div className='mt-6 max-w-sm'>
                    <label htmlFor='hotelSelector' className='block text-sm font-medium text-gray-700'>Select Hotel</label>
                    <select
                        id='hotelSelector'
                        value={selectedHotelId}
                        onChange={(e) => setSelectedHotelId(e.target.value)}
                        className='mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none'
                    >
                        {ownerHotels.map((hotel) => {
                            const hotelRoomsCount = rooms.filter((room) => room.hotel?._id === hotel._id).length

                            return (
                                <option key={hotel._id} value={hotel._id}>
                                    {hotel.name} ({hotelRoomsCount})
                                </option>
                            )
                        })}
                    </select>
                </div>
            )}

            <div className='mt-4 w-full max-w-5xl overflow-x-auto rounded-lg border border-gray-300 bg-white text-left'>
                <table className='min-w-[640px] w-full'>
                    <thead className='bg-gray-50'>
                        <tr>
                            <th className='py-3 px-4 text-gray-800 font-medium'>Name</th>
                            <th className='py-3 px-4 text-gray-800 font-medium max-sm:hidden'>Facility</th>
                            <th className='py-3 px-4 text-gray-800 font-medium'>Price / night</th>
                            <th className='py-3 px-4 text-gray-800 font-medium text-center'>Actions</th>
                        </tr>
                    </thead>
                    <tbody className='text-sm'>
                        {filteredRooms.length > 0 ? filteredRooms.map((item) => (
                            <tr key={item._id}>
                                <td className='py-3 px-4 text-gray-700 border-t border-gray-300'>{item.roomType}</td>
                                <td className='py-3 px-4 text-gray-400 border-t border-gray-300 max-sm:hidden'>{item.amenities.join(', ')}</td>
                                <td className='py-3 px-4 text-gray-400 border-t border-gray-300'>{item.pricePerNight}</td>
                                <td className='py-3 px-4 border-t border-gray-300 text-center'>
                                    <div className='flex flex-col sm:flex-row items-center justify-center gap-3'>
                                        <label className="relative inline-flex items-center cursor-pointer text-gray-900 gap-3">
                                            <input type="checkbox" className="sr-only peer" onChange={() => toggleAvailability(item._id)} checked={item.isAvailable} />
                                            <div className="w-12 h-7 bg-slate-300 rounded-full peer peer-checked:bg-blue-600 transition-colors duration-200"></div>
                                            <span className="dot absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-transform duration-200 ease-in-out peer-checked:translate-x-5"></span>
                                        </label>
                                        <button type='button' onClick={() => openEditModal(item)} className='rounded border border-blue-200 px-3 py-1 text-blue-600 cursor-pointer'>
                                            Edit
                                        </button>
                                        <button type='button' onClick={() => deleteRoom(item._id)} disabled={isDeleting} className='rounded border border-red-200 px-3 py-1 text-red-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'>
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan='4' className='py-8 px-4 text-center text-gray-500 border-t border-gray-300'>
                                    {ownerHotels.length > 0 ? 'No rooms found for the selected hotel.' : 'No rooms added yet.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {editingRoom && (
                <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6'>
                    <form onSubmit={updateRoom} className='max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl'>
                        <div className='flex items-start justify-between gap-4'>
                            <div>
                                <p className='text-2xl font-semibold text-gray-800'>Edit Room</p>
                                <p className='mt-1 text-sm text-gray-500'>Update the room details shown on your dashboard.</p>
                            </div>
                            <button type='button' onClick={closeEditModal} className='text-sm text-gray-500 cursor-pointer'>
                                Close
                            </button>
                        </div>

                        <div className='mt-5 grid gap-4 sm:grid-cols-2'>
                            <div>
                                <p className='text-gray-800'>Room Type</p>
                                <select className='mt-1 w-full rounded border border-gray-300 p-2' value={editForm.roomType} onChange={(e) => setEditForm({ ...editForm, roomType: e.target.value })}>
                                    <option value=''>Select Room Type</option>
                                    <option value='Single Bed'>Single Bed</option>
                                    <option value='Double Bed'>Double Bed</option>
                                    <option value='Luxury Room'>Luxury Room</option>
                                    <option value='Family Suite'>Family Suite</option>
                                </select>
                            </div>
                            <div>
                                <p className='text-gray-800'>Price / night</p>
                                <input type='number' min='0' className='mt-1 w-full rounded border border-gray-300 p-2' value={editForm.pricePerNight} onChange={(e) => setEditForm({ ...editForm, pricePerNight: e.target.value })} />
                            </div>
                        </div>

                        <div className='mt-4'>
                            <p className='text-gray-800'>Amenities</p>
                            <div className='mt-2 grid gap-2 sm:grid-cols-2'>
                                {amenityOptions.map((amenity) => (
                                    <label key={amenity} className='flex items-center gap-2 text-sm text-gray-600'>
                                        <input type='checkbox' checked={editForm.amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />
                                        <span>{amenity}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className='mt-4'>
                            <p className='text-gray-800'>Room Images</p>
                            <div className='mt-2 grid grid-cols-2 gap-4 sm:grid-cols-4'>
                                {editForm.images.map((image, index) => (
                                    <div key={index} className='relative'>
                                        <label htmlFor={`editRoomImage${index}`} className='block cursor-pointer overflow-hidden rounded-lg border border-gray-200'>
                                            <img
                                                src={image.preview || assets.uploadArea}
                                                alt={`room-image-${index + 1}`}
                                                className='h-24 w-full object-cover'
                                            />
                                            <input
                                                id={`editRoomImage${index}`}
                                                type='file'
                                                accept='image/*'
                                                hidden
                                                onChange={(e) => updateImageSlot(index, e.target.files?.[0] || null)}
                                            />
                                        </label>
                                        <button
                                            type='button'
                                            onClick={() => removeImageSlot(index)}
                                            className='absolute right-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white cursor-pointer'
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className='mt-2 text-xs text-gray-500'>Click an image slot to replace it, or remove a slot before saving.</p>
                        </div>

                        <div className='mt-6 flex justify-end gap-3'>
                            <button type='button' onClick={closeEditModal} className='rounded border border-gray-300 px-4 py-2 text-gray-700 cursor-pointer'>
                                Cancel
                            </button>
                            <button type='submit' disabled={isSaving} className='rounded bg-primary px-5 py-2 text-white cursor-pointer disabled:cursor-not-allowed disabled:opacity-60'>
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    )
}

export default ListRoom