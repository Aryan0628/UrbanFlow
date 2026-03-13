import { useEffect, useState } from "react";

export default function KindShareAdmin() {

  const [ngos,setNgos] = useState([]);
  const [stats, setStats] = useState({});

  useEffect(()=>{

    fetch("http://localhost:3000/api/kindshare/admin/pending-ngos")
      .then(res=>res.json())
      .then(data=>setNgos(data));
    fetch("http://localhost:3000/api/kindshare/admin/stats")
      .then(res => res.json())
      .then(data => setStats(data));

  },[]);



  const approve = async(id)=>{

    await fetch(
      `http://localhost:3000/api/kindshare/admin/approve/${id}`,
      {method:"PATCH"}
    );

    setNgos(ngos.filter(n=>n.id !== id));

  };


  const reject = async(id)=>{

    await fetch(
      `http://localhost:3000/api/kindshare/admin/reject/${id}`,
      {method:"PATCH"}
    );

    setNgos(ngos.filter(n=>n.id !== id));

  };


return (

  <div className="p-8">

    <h1 className="text-3xl font-bold mb-6">
      KindShare NGO Approvals
    </h1>

    {/* ADMIN STATS DASHBOARD */}

    <div className="grid grid-cols-4 gap-4 mb-8">

      <div className="bg-blue-500 text-white p-4 rounded">
        <h3>Total NGOs</h3>
        <p className="text-2xl">{stats.total}</p>
      </div>

      <div className="bg-yellow-500 text-white p-4 rounded">
        <h3>Pending</h3>
        <p className="text-2xl">{stats.pending}</p>
      </div>

      <div className="bg-green-500 text-white p-4 rounded">
        <h3>Approved</h3>
        <p className="text-2xl">{stats.approved}</p>
      </div>

      <div className="bg-red-500 text-white p-4 rounded">
        <h3>Rejected</h3>
        <p className="text-2xl">{stats.rejected}</p>
      </div>

    </div>

    {/* PENDING NGO LIST */}

    {ngos.length === 0 && (
      <p>No pending NGOs</p>
    )}

    {ngos.map((ngo) => (

      <div key={ngo.id} className="border p-5 mb-4 rounded shadow">

        <h2 className="font-bold text-xl">
          {ngo.name}
        </h2>

        <p>Admin: {ngo.adminName}</p>
        <p>Email: {ngo.email}</p>
        <p>Phone: {ngo.phone}</p>
        <p>Address: {ngo.address}</p>

        <p>
          Categories: {ngo.categories?.join(", ")}
        </p>

        <div className="mt-3">

          <button
            onClick={() => approve(ngo.id)}
            className="bg-green-500 text-white px-4 py-2 mr-3"
          >
            Approve
          </button>

          <button
            onClick={() => reject(ngo.id)}
            className="bg-red-500 text-white px-4 py-2"
          >
            Reject
          </button>

        </div>

      </div>

    ))}

  </div>
);
}