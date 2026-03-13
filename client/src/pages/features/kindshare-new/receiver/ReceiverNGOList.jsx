import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ReceiverComplaintForm from "./ReceiverComplaintForm";
import ReceiverComplaintHistory from "./ReceiverComplaintHistory";

export default function ReceiverNGOList(){

  const [ngos,setNgos] = useState([]);
  const [selectedNGO,setSelectedNGO] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  const params = new URLSearchParams(location.search);

  const category = params.get("category");
  const lat = params.get("lat");
  const lon = params.get("lon");

  useEffect(()=>{

    fetch(`http://localhost:3000/api/kindshare/ngos?category=${category}&lat=${lat}&lon=${lon}`)
      .then(res=>res.json())
      .then(data=>setNgos(data));

  },[category,lat,lon]);

  return(

    <div className="p-6">

      <h2 className="text-2xl font-bold mb-6">
        NGOs providing {category}
      </h2>

      {ngos.map(ngo=>(

        <div key={ngo.id} className="border p-4 rounded shadow mb-4 bg-white">

          <h3 className="text-lg font-bold">
            {ngo.name}
          </h3>

          <p>Rating ⭐ {ngo.rating}</p>

          <p>
            Distance 📍
            {ngo.distance
              ? Number(ngo.distance).toFixed(2)
              : "Unknown"} km
          </p>

          {/* View Items */}
          <button
            className="bg-green-500 text-white px-3 py-1 rounded mt-2 mr-2"
            onClick={()=>navigate(`/kindshare/receiver/donations/${ngo.id}?category=${category}`)}
          >
            View Available Items
          </button>

          {/* Complaint Button */}
          <button
            className="bg-red-500 text-white px-3 py-1 rounded mt-2"
            onClick={()=>setSelectedNGO(ngo)}
          >
            File Complaint and View History
          </button>
         
            {selectedNGO?.id === ngo.id && (

          <ReceiverComplaintHistory
          ngoId={ngo.id}
          />

          )}

          {/* Complaint Form */}
          {selectedNGO?.id === ngo.id && (

            <ReceiverComplaintForm
              ngoId={ngo.id}
              ngoName={ngo.name}
            />

          )}

        </div>

      ))}

    </div>

  )

}