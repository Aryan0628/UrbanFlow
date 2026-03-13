import { useState } from "react";
import { useParams } from "react-router-dom";

export default function ComplaintForm({ngoId}){



const [name,setName] = useState("");
const [item,setItem] = useState("");
const [issue,setIssue] = useState("");

const submitComplaint = async () => {

await fetch("http://localhost:3000/api/kindshare/complaints",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
ngoId,
name,
itemOrCategory: item,
issue,
complaintFrom:"Donor"
})
});

alert("Complaint submitted");

};

return(

<div className="border p-4 rounded mt-3">

<h3 className="font-bold mb-2">
Submit Complaint
</h3>

<input
placeholder="Your Name"
className="border p-2 w-full mb-2"
onChange={(e)=>setName(e.target.value)}
/>

<input
placeholder="Item / Category"
className="border p-2 w-full mb-2"
onChange={(e)=>setItem(e.target.value)}
/>

<textarea
placeholder="Describe Issue"
className="border p-2 w-full mb-2"
onChange={(e)=>setIssue(e.target.value)}
/>

<button
className="bg-red-500 text-white px-4 py-2 rounded"
onClick={submitComplaint}
>
Submit Complaint
</button>

</div>

)

}