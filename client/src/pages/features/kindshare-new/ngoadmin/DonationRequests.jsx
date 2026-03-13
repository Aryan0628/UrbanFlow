import { useEffect, useState } from "react";

export default function DonationRequests({ ngoId }) {

const [donations,setDonations] = useState([]);
const [loading,setLoading] = useState(true);

useEffect(()=>{

if(!ngoId) return;

fetch(`http://localhost:3000/api/kindshare/donations/ngo/${ngoId}`)
.then(res=>res.json())
.then(data=>{
setDonations(data);
setLoading(false);
});

},[ngoId]);

const updateStatus = async(id,status)=>{

await fetch(
`http://localhost:3000/api/kindshare/donations/${id}/status`,
{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({status})
}
);

// update UI instantly
setDonations(prev =>
prev.map(d =>
d.id===id ? {...d,status} : d
)
);

};

if(loading){
return <p className="p-6">Loading donations...</p>;
}

return(

<div>

<h2 className="text-2xl font-bold mb-6">
Donation Requests
</h2>

{donations.length === 0 && (
<p className="text-gray-500">No donation requests yet.</p>
)}

{donations.map(donation=>(

<div
key={donation.id}
className="border p-4 rounded mb-4 bg-white shadow"
>

<p><b>Donor:</b> {donation.donorName}</p>

<p><b>Email:</b> {donation.donorEmail}</p>

<p><b>Phone:</b> {donation.donorPhone}</p>

<p><b>Item:</b> {donation.itemName}</p>

<p><b>Quantity:</b> {donation.quantity}</p>

<p><b>Description:</b> {donation.description}</p>
<p>{donation.imageUrl && (

<img
src={donation.imageUrl}
alt="Donation item"
className="w-40 mt-3 rounded"
/>

)}</p>

<p>
<b>Status:</b>{" "}
<span className="text-blue-600">
{donation.status}
</span>
</p>

<div className="flex gap-3 mt-3">

<button
className={`px-3 py-1 rounded text-white ${
donation.status === "pending"
? "bg-green-500"
: "bg-gray-400 cursor-not-allowed"
}`}
disabled={donation.status !== "pending"}
onClick={()=>updateStatus(donation.id,"accepted")}
>
Accept
</button>

<button
className={`px-3 py-1 rounded text-white ${
donation.status === "pending"
? "bg-red-500"
: "bg-gray-400 cursor-not-allowed"
}`}
disabled={donation.status !== "pending"}
onClick={()=>updateStatus(donation.id,"rejected")}
>
Reject
</button>

<button
className={`px-3 py-1 rounded text-white ${
donation.status === "accepted"
? "bg-yellow-500"
: "bg-gray-400 cursor-not-allowed"
}`}
disabled={donation.status !== "accepted"}
onClick={()=>updateStatus(donation.id,"available")}
>
Mark Available
</button>

</div>

</div>

))}

</div>

)

}