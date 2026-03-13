import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

export default function DonationStatus(){

const { id } = useParams();

const [donation,setDonation] = useState(null);

useEffect(()=>{

fetch(`http://localhost:3000/api/kindshare/donations/status/${id}`)
.then(res=>res.json())
.then(data=>setDonation(data));

},[id]);

if(!donation){

return <p className="p-6">Loading...</p>;

}

return(

<div className="p-6">

<h2 className="text-2xl font-bold mb-6">
Donation Status
</h2>

<div className="border p-4 rounded">

<p><b>Donor:</b> {donation.donorName}</p>

<p><b>Item:</b> {donation.itemName}</p>

<p><b>Quantity:</b> {donation.quantity}</p>

<p><b>Description:</b> {donation.description}</p>

<p>

<b>Status:</b>
<span className="text-blue-600 ml-2">
{donation.status}
</span>

</p>

</div>

</div>

);

}