require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = "mybot123"; // any unique string you want
const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const PDF_LINK = process.env.PDF_LINK;

// Webhook Verification (GET)
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log("Webhook Verified");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle incoming Instagram comments
app.post('/webhook', async (req, res) => {
  const body = req.body;

  if (body.entry) {
    for (const entry of body.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'comments') {
          const commentText = change.value.message;
          const commenterId = change.value.from.id;
          const mediaId = change.value.media.id;

          console.log(`New comment: ${commentText}`);

          if (commentText.toLowerCase().includes('memory')) {
            await sendDM(commenterId);
          }
        }
      }
    }
  }

  res.sendStatus(200);
});

// Send DM function
async function sendDM(userId) {
  try {
    await axios.post(
      `https://graph.facebook.com/v19.0/me/messages?access_token=${ACCESS_TOKEN}`,
      {
        recipient: { id: userId },
        message: {
          text: `Here’s your Memory Hack PDF 📘: ${PDF_LINK}`
        }
      }
    );
    console.log('DM sent!');
  } catch (err) {
    console.error('Error sending DM:', err.response ? err.response.data : err.message);
  }
}

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
