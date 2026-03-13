import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ReceiverCategory() {

  const navigate = useNavigate();

  const [address, setAddress] = useState("");
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  const categories = [
    "Clothes",
    "Books",
    "Medicines",
    "Electronics",
    "Others"
  ];

  const fetchLocation = () => {

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition((position) => {

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setLat(latitude);
      setLon(longitude);

      setLoadingLocation(false);

      alert("Location fetched successfully");

    });

  };

  const convertAddress = async () => {

    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${address}`
    );

    const data = await res.json();

    if (!data.length) {
      alert("Address not found");
      return;
    }

    setLat(parseFloat(data[0].lat));
    setLon(parseFloat(data[0].lon));

    alert("Address location detected");

  };

  const handleCategoryClick = (category) => {

    if (!lat || !lon) {
      alert("Please select location first");
      return;
    }

    navigate(
      `/kindshare/receiver/ngos?category=${encodeURIComponent(category)}&lat=${lat}&lon=${lon}`
    );

  };

  return (

    <div className="p-6">

      <h2 className="text-2xl font-bold mb-6">
        Select Your Location
      </h2>

      <button
        onClick={fetchLocation}
        className="bg-blue-500 text-white p-3 rounded mb-4"
      >
        {loadingLocation ? "Fetching..." : "Fetch Current Location"}
      </button>

      <div className="flex gap-2 mb-6">

        <input
          type="text"
          placeholder="Enter your city or address"
          className="border p-2 w-full"
          value={address}
          onChange={(e)=>setAddress(e.target.value)}
        />

        <button
          onClick={convertAddress}
          className="bg-gray-700 text-white px-4 rounded"
        >
          Detect
        </button>

      </div>

      {lat && lon && (
        <p className="text-green-600 mb-4">
          Location selected ✔
        </p>
      )}

      <h2 className="text-xl font-bold mb-4">
        Select Donation Category
      </h2>

      <div className="grid grid-cols-2 gap-4">

        {categories.map((cat)=>(

          <button
            key={cat}
            className="bg-green-400 p-4 rounded"
            onClick={()=>handleCategoryClick(cat)}
          >
            {cat}
          </button>

        ))}

      </div>

    </div>

  );

}