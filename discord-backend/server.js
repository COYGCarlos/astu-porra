import express from "express";
import axios from "axios";
import admin from "firebase-admin";

const app = express();

// 🔥 Inicializa Firebase Admin usando variable de entorno en Render
const firebaseKey = JSON.parse(process.env.FIREBASE_KEY);
admin.initializeApp({
  credential: admin.credential.cert(firebaseKey),
});

// Usa variables de entorno para mantener tus credenciales seguras
const clientId = process.env.DISCORD_CLIENT_ID;
const clientSecret = process.env.DISCORD_CLIENT_SECRET;
const redirectUri = process.env.DISCORD_REDIRECT_URI;

// Endpoint al que llamará tu frontend con el "code"
app.get("/api/discord/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).json({ error: "No code provided" });

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

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Servidor corriendo en puerto ${port}`));
