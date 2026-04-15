import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { assets } from "../assets/assets";

const HotelReg = () => {
    const { setShowHotelReg, axios, getToken, fetchUser, refreshOwnerDashboard, isOwner } = useAppContext();

    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [contact, setContact] = useState("");
    const [city, setCity] = useState("");


    const onSubmitHandler = async (event) => {
        try {
            event.preventDefault();

            const { data } = await axios.post(`/api/hotels/`, { name, contact, address, city }, { headers: { Authorization: `Bearer ${await getToken()}` } });

            if (data.success) {
                toast.success(data.message);
                if (fetchUser) await fetchUser(); // Refetch user data to update isOwner
                refreshOwnerDashboard?.();
                setShowHotelReg(false);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.message);
        }
    };


    return (
        <div onClick={() => setShowHotelReg(false)} className="fixed top-0 bottom-0 left-0 right-0 z-100 flex items-center justify-center overflow-y-auto bg-black/70 px-3 py-6">
            <form onSubmit={onSubmitHandler} onClick={(e) => e.stopPropagation()} className="flex w-full max-w-4xl overflow-hidden rounded-xl bg-white max-md:mx-0" >
                <img src={assets.regImage} alt="reg-image" className='w-1/2 rounded-xl hidden md:block' />
                <div className="relative flex w-full flex-col items-center p-6 md:w-1/2 md:p-10">
                    <img src={assets.closeIcon} alt="close-icon" className='absolute top-4 right-4 h-4 w-4 cursor-pointer' onClick={() => setShowHotelReg(false)} />
                    <p className="mt-6 text-center text-2xl font-semibold">{isOwner ? 'Add Another Hotel' : 'Register Your Hotel'}</p>
                    <div className="w-full mt-4">
                        <label htmlFor="name" className="font-medium text-gray-500">Hotel Name</label>
                        <input onChange={(e) => setName(e.target.value)} value={name} placeholder="Type here" className="border border-gray-200 rounded w-full px-3 py-2.5 mt-1 outline-indigo-500 font-light" type="text" required />
                    </div>

                    <div className="w-full mt-4">
                        <label htmlFor="contact" className="font-medium text-gray-500">Phone</label>
                        <input id="contact" onChange={(e) => setContact(e.target.value)} value={contact} placeholder="Type here" className="border border-gray-200 rounded w-full px-3 py-2.5 mt-1 outline-indigo-500 font-light" type="text" required />
                    </div>

                    <div className="w-full mt-4">
                        <label htmlFor="address" className="font-medium text-gray-500">Address</label>
                        <textarea id="address" rows="2" onChange={(e) => setAddress(e.target.value)} value={address} placeholder="Type here" className="border border-gray-200 rounded w-full px-3 py-2.5 mt-1 outline-indigo-500 font-light resize-none" type="text" required />
                    </div>

                    <div className="w-full mt-4">
                        <label htmlFor="city" className="font-medium text-gray-500">Hotel Location</label>
                        <input id="city" onChange={(e) => setCity(e.target.value)} value={city} placeholder="Enter your city" className="border border-gray-200 rounded w-full px-3 py-2.5 mt-1 outline-indigo-500 font-light" type="text" required />
                    </div>

                    <button className="mt-6 mr-auto rounded bg-indigo-500 px-6 py-2 text-white transition-all cursor-pointer hover:bg-indigo-600">
                        Register
                    </button>
                </div>
            </form>
        </div>
    );
};

export default HotelReg;
