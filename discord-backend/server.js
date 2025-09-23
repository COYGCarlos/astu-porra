
import express from "express";
import axios from "axios";
import admin from "firebase-admin";

const app = express();

// 🔥 Inicializa Firebase Admin con tu clave privada
admin.initializeApp({
  credential: admin.credential.cert("./firebase-key.json"), // tu archivo de clave privada
});

const clientId = "TU_CLIENT_ID";
const clientSecret = "TU_CLIENT_SECRET";
const redirectUri = "https://coygcarlos.github.io/astu-porra";

// Endpoint al que llamará tu frontend con el "code"
app.get("/api/discord/callback", async (req, res) => {
  const code = req.query.code;

  try {
    // 1. Cambiar code por access_token
    const tokenRes = await axios.post(
      "https://discord.com/api/oauth2/token",
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const accessToken = tokenRes.data.access_token;

    // 2. Obtener datos del usuario
    const userRes = await axios.get("https://discord.com/api/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const discordUser = userRes.data;

    // 3. Crear un token de Firebase con la ID de Discord
    const firebaseToken = await admin
      .auth()
      .createCustomToken(discordUser.id, {
        username: discordUser.username,
        avatar: discordUser.avatar,
      });

    res.json({ firebaseToken });
  } catch (err) {
    console.error(err.response?.data || err);
    res.status(500).json({ error: "Login fallido" });
  }
});

app.listen(3000, () => console.log("Servidor en http://localhost:3000"));
