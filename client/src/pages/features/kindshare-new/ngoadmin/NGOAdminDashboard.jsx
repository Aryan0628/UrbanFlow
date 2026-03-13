import { useState } from "react";
import DonationRequests from "./DonationRequests";
import { useNavigate } from "react-router-dom";
import ReceiverRequests from "./ReceiverRequests";
import NGOComplaintsAdmin from "./NGOComplaintsAdmin";
export default function NGOAdminDashboard(){

const [tab,setTab] = useState("requests");
const navigate = useNavigate();
// Get selected NGO
const ngoId = localStorage.getItem("ngoId");
const ngoName = localStorage.getItem("ngoName");

if(!ngoId){

return(

<div className="p-6">

<h2 className="text-xl text-red-600">
No NGO selected. Please select an NGO first.
</h2>

</div>

);

}

return(

<div className="p-6">

<h1 className="text-3xl font-bold mb-2">
NGO Admin Dashboard
</h1>

<p className="text-gray-600 mb-6">
Managing NGO: <b>{ngoName}</b>
</p>

<div className="flex gap-4 mb-6">

<button
className="bg-blue-500 text-white px-4 py-2 rounded"
onClick={()=>setTab("requests")}
>
Donation Requests
</button>

<button
className="bg-purple-500 text-white px-4 py-2 rounded"
onClick={()=>setTab("receiver")}
>
Receiver Requests
</button>
<button
className="bg-red-500 text-white px-4 py-2 rounded"
onClick={()=>setTab("complaints")}
>
View Complaints
</button>
<div>

{tab==="requests" && <DonationRequests/>}

{tab==="receiver" && <ReceiverRequests/>}
{tab==="complaints" && <NGOComplaintsAdmin/>}

</div>
</div>

{tab==="requests" && (
<DonationRequests ngoId={ngoId}/>
)}

</div>

);

}