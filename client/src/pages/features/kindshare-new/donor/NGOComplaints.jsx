import { useEffect,useState } from "react";
import { useParams } from "react-router-dom";

export default function NGOComplaints(){

const { ngoId } = useParams();

const [complaints,setComplaints] = useState([]);
const [name,setName] = useState("");
const [issue,setIssue] = useState("");

useEffect(()=>{

fetch(`http://localhost:3000/api/kindshare/complaints/ngo/${ngoId}`)
.then(res=>res.json())
.then(data=>setComplaints(data));

},[ngoId]);

const submitComplaint = async()=>{

await fetch(
"http://localhost:3000/api/kindshare/complaints",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
ngoId,
donorName:name,
issue
})
}
);

alert("Complaint submitted");

};

return(

<div className="p-6">

<h2 className="text-xl font-bold mb-4">
Complaint History
</h2>

{complaints.map(c=>(
<div key={c.id} className="border p-3 mb-3">

<p><b>Name:</b> {c.donorName}</p>
<p><b>Issue:</b> {c.issue}</p>

</div>
))}

<h2 className="text-xl font-bold mt-6 mb-3">
Submit Complaint
</h2>

<input
placeholder="Your Name"
className="border p-2 w-full mb-2"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

<textarea
placeholder="Issue"
className="border p-2 w-full mb-3"
value={issue}
onChange={(e)=>setIssue(e.target.value)}
/>

<button
className="bg-red-500 text-white px-4 py-2 rounded"
onClick={submitComplaint}
>
Submit Complaint
</button>

</div>

);

}