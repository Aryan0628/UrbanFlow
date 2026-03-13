import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import FeedbackForm from "./FeedbackForm";
export default function MyRequests(){

const { user } = useAuth0();

const [requests,setRequests] = useState([]);

useEffect(()=>{

if(!user) return;

fetch(
`http://localhost:3000/api/kindshare/requests/receiver?email=${user.email}`
)
.then(res=>res.json())
.then(data=>setRequests(data));

},[user]);

return(

<div className="p-6">

<h2 className="text-2xl font-bold mb-6">
My Requests
</h2>

{requests.length===0 && (
<p>No requests made yet.</p>
)}

{requests.map(req => (

<div
key={req.id}
className="border p-4 mb-4 rounded shadow bg-white"
>

<p><b>NGO:</b> {req.ngoName || req.ngoId}</p>

<p><b>Donation ID:</b> {req.donationId}</p>

<p><b>Status:</b> 
<span className="ml-2 font-semibold text-blue-600">
{req.status}
</span>
</p>
{req.status === "donated" && (

<FeedbackForm
ngoId={req.ngoId}
ngoName={req.ngoName}
/>

)}
</div>

))}

</div>

)

}