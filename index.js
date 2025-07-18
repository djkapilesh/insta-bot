require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "mybot123";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PDF_LINK = process.env.PDF_LINK;

// ✅ Webhook Verification (GET request from Meta to verify)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("✅ Webhook verified by Meta");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// ✅ Handle incoming IG comments (POST request)
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.entry) {
    for (const entry of body.entry) {
      const changes = entry.changes || [];

      for (const change of changes) {
        if (change.field === 'comments' && change.value) {
          const commentText = change.value.message;
          const commenterId = change.value.from.id;

          console.log(`💬 New comment: ${commentText} from user ${commenterId}`);

          if (commentText.toLowerCase().includes("guide")) {
            await sendDM(commenterId);
          }
        }
      }
    }
  }

  res.sendStatus(200);
});

// ✅ Send DM to commenter
async function sendDM(userId) {
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${ACCESS_TOKEN}`,
      {
        recipient: { id: userId },
        message: {
          text: `📘 Here’s your free PDF guide: ${PDF_LINK}`
        },
        messaging_type: "MESSAGE_TAG",
        tag: "POST_PURCHASE_UPDATE"
      }
    );

    console.log('📩 DM sent successfully!', response.data);
  } catch (error) {
    const errMsg = error.response ? JSON.stringify(error.response.data) : error.message;
    console.error('❌ Failed to send DM:', errMsg);
  }
}

// ✅ Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`🚀 Server is live on port ${PORT}`);
});
