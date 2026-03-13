import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RegisterNGO() {

  const [ngoName, setNgoName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ngoAddress, setNgoAddress] = useState("");
  const [description, setDescription] = useState("");
  const [categories, setCategories] = useState([]);
  const [lat, setLat] = useState(null);
  const [lon, setLon] = useState(null);
  const navigate = useNavigate();

  const categoryOptions = [
    "Clothes",
    "Books",
    "Medicines",
    "Electronics",
    "Others"
  ];

  const handleCategoryChange = (cat) => {

    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }

  };

  // Fetch GPS Location
  const fetchLocation = () => {

    if (!navigator.geolocation) {
      alert("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition((position) => {

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;

      setLat(latitude);
      setLon(longitude);

      alert("Location detected successfully");

    });

  };

  // Convert address → lat/lon
  const detectAddressLocation = async () => {

  if (!ngoAddress) {
    alert("Enter address first");
    return;
  }

  try {

    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=" +
      encodeURIComponent(ngoAddress);

    const res = await fetch(url);

    const data = await res.json();

    console.log("Geo result:", data);

    if (!data.length) {
      alert("Location not found.")
      return;
    }

    const latitude = parseFloat(data[0].lat);
    const longitude = parseFloat(data[0].lon);

    setLat(latitude);
    setLon(longitude);

    // Replace input with clean address
    setNgoAddress(data[0].display_name);

    alert("Location detected successfully");

  } catch (err) {

    console.error(err);
    alert("Failed to detect location");

  }

};

const handleSubmit = async (e) => {

  e.preventDefault();

  if (!lat || !lon) {
    alert("Please detect location first");
    return;
  }

  if (!ngoName || !adminName || !email) {
    alert("Please fill all required fields");
    return;
  }

  const res = await fetch(
    "http://localhost:3000/api/kindshare/ngos/register",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: ngoName,
        adminName,
        email,
        phone,
        address: ngoAddress,
        description,
        categories,
        lat,
        lon
      })
    }
  );

  const data = await res.json();

  console.log("Saved NGO:", data);

  alert("NGO registered successfully");

  navigate(`/kindshare/ngo-status?id=${data.id}`);

};
  return (

    <div className="p-6 max-w-xl mx-auto">

      <h2 className="text-2xl font-bold mb-6">
        Register Your NGO
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          type="text"
          placeholder="NGO Name"
          className="border p-2 w-full"
          value={ngoName}
          onChange={(e) => setNgoName(e.target.value)}
        />

        <input
          type="text"
          placeholder="Admin Name"
          className="border p-2 w-full"
          value={adminName}
          onChange={(e) => setAdminName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Admin Email"
          className="border p-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="text"
          placeholder="Phone Number"
          className="border p-2 w-full"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {/* Address */}

        <div className="flex gap-2">

          <input
            type="text"
            placeholder="NGO Address"
            className="border p-2 w-full"
            value={ngoAddress}
            onChange={(e) => setNgoAddress(e.target.value)}
          />

          <button
            type="button"
            onClick={detectAddressLocation}
            className="bg-gray-700 text-white px-3 rounded"
          >
            Detect
          </button>

        </div>

        {/* GPS location */}

        <button
          type="button"
          onClick={fetchLocation}
          className="bg-blue-500 text-white p-2 rounded"
        >
          Fetch Current Location
        </button>

        <textarea
          placeholder="NGO Description"
          className="border p-2 w-full"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div>

          <p className="font-semibold mb-2">
            Categories Accepted
          </p>

          {categoryOptions.map((cat) => (

            <label key={cat} className="block">

              <input
                type="checkbox"
                checked={categories.includes(cat)}
                onChange={() => handleCategoryChange(cat)}
              />

              <span className="ml-2">{cat}</span>

            </label>

          ))}

        </div>

        <button
          type="submit"
          className="bg-purple-500 text-white p-3 rounded w-full"
        >
          Register NGO
        </button>

      </form>

    </div>

  );

}