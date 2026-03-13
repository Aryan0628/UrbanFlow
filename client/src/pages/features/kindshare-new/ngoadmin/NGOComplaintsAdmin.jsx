import { useEffect, useState } from "react";

export default function NGOComplaintsAdmin(){

const [complaints,setComplaints] = useState([]);

const ngoId = localStorage.getItem("ngoId");

useEffect(()=>{

if(!ngoId) return;

fetch(`http://localhost:3000/api/kindshare/complaints/ngo/${ngoId}`)
.then(res=>res.json())
.then(data=>{
console.log("Admin complaints:",data);
setComplaints(data);
});

},[ngoId]);

return(

<div className="p-6">

<h2 className="text-2xl font-bold mb-6">
NGO Complaints
</h2>

{complaints.length === 0 && (
<p>No complaints yet.</p>
)}

{complaints.map(c => (

<div key={c.id} className="border p-4 mb-4 rounded shadow">

<p><b>Name:</b> {c.name}</p>

<p><b>Complaint From:</b> {c.complaintFrom}</p>

<p><b>Item / Category:</b> {c.itemOrCategory}</p>

<p><b>Issue:</b> {c.issue}</p>

</div>

))}

</div>

)

}