import { useEffect, useState } from "react";
import { assets, roomCommonData } from "../assets/assets";
import { useAppContext } from "../context/AppContext";
import { useParams } from "react-router-dom";
import StarRating from "../components/StarRating";
import toast from "react-hot-toast";

const RoomDetails = () => {
    const { id } = useParams();
    const { facilityIcons, rooms, getToken, axios, navigate } = useAppContext();
    // const room = rooms.find((r) => r._id === id);

    const [room, setRoom] = useState(null);
    const [mainImage, setMainImage] = useState(null);
    const [checkInDate, setCheckInDate] = useState(null);
    const [checkOutDate, setCheckOutDate] = useState(null);
    const [guests, setGuests] = useState(1);

    const [isAvailable, setIsAvailable] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Check if the Room is Available
    const checkAvailability = async () => {
        try {
            //  Check is Check-In Date is greater than Check-Out Date
            if (checkInDate >= checkOutDate) {
                toast.error("Check-In Date should be less than Check-Out Date");
                return;
            }

            const { data } = await axios.post("/api/bookings/check-availability", {
                room: id,
                checkInDate,
                checkOutDate,
            });
            if (data.success) {
                if (data.isAvailable) {
                    setIsAvailable(true);
                    toast.success("Room is available");
                } else {
                    setIsAvailable(false);
                    toast.error("Room is not available");
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        }
    };

    // onSubmitHandler function to check availability & book the room
    const onSubmitHandler = async (e) => {
        try {
            e.preventDefault();
            if (isSubmitting) return;

            if (!isAvailable) {
                return checkAvailability();
            } else {
                setIsSubmitting(true);
                const token = await getToken();
                if (!token) {
                    toast.error("Please sign in again to book this room");
                    setIsSubmitting(false);
                    return;
                }

                const { data } = await axios.post(
                    "/api/bookings/book",
                    {
                        room: id,
                        checkInDate,
                        checkOutDate,
                        guests,
                        paymentMethod: "Pay At Hotel",
                    },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (data.success) {
                    toast.success(data.message);
                    navigate("/my-bookings");
                    scrollTo(0, 0);
                } else {
                    toast.error(data.message);
                }
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const found = rooms.find((r) => r._id === id);
        if (found) {
            setRoom(found);
            setMainImage(found.images?.[0]);
        }
    }, [rooms, id]);

    useEffect(() => {
        // Fetch directly if global rooms state hasn't loaded yet
        if (!room) {
            axios.get(`/api/rooms/${id}`).then(({ data }) => {
                if (data.success && data.room) {
                    setRoom(data.room);
                    setMainImage(data.room.images?.[0]);
                }
            }).catch(() => {});
        }
    }, [id, room, axios]);

    useEffect(() => {
        setIsAvailable(false);
    }, [id, checkInDate, checkOutDate]);

    if (!room) {
        return <div className="text-center mt-40 text-xl">Loading room...</div>;
    }

    return (
        <div className="px-4 py-28 md:px-16 md:py-35 lg:px-24 xl:px-32">
            {/* Room Details */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2">
                <h1 className="text-3xl md:text-4xl font-playfair">
                    {room.hotel?.name || "Hotel"}{" "}
                    <span className="font-inter text-sm">({room.roomType || "Room"})</span>
                </h1>
                <p className="text-xs font-inter py-1.5 px-3 text-white bg-orange-500 rounded-full">
                    20% OFF
                </p>
            </div>
            <div className="flex items-center gap-1 mt-2">
                <StarRating />
                <p className="ml-2">200+ reviews</p>
            </div>
            <div className="flex items-center gap-1 text-gray-500 mt-2">
                <img src={assets.locationIcon} alt="location-icon" />
                <span>{room.hotel?.address || "Address unavailable"}</span>
            </div>

            {/* Room Images */}
            <div className="mt-6 flex flex-col gap-6 lg:flex-row">
                <div className="lg:w-1/2 w-full">
                    <img
                        className="h-72 w-full rounded-xl object-cover shadow-lg sm:h-96"
                        src={mainImage}
                        alt="Room Image"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4 lg:w-1/2 w-full">
                    {room?.images?.length > 1 &&
                        room.images.map((image, index) => (
                            <img
                                key={index}
                                onClick={() => setMainImage(image)}
                                className={`h-32 w-full rounded-xl object-cover shadow-md cursor-pointer sm:h-44 ${mainImage === image && "outline-3 outline-orange-500"
                                    }`}
                                src={image}
                                alt="Room Image"
                            />
                        ))}
                </div>
            </div>

            {/* Room Highlights */}
            <div className="mt-10 flex flex-col gap-4 md:flex-row md:justify-between">
                <div className="flex flex-col">
                    <h1 className="text-3xl md:text-4xl font-playfair">
                        Experience Luxury Like Never Before
                    </h1>
                    <div className="flex flex-wrap items-center mt-3 mb-6 gap-4">
                        {room.amenities.map((item, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100"
                            >
                                <img src={facilityIcons[item]} alt={item} className="w-5 h-5" />
                                <p className="text-xs">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
                {/* Room Price */}
                <p className="text-2xl font-medium">${room.pricePerNight}/night</p>
            </div>

            {/* CheckIn CheckOut Form */}
            <form
                onSubmit={onSubmitHandler}
                className="mx-auto mt-16 flex max-w-6xl flex-col items-start justify-between rounded-xl bg-white p-4 shadow-[0px_0px_20px_rgba(0,0,0,0.15)] sm:p-6 md:flex-row md:items-center"
            >
                <div className="flex w-full flex-col flex-wrap items-start gap-4 text-gray-500 md:flex-row md:items-center md:gap-8 lg:gap-10">
                    <div className="flex w-full flex-col sm:w-[calc(50%-0.5rem)] md:w-auto">
                        <label htmlFor="checkInDate" className="font-medium">
                            Check-In
                        </label>
                        <input
                            onChange={(e) => setCheckInDate(e.target.value)}
                            id="checkInDate"
                            type="date"
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none"
                            placeholder="Check-In"
                            required
                        />
                    </div>
                    <div className="w-px h-15 bg-gray-300/70 max-md:hidden"></div>
                    <div className="flex w-full flex-col sm:w-[calc(50%-0.5rem)] md:w-auto">
                        <label htmlFor="checkOutDate" className="font-medium">
                            Check-Out
                        </label>
                        <input
                            onChange={(e) => setCheckOutDate(e.target.value)}
                            id="checkOutDate"
                            type="date"
                            min={checkInDate}
                            disabled={!checkInDate}
                            className="w-full rounded border border-gray-300 px-3 py-2 mt-1.5 outline-none"
                            placeholder="Check-Out"
                            required
                        />
                    </div>
                    <div className="w-px h-15 bg-gray-300/70 max-md:hidden"></div>
                    <div className="flex w-full flex-col sm:w-32 md:w-auto">
                        <label htmlFor="guests" className="font-medium">
                            Guests
                        </label>
                        <input
                            onChange={(e) => setGuests(e.target.value)}
                            value={guests}
                            id="guests"
                            type="number"
                            className="mt-1.5 w-full rounded border border-gray-300 px-3 py-2 outline-none md:max-w-20"
                            placeholder="0"
                            required
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-6 w-full rounded-md bg-primary px-6 py-3 text-base text-white transition-all cursor-pointer hover:bg-primary-dull active:scale-95 md:mt-0 md:w-auto md:px-10 md:py-4"
                >
                    {isSubmitting ? "Booking..." : isAvailable ? "Book Now" : "Check Availability"}
                </button>
            </form>

            {/* Common Specifications */}
            <div className="mt-25 space-y-4">
                {roomCommonData.map((spec, index) => (
                    <div key={index} className="flex items-start gap-2">
                        <img className="w-6.5" src={spec.icon} alt={`${spec.title}-icon`} />
                        <div>
                            <p className="text-base">{spec.title}</p>
                            <p className="text-gray-500">{spec.description}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="my-15 max-w-3xl border-y border-gray-300 py-10 text-gray-500">
                <p>
                    Guests will be allocated on the ground floor according to
                    availability. You get a comfortable Two bedroom apartment has a true
                    city feeling. The price quoted is for two guest, at the guest slot
                    please mark the number of guests to get the exact price for groups.
                    The Guests will be allocated ground floor according to availability.
                    You get the comfortable two bedroom apartment that has a true city
                    feeling.
                </p>
            </div>

            <div className="flex flex-col items-start gap-4">
                <div className="flex items-start gap-4">
                    <img
                        className="h-14 w-14 md:h-18 md:w-18 rounded-full"
                        src={room?.hotel?.owner?.image || "https://via.placeholder.com/100"} 
                        alt="Host"
                    />
                    <div>
                        <p className="text-lg md:text-xl">Hosted by {room?.hotel?.name || "Hotel"}</p>
                        <div className="flex items-center mt-1">
                            <StarRating />
                            <p className="ml-2">200+ reviews</p>
                        </div>
                    </div>
                </div>
                <button className="px-6 py-2.5 mt-4 rounded text-white bg-primary hover:bg-primary-dull transition-all cursor-pointer">
                    Contact Now
                </button>
            </div>
        </div>
    );
};

export default RoomDetails;
