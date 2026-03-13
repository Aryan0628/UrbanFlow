import { useState } from "react";

export default function ReceiverRequestForm({ donationId, ngoId,onRequestSent }) {

const [name,setName] = useState("");
const [email,setEmail] = useState("");
const [phone,setPhone] = useState("");
const [address,setAddress] = useState("");

const submitRequest = async () => {

await fetch(
"http://localhost:3000/api/kindshare/requests",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
ngoId,
donationId,
receiverName:name,
receiverEmail:email,
receiverPhone:phone,
receiverAddress:address
})
}
);

alert("Request sent to NGO");
onRequestSent(donationId);

};

return(

<div className="border p-4 mt-3 rounded bg-gray-50">

<input
placeholder="Name"
className="border p-2 w-full mb-2"
onChange={(e)=>setName(e.target.value)}
/>

<input
placeholder="Email"
className="border p-2 w-full mb-2"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
placeholder="Phone"
className="border p-2 w-full mb-2"
onChange={(e)=>setPhone(e.target.value)}
/>

<input
placeholder="Address"
className="border p-2 w-full mb-2"
onChange={(e)=>setAddress(e.target.value)}
/>

<button
className="bg-green-600 text-white px-4 py-2 rounded"
onClick={submitRequest}
>
Send Request
</button>

</div>

)

}