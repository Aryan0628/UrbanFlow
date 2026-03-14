import express from "express";
<<<<<<< Updated upstream
import { registerNGO, getNGOs,verifyEmail,getNGOByEmail} from "../../controllers/kindshare/ngoController.js";
=======
import { registerNGO, getNGOs,verifyEmail, getNGOsByAdminEmail} from "../../controllers/kindshare/ngoController.js";

>>>>>>> Stashed changes

const router = express.Router();

router.post("/register", registerNGO);

router.get("/", getNGOs);
router.get("/verify/:id", verifyEmail);
<<<<<<< Updated upstream
router.get("/by-email", getNGOByEmail);
=======

router.get("/admin-ngos", getNGOsByAdminEmail);
>>>>>>> Stashed changes

export default router;