import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useState } from "react";

export default function KindShareHome() {

  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth0();

  const [role, setRole] = useState(null);
  const [ngoName, setNgoName] = useState("");

  // get role
  useEffect(() => {

    if (!isAuthenticated || !user) return;

    const checkRole = async () => {

      try {

        const res = await fetch(
          `http://localhost:3000/api/kindshare/users/role?email=${user.email}`
        );

        const data = await res.json();

        setRole(data.role);

      } catch (err) {
        console.error(err);
      }

    };

    checkRole();

  }, [user, isAuthenticated]);


  // get NGO name
const fetchNGO = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/kindshare/ngos/by-email?email=${user.email}`
      );
      
      // If the backend returns 404, the NGO isn't in the DB yet
      if (!res.ok) {
        console.warn("NGO profile not found for this email.");
        return;
      }

      const data = await res.json();
      if (data.ngoName) {
        setNgoName(data.ngoName);
      }
    } catch (err) {
      console.error("Fetch NGO Error:", err);
    }
  };

  return (
    <div className="p-6">

      <h1 className="text-3xl font-bold mb-6">KindShare</h1>

      <div className="grid grid-cols-3 gap-6">

        <button
          className="bg-green-500 text-white p-6 rounded"
          onClick={() => navigate("/kindshare/donor")}
        >
          Donate Items
        </button>

        <button
          className="bg-blue-500 text-white p-6 rounded"
          onClick={() => navigate("/kindshare/receiver")}
        >
          Receive Items
        </button>

        <button
          className="bg-purple-500 text-white p-6 rounded"
          onClick={() => navigate("/kindshare/register-ngo")}
        >
          Register NGO
        </button>

       {role === "NGO_ADMIN" && (
        <button
          className="bg-orange-500 text-white p-6 rounded font-bold"
          onClick={() => navigate("/kindshare/select-ngo")}
        >
          {/* Dynamically show the name here */}
          {ngoName ? `${ngoName} Dashboard` : "NGO Dashboard"}
        </button>
        

        )}
        <button
            className="bg-purple-500 text-white px-4 py-2 rounded"
            onClick={()=>navigate("/kindshare/my-donations")}
            >
            My Donations
            </button>
        <button
            className="bg-purple-500 text-white px-4 py-2 rounded"
            onClick={()=>navigate("/kindshare/receiver/my-requests")}
            >
            My Requests
            </button>

      </div>

    </div>
  );

}