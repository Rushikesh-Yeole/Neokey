import React, { useState, useContext } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../components/Navbar";
import { AppContext } from "../context/AppContext";
import Footer from "../components/Footer";

const EmojiBar = ({ selectedEmoji, setSelectedEmoji }) => {
  // const emojis = ["👏", "💡", "💢", "🚀", "🔥", "👍", "👎", "⚠", "😇", "😉"];
  const emojis = ["👏", "💡", "🚀", "🔥", "🤝", "⚠", "😇", "😉", "⚙️", "😊", "😕", "❓", "💬"];
    return (
    <div className="flex space-x-2 overflow-x-auto py-4">
      {emojis.map((emoji, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => setSelectedEmoji(emoji)}
          className={`text-2xl transition-transform transform hover:scale-150 ${
            selectedEmoji === emoji ? "scale-150" : ""
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

const ContactUs = () => {
  const { backendUrl } = useContext(AppContext);
  const [form, setForm] = useState({ message: "", email: "" });
  const [selectedEmoji, setSelectedEmoji] = useState("");
  const [status, setStatus] = useState("");

  const handleChange = (e) =>
    setForm({ ...form, [e.target.id]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (status === "Sending...") return;
    setStatus("Sending...");
    try {
      const { data } = await axios.post(backendUrl + "/admin/contact", {
        message: form.message,
        email: form.email,
        emoji: selectedEmoji,
      });
      if (data.success) {
        handleReset()
        toast.success(data.message, { autoClose: 1200 });
      } else {
        toast.error(data.message, { autoClose: 1200 });
      }
    } catch (error) {
      toast.error(error.message, { autoClose: 1500 });
    } finally {
      setStatus("");
    }
  };

  const handleReset = () => {
    setForm({ message: "", email: "" });
    setSelectedEmoji("");
    setStatus("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-cyan-900 font-sans select-none">
      <Navbar />
      <header className="text-center py-6 pt-[140px]">
        <h1 className="text-2xl sm:text-4xl font-extrabold text-white">
          Write to us
        </h1>
        <p className="mt-4 text-base text-gray-300">
          We'll fix issues (if any) & respond (if necessary)
        </p>
      </header>
      <main className="flex-grow max-w-md mx-auto px-4 sm:px-6 mb-8">
        <div className="glass-card p-4 sm:p-6 rounded-lg shadow-glass bg-white">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="message" className="block text-base font-medium text-cyan-200 mb-1">
                Tell us anything *
              </label>
              <textarea
                id="message"
                required
                rows="3"
                value={form.message}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 sm:p-3 rounded focus:outline-none focus:border-cyan-500 bg-transparent text-white text-sm"
                placeholder="Your message /appreciation /issue..."
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-base font-medium text-cyan-200 mb-1">
                Send us your mail if you want to connect
              </label>
              <input
                type="email"
                id="email"
                value={form.email}
                onChange={handleChange}
                className="w-full border border-gray-300 p-2 sm:p-3 rounded focus:outline-none focus:border-cyan-500 bg-transparent text-white text-sm"
                placeholder="Mail"
              />
            </div>
            
            {/* EmojiBar */}
            <EmojiBar selectedEmoji={selectedEmoji} setSelectedEmoji={setSelectedEmoji} />

            {status && <p className="text-center text-sm text-gray-200">{status}</p>}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="submit"
                className="w-full py-2 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold text-sm"
              >
                Submit
              </button>
              <button
                type="reset"
                onClick={handleReset}
                className="w-full py-2 rounded-full hover:bg-cyan-200 border border-[#00f9ff] bg-cyan-100 text-slate-700 font-semibold text-sm"
              >
                Clear Form
              </button>
            </div>
          </form>
        </div>
      </main>
      <div className="fixed w-full sm:mt-4 pt-2 mt-32 text-slate-400 ">
      <Footer />
      </div>
    </div>
  );
};

export default ContactUs;
