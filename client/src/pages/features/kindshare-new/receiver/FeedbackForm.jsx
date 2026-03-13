import { useState } from "react";

export default function FeedbackForm({ngoId,ngoName}){

const [name,setName]=useState("");
const [issue,setIssue]=useState("");
const [rating,setRating]=useState(0);

const submitFeedback=async()=>{

await fetch(
"http://localhost:3000/api/kindshare/feedback",
{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
ngoId,
ngoName,
receiverName:name,
issue,
rating
})
}
);

alert("Feedback submitted");

};

return(

<div className="border p-4 rounded mt-3">

<h3 className="font-bold mb-2">
Rate NGO
</h3>

<input
placeholder="Your Name"
className="border p-2 w-full mb-2"
onChange={(e)=>setName(e.target.value)}
/>

<textarea
placeholder="Issue / Comments"
className="border p-2 w-full mb-2"
onChange={(e)=>setIssue(e.target.value)}
/>

<div className="flex gap-2 mb-2">

{[1,2,3,4,5].map(star=>(
<span
key={star}
onClick={()=>setRating(star)}
className={`cursor-pointer text-2xl ${
rating>=star ? "text-yellow-500" : "text-gray-400"
}`}
>
★
</span>
))}

</div>

<button
className="bg-green-600 text-white px-4 py-2 rounded"
onClick={submitFeedback}
>
Submit Feedback
</button>

</div>

)

}