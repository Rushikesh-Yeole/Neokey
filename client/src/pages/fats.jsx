import { useState } from "react";
import Navbar from "../components/Navbar";

const FAQAndHowTo = () => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const faqs = [
    {
      question: "What's Neokey? and why is it cooler than anything else out there?",
      answer:
      "Neokey is your ultimate virtual vault—stateless, ultra-secure, and straight-up genius. It's a Password Generator and Manager that forges unique, high-entropy passwords on demand. They're never stored, never vulnerable, and always ready for action. You're welcome.",
    },    
    {
      question: "How does Neokey ensure security?",
      answer:
        "Neokey doesn't store your passwords or any sensitive data thus minimizing attack surfaces! It uses specific algorithms to generate your passwords only when requested, along with advanced encryption for secure data transmission and MFA to ensure secure access. Rest assured, no one knows your passwords, Literally!",
    },
    {
      question: "Can I generate multiple passwords for the same service?",
      answer:
        "Absolutely! Neokey allows you to generate unlimited unique passwords for the same service, always retrieving the latest one.",
    },
    {
      question: "What happens if I lose my Neokey { Master password } ?",
      answer:
        "If you lose your Neokey, you can always reset it! Previously generated passwords will remain unaffected, ensuring backward compatibility and seamless security. Still, nothing remembered! ",
    },
    {
      question: "What's BIFROST?",
      answer:
        "BIFROST lets you log in on any device using a simple 4-digit code, initiating a time-limited session that lasts 15 minutes. It’s a fast, reliable solution for seamless multi-device access.",
    }    
  ];

  const howToSteps = [
    "Step 1: Log in/Sign up using your email and enter/set Master password.",
    "Step 2: Type or select a website/service name.",
    "Step 3: Enter your master key.",
    "Step 4: Create or Retrieve a password for any service.",
    "Step 5: Copy the retrieved password securely from the app.",
  ];

  const toggleQuestion = (index) => {
    setSelectedQuestion(selectedQuestion === index ? null : index);
  };

  return (
    <div className='autocomplete="off" bg-gradient-to-b from-cyan-700 to-slate-100 animate-pulse-smooth text-gray-900 font-sans min-h-screen select-none'>
      {/* Navbar Integration */}
      <Navbar />

      {/* Main Content */}
      <header className="mb-2 text-center py-10 pt-[170px] flex flex-col items-center">
      <div className="flex items-center">
      {/* <img src={assets.fats} alt="" className="w-12 h-12 mr-4" /> */}
      <h1 className="text-4xl sm:text-5xl font-extrabold">FAQ & Using Neokey</h1>
      </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 sm:px-12">

        <section>
          <h2 className="text-2xl font-semibold mb-6">How to Use Neokey</h2>
          <ol className="list-decimal list-inside space-y-4 text-lg text-gray-800">
            {howToSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="mb-16 mt-12">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-300 pb-4">
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full rounded-md text-left flex justify-between items-center text-lg font-medium focus:outline-none"
                >
                  {faq.question}
                  <span>{selectedQuestion === index ? "-" : "+"}</span>
                </button>
                {selectedQuestion === index && (
                  <p className="mt-3 text-gray-700">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      <footer className="w-full text-center py-4 border-t border-gray-300 mt-16">
      <p className="text-gray-600 text-xs"> © 2025 NeoKey™ </p>
      </footer>
    </div>
  );
};

export default FAQAndHowTo;