import { useEffect, useState } from "react";

export default function ReceiverComplaintHistory({ ngoId }){

const [complaints,setComplaints] = useState([]);

useEffect(()=>{

fetch(`http://localhost:3000/api/kindshare/complaints/ngo/${ngoId}`)
.then(res=>res.json())
.then(data=>setComplaints(data));

},[ngoId]);

return(

<div className="mt-4">

<h3 className="text-lg font-bold mb-3">
Complaint History
</h3>

{complaints.length === 0 && (
<p>No complaints for this NGO.</p>
)}

{complaints.map(complaint => (

<div key={complaint.id} className="border p-4 mb-4 rounded">

<p><b>Name:</b> {complaint.name}</p>

<p><b>Complaint From:</b> {complaint.complaintFrom}</p>

<p><b>Item / Category:</b> {complaint.itemOrCategory}</p>

<p><b>Issue:</b> {complaint.issue}</p>

</div>

))}

</div>

)

}