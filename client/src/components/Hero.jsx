import { useState } from 'react'
import { assets, cities } from '../assets/assets'
import { useAppContext } from '../context/AppContext';

const Hero = () => {

    const { navigate, getToken, axios, setSearchedCities, user } = useAppContext();
    const [destination, setDestination] = useState("");

    const onSearch = async (e) => {
        e.preventDefault();
        const trimmedDestination = destination.trim();
        if (!trimmedDestination) return;

        navigate(`/rooms?destination=${encodeURIComponent(trimmedDestination)}`);

        if (!user) return;

        // call api to save recent searched city
        await axios.post('/api/user/store-recent-search', { recentSearchedCity: trimmedDestination }, {
            headers: { Authorization: `Bearer ${await getToken()}` }
        });
        // add destination to searchedCities max 3 recent searched cities
        setSearchedCities((prevSearchedCities) => {
            const updatedSearchedCities = [...prevSearchedCities, trimmedDestination];
            if (updatedSearchedCities.length > 3) {
                updatedSearchedCities.shift();
            }
            return updatedSearchedCities;
        });
    }

    return (
        <div className='flex min-h-screen flex-col items-start justify-center bg-[url("/src/assets/heroImage.png")] bg-cover bg-center bg-no-repeat px-4 pb-12 pt-28 text-white md:px-16 md:pb-16 md:pt-32 lg:px-24 xl:px-32'>

            <p className='mt-10 rounded-full bg-[#49B9FF]/50 px-3 py-1 text-sm md:mt-20 md:px-3.5'>The Ultimate Hotel Experience</p>
            <h1 className='mt-4 max-w-2xl font-playfair text-4xl leading-tight font-bold sm:text-5xl md:text-[56px] md:leading-[56px] md:font-extrabold'>Discover Your Perfect Gateway Destination</h1>
            <p className='mt-3 max-w-2xl text-sm md:text-base'>Unparalleled luxury and comfort await at the world's most exclusive hotels and resorts. Start your journey today.</p>

            <form onSubmit={onSearch} className='mt-8 flex w-full max-w-5xl flex-col gap-4 rounded-2xl bg-white px-4 py-5 text-gray-500 shadow-xl sm:px-6 md:flex-row md:flex-wrap md:items-end'>

                <div className='w-full md:flex-1 md:min-w-44'>
                    <div className='flex items-center gap-2'>
                        <img src={assets.calenderIcon} alt="" className='h-4' />
                        <label htmlFor="destinationInput">Destination</label>
                    </div>
                    <input list='destinations' onChange={e => setDestination(e.target.value)} value={destination} id="destinationInput" type="text" className="mt-1.5 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none" placeholder="Type here" required />
                    {/* Datalist */}
                    <datalist id="destinations">
                        {cities.map((city, index) => (
                            <option key={index} value={city} />
                        ))}
                    </datalist>
                </div>

                <div className='w-full sm:w-[calc(50%-0.5rem)] md:w-auto md:flex-1 md:min-w-36'>
                    <div className='flex items-center gap-2'>
                        <img src={assets.calenderIcon} alt="" className='h-4' />
                        <label htmlFor="checkIn">Check in</label>
                    </div>
                    <input id="checkIn" type="date" className="mt-1.5 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none" />
                </div>

                <div className='w-full sm:w-[calc(50%-0.5rem)] md:w-auto md:flex-1 md:min-w-36'>
                    <div className='flex items-center gap-2'>
                        <img src={assets.calenderIcon} alt="" className='h-4' />
                        <label htmlFor="checkOut">Check out</label>
                    </div>
                    <input id="checkOut" type="date" className="mt-1.5 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none" />
                </div>

                <div className='w-full sm:w-32'>
                    <label htmlFor="guests">Guests</label>
                    <input min={1} max={4} id="guests" type="number" className="mt-1.5 w-full rounded border border-gray-200 px-3 py-2 text-sm outline-none" placeholder="0" />
                </div>

                <button className='flex w-full items-center justify-center gap-1 rounded-md bg-black px-4 py-3 text-white transition-all cursor-pointer sm:w-auto md:ml-auto md:min-w-36' >
                    <img src={assets.searchIcon} alt="searchIcon" className='h-5' />
                    <span>Search</span>
                </button>
            </form>
        </div>
    )
}

export default Hero