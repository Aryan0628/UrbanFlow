import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function DonateItem(){

  const { ngoId } = useParams();
  const navigate = useNavigate();

  const [donorName,setDonorName] = useState("");
  const [donorEmail,setDonorEmail] = useState("");
  const [donorPhone,setDonorPhone] = useState("");
  const [address,setAddress] = useState("");
  const [itemName,setItemName] = useState("");
  const [quantity,setQuantity] = useState("");
  const [description,setDescription] = useState("");
  const [image,setImage] = useState(null);

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (!ngoId) {
      alert("NGO not selected");
      return;
    }

    try {

      let imageUrl = "";

      // Upload image first
      if (image) {

        const formData = new FormData();
        formData.append("image", image);

        const uploadRes = await fetch(
          "http://localhost:3000/api/kindshare/donations/upload-image",
          {
            method: "POST",
            body: formData
          }
        );

        const uploadData = await uploadRes.json();

        imageUrl = uploadData.imageUrl;

      }

      // Submit donation
      const res = await fetch(
        "http://localhost:3000/api/kindshare/donations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ngoId,
            donorName,
            donorEmail,
            donorPhone,
            donorAddress: address,
            itemName,
            quantity,
            description,
            imageUrl,
            status: "pending"
          })
        }
      );

      const data = await res.json();

      navigate(`/donation-status/${data.id}`);

    } catch (error) {

      console.error("Donation submission failed", error);

    }

  };

  return (

    <div className="p-6 max-w-xl mx-auto">

      <h2 className="text-2xl font-bold mb-6">
        Donate Item
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          placeholder="Donor Name"
          className="border p-2 w-full"
          value={donorName}
          onChange={(e)=>setDonorName(e.target.value)}
        />

        <input
          placeholder="Email"
          className="border p-2 w-full"
          value={donorEmail}
          onChange={(e)=>setDonorEmail(e.target.value)}
        />

        <input
          placeholder="Phone Number"
          className="border p-2 w-full"
          value={donorPhone}
          onChange={(e)=>setDonorPhone(e.target.value)}
        />

        <input
          placeholder="Address"
          className="border p-2 w-full"
          value={address}
          onChange={(e)=>setAddress(e.target.value)}
        />

        <input
          placeholder="Item Name"
          className="border p-2 w-full"
          value={itemName}
          onChange={(e)=>setItemName(e.target.value)}
        />

        <input
          placeholder="Quantity"
          className="border p-2 w-full"
          value={quantity}
          onChange={(e)=>setQuantity(e.target.value)}
        />

        <textarea
          placeholder="Item Description"
          className="border p-2 w-full"
          value={description}
          onChange={(e)=>setDescription(e.target.value)}
        />

        <input
          type="file"
          className="border p-2 w-full"
          onChange={(e)=>setImage(e.target.files[0])}
        />

        <button
          className="bg-green-600 text-white p-3 rounded w-full"
        >
          Submit Donation
        </button>

      </form>

    </div>

  );

}