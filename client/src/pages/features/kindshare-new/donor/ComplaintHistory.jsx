import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

export default function ComplaintHistory(){

const {ngoId}=useParams();

const [complaints,setComplaints]=useState([]);

useEffect(()=>{

fetch(
`http://localhost:3000/api/kindshare/complaints/${ngoId}`
)
.then(res=>res.json())
.then(data=>setComplaints(data));

},[]);

return(

<div className="p-6">

<h2 className="text-2xl font-bold mb-6">
Complaint History
</h2>

{complaints.map(c=>(

<div key={c.id} className="border p-4 mb-4">

<p><b>Issue:</b> {c.issue}</p>

<p>{c.description}</p>

</div>

))}

</div>

);

}