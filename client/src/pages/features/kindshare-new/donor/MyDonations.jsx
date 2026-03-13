import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";

export default function MyDonations() {

  const { user } = useAuth0();

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    if (!user) return;

    fetch(
      `http://localhost:3000/api/kindshare/donations/donor?email=${user.email}`
    )
      .then(res => res.json())
      .then(data => {
        console.log("Donations fetched:", data); // ⭐ debugging
        setDonations(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load donations", err);
        setLoading(false);
      });

  }, [user]);

  if (loading) {
    return <p className="p-6">Loading donations...</p>;
  }

  return (

    <div className="p-6">

      <h2 className="text-2xl font-bold mb-6">
        My Donations
      </h2>

      {donations.length === 0 && (
        <p className="text-gray-500">
          You have not made any donations yet.
        </p>
      )}

      {donations.map(donation => (

        <div
          key={donation.id}
          className="border p-4 mb-4 rounded shadow bg-white"
        >

          <p><b>Item:</b> {donation.itemName}</p>

          <p><b>Quantity:</b> {donation.quantity}</p>

          <p><b>Description:</b> {donation.description}</p>

          <p>
            <b>Status:</b>{" "}
            <span className={
              donation.status === "accepted"
                ? "text-green-600"
                : donation.status === "rejected"
                ? "text-red-600"
                : "text-yellow-600"
            }>
              {donation.status}
            </span>
          </p>

        </div>

      ))}

    </div>

  );

}