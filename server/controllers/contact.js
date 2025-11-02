import { google } from "googleapis";

const spreadsheetId = process.env.SPREADSHEET_ID;
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });

export const contact = async (req, res) => {
  const { message, email, emoji } = req.body;
  if (!message) {
    return res.status(400).json({ success: false, message: "You're missing the message itself!" });
  }
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A2:D",
      valueInputOption: "RAW",
      requestBody: {
        values: [[new Date().toISOString(), message, email || "Anonymous", emoji]],
      },
    });
    return res.json({ success: true, message: "Message Sent!" });
  } catch (error) {
    console.error("Error receiving message:", error);
    return res.json({ success: false, message: "Failed to send message" });
  }
};