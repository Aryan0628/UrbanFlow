import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import ReceiverRequestForm from "./ReceiverRequestForm";

export default function ReceiverDonations(){

const { ngoId } = useParams();

const location = useLocation();
const params = new URLSearchParams(location.search);

const category = params.get("category");

const [donations,setDonations] = useState([]);
const [selectedDonation,setSelectedDonation] = useState(null);
const [requestedItems, setRequestedItems] = useState([]);

useEffect(()=>{

fetch(

`http://localhost:3000/api/kindshare/donations/available/${ngoId}?category=${category}`
)

.then(res=>res.json())
.then(data=>setDonations(data));

},[ngoId,category]);

return(

<div className="p-6">

<h2 className="text-2xl font-bold mb-6">
Available Donations
</h2>

{donations.length === 0 && (
<p>No donations available.</p>
)}

{donations.map(donation => (

<div key={donation.id} className="border p-4 mb-4 rounded">

<p><b>Item:</b> {donation.itemName}</p>

<p><b>Quantity:</b> {donation.quantity}</p>

<p><b>Description:</b> {donation.description}</p>


{donation.imageUrl && (
<img src={donation.imageUrl} className="w-40 mt-2 rounded"/>
)}
<p><button
className={`px-3 py-1 rounded mt-2 text-white ${
requestedItems.includes(donation.id)
? "bg-gray-400 cursor-not-allowed"
: "bg-blue-500"
}`}
disabled={requestedItems.includes(donation.id)}
onClick={()=>setSelectedDonation(donation.id)}
>
{requestedItems.includes(donation.id) ? "Request Sent" : "Request Item"}
</button></p>
{selectedDonation === donation.id && (
<ReceiverRequestForm
donationId={donation.id}
ngoId={ngoId}
onRequestSent={(id)=>{
setRequestedItems(prev => [...prev, id]);
setSelectedDonation(null);
}}
/>
)}

</div>

))}

</div>

)

}