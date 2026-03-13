import { useState } from "react";
import { useParams } from "react-router-dom";

export default function ComplaintForm(){

const {ngoId}=useParams();

const [issue,setIssue]=useState("");
const [description,setDescription]=useState("");
const [email,setEmail]=useState("");

const handleSubmit = async(e)=>{

e.preventDefault();

await fetch(
"http://localhost:3000/api/kindshare/complaints",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({

ngoId,
donorEmail:email,
issue,
description

})
}
);

alert("Complaint submitted");

};

return(

<div className="p-6">

<h2 className="text-2xl font-bold mb-6">
Complaint Form
</h2>

<form onSubmit={handleSubmit} className="space-y-4">

<input
placeholder="Your Email"
className="border p-2 w-full"
onChange={(e)=>setEmail(e.target.value)}
/>

<input
placeholder="Issue"
className="border p-2 w-full"
onChange={(e)=>setIssue(e.target.value)}
/>

<textarea
placeholder="Description"
className="border p-2 w-full"
onChange={(e)=>setDescription(e.target.value)}
/>

<button
className="bg-red-500 text-white p-3 rounded"
>
Submit Complaint
</button>

</form>

</div>

);

}