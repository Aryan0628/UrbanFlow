import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function NGOList() {

  const [ngos,setNgos] = useState([]);

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);

  const category = params.get("category");
  const lat = params.get("lat");
  const lon = params.get("lon");
  console.log("Donor location:", lat, lon);

  useEffect(()=>{

    fetch(`http://localhost:3000/api/kindshare/ngos?category=${category}&lat=${lat}&lon=${lon}`)
      .then(res=>res.json())
      .then(data=>setNgos(data));

  },[category,lat,lon]);

  return (

    <div className="p-6">

      <h2 className="text-2xl font-bold mb-6">
        NGOs accepting {category}
      </h2>

      {ngos.map(ngo => (

        <div
        key={ngo._id || ngo.id}
        className="border p-4 rounded shadow mb-4 bg-white">

          <h3 className="text-lg font-bold">
            {ngo.name}
          </h3>

          <p>Admin: {ngo.adminName}</p>

          <p>Address: {ngo.address}</p>

          <p>Categories: {ngo.categories.join(", ")}</p>

          <p>Rating ⭐ {ngo.rating}</p>

          <p>
            Distance 📍
            {ngo.distance
              ? Number(ngo.distance).toFixed(2)
              : "Unknown"} km
          </p>

          <button
          className="bg-green-500 text-white px-4 py-2 mt-3 rounded"
          onClick={()=>navigate(`/donate/${ngo._id || ngo.id}`)}
          >
          Donate to this NGO
          </button>
          <button
            className="bg-red-500 text-white px-3 py-1 rounded mt-2"
            onClick={()=>navigate(`/kindshare/complaints/${ngo.id}`)}
            >
            View Complaints
            </button>

        </div>

      ))}

    </div>
  );
}