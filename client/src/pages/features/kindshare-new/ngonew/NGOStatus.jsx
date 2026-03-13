import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function NGOStatus() {

  const [ngo, setNgo] = useState(null);

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const id = params.get("id");

  useEffect(() => {

    fetch(`http://localhost:3000/api/kindshare/ngos/status/${id}`)
      .then(res => res.json())
      .then(data => setNgo(data));

  }, [id]);

  if (!ngo) return <p>Loading...</p>;

  return (

    <div className="p-10">

      <h1 className="text-3xl font-bold mb-6">
        NGO Registration Status
      </h1>

      {!ngo.emailVerified && (
        <p className="text-red-500">
          Please verify your email first.
        </p>
      )}

      {ngo.emailVerified && ngo.status === "pending" && (
        <p className="text-yellow-500">
          Email verified. Waiting for admin approval.
        </p>
      )}

      {ngo.status === "approved" && (
        <p className="text-green-600">
           NGO has been approved.
        </p>
      )}

      {ngo.status === "rejected" && (
        <p className="text-red-600">
           NGO registration was rejected.
        </p>
      )}

    </div>

  );

}