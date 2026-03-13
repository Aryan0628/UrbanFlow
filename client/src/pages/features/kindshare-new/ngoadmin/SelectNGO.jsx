import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";

export default function SelectNGO() {

  const { user } = useAuth0();
  const [ngos, setNgos] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {

    if (!user) return;

   fetch(`http://localhost:3000/api/kindshare/ngos/admin-ngos?email=${user.email}`)
      .then(res => res.json())
      .then(data => setNgos(data));

  }, [user]);

  const openDashboard = (ngo) => {

    localStorage.setItem("ngoId", ngo.id);
    localStorage.setItem("ngoName", ngo.name);

    navigate("/kindshare/ngo-admin");

  };

  return (

    <div className="p-6">

      <h2 className="text-2xl font-bold mb-6">
        Select NGO Dashboard
      </h2>

      {ngos.map(ngo => (

        <div key={ngo.id} className="border p-4 mb-4 rounded shadow">

          <h3 className="text-lg font-bold">{ngo.name}</h3>
          <p>{ngo.address}</p>

          <button
            className="bg-green-500 text-white px-4 py-2 mt-2 rounded"
            onClick={() => openDashboard(ngo)}
          >
            Open Dashboard
          </button>

        </div>

      ))}

    </div>

  );

}