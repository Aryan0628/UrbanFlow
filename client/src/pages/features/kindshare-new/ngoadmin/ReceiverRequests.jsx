import { useEffect, useState } from "react";

export default function ReceiverRequests(){

const [requests,setRequests] = useState([]);

const ngoId = localStorage.getItem("ngoId");
const updateStatus = async(id,status)=>{

await fetch(
`http://localhost:3000/api/kindshare/requests/${id}/status`,
{
method:"PUT",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({status})
}
);

setRequests(prev =>
prev.map(r =>
r.id===id ? {...r,status} : r
)
);

};
useEffect(()=>{

fetch(`http://localhost:3000/api/kindshare/requests/ngo/${ngoId}`)
.then(res=>res.json())
.then(data=>setRequests(data));

},[ngoId]);

return(

<div>

<h2 className="text-2xl font-bold mb-6">
Receiver Requests
</h2>

{requests.length === 0 && (
<p>No receiver requests yet.</p>
)}

{requests.map(req => (

<div
key={req.id}
className="border p-4 mb-4 rounded bg-white shadow"
>

<p><b>Name:</b> {req.receiverName}</p>

<p><b>Email:</b> {req.receiverEmail}</p>

<p><b>Phone:</b> {req.receiverPhone}</p>

<p><b>Address:</b> {req.receiverAddress}</p>

<p><b>Status:</b> {req.status}</p>
<div className="flex gap-3 mt-3">

<button
className={`px-3 py-1 rounded text-white ${
req.status === "pending"
? "bg-green-500"
: "bg-gray-400 cursor-not-allowed"
}`}
disabled={req.status !== "pending"}
onClick={()=>updateStatus(req.id,"accepted")}
>
Accept
</button>

<button
className={`px-3 py-1 rounded text-white ${
req.status === "pending"
? "bg-red-500"
: "bg-gray-400 cursor-not-allowed"
}`}
disabled={req.status !== "pending"}
onClick={()=>updateStatus(req.id,"rejected")}
>
Reject
</button>

<button
className={`px-3 py-1 rounded text-white ${
req.status === "accepted"
? "bg-yellow-500"
: "bg-gray-400 cursor-not-allowed"
}`}
disabled={req.status !== "accepted"}
onClick={()=>updateStatus(req.id,"donated")}
>
Donated
</button>

</div>

</div>

))}

</div>

);

}