import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ComplaintForm from "./ComplaintForm";
import ComplaintHistory from "./DonorComplaintHistory";

export default function NGOList() {

  const [ngos,setNgos] = useState([]);
  const [selectedNGO,setSelectedNGO] = useState(null);

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

      {ngos.map(ngo => {

        const ngoId = ngo._id || ngo.id;

        return (

          <div
          key={ngoId}
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

            {/* Donate Button */}
            <button
              className="bg-green-500 text-white px-4 py-2 mt-3 rounded mr-2"
              onClick={()=>navigate(`/donate/${ngoId}`)}
            >
              Donate to this NGO
            </button>

            {/* View Complaint Button */}
            <button
              className="bg-red-500 text-white px-3 py-1 rounded mt-2"
              onClick={()=>setSelectedNGO(
                selectedNGO === ngoId ? null : ngoId
              )}
            >
              View Complaints and History
            </button>

            {/* Complaint Section */}
            {selectedNGO === ngoId && (

              <div className="mt-4">

                <ComplaintHistory ngoId={ngoId} />

                <ComplaintForm ngoId={ngoId} />

              </div>

            )}

          </div>

        )

      })}

    </div>

  );
}