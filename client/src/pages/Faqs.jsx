import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FAQAndHowTo = () => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const faqs = [
  {
    question: "What's Neokey? and why is it cooler than anything else out there?",
    answer: (
      <>
        Neokey is your ultimate virtual vault—stateless, ultra-secure, and straight-up genius. 
        <br></br>It's a Password Generator and Manager that <strong> doesn't store passwords, even encrypted!</strong>
        <br></br>It forges unique, high-entropy passwords <strong>on demand</strong>. 
        {/* <br></br>They're <strong>never stored</strong>, never vulnerable, and always ready for action.  */}
        <br></br>
        <br></br>Rest assured, <strong>no one knows your passwords, Literally!</strong>
        <br></br>You're welcome.
      </>
    ),
  },    
  {
    question: "How does Neokey ensure security?",
    answer: (
      <>
        Neokey <strong>stores Nothing and generates everything on the fly</strong>, giving you truly zero-knowledge security.
        <br></br>
        <br></br>
        It leverages precise algorithmic flows to generate your passwords on-demand, secures data in transit with strong encryption, and enforces MFA for safe, brute-force-resistant access.
      </>
    ),
  },
  {
    question: "Can I generate new passwords multiple times for the same service?",
    answer: (
      <>
        Absolutely! 
        <br></br>Neokey allows you to <strong>generate unlimited unique new passwords</strong> for the same service, 
        always retrieving the latest one.
      </>
    ),
  },
  {
    question: "What happens if I lose my Neokey { Master password } ?",
    answer: (
  <>
    If you lose your Neokey, recovery is only possible via the <strong>one-time generated artifact</strong> you downloaded at signup.  
    <br></br>Your previously generated passwords remain reproducible on-demand, ensuring seamless <strong>backward compatibility</strong>.
  </>
  ),
  },
  {
    question: "What's BIFROST?",
    answer: (
      <>
        BIFROST lets you log in on any device using a 4-digit code, initiating a time-limited 
        session <strong>lasting 15 minutes</strong>.
        <br></br>It’s a fast, reliable solution for seamless <strong>no-strings attached multi-device access</strong>.
        <br></br>
        <br></br>Nevertheless, you can login on as many devices you wish.
      </>
    ),
  },    
];


  const howToSteps = [
    "Step 1: Sign up using your email and a strong Master password",
    "Step 2: Download & keep the one-time Recovery artifact — your fallback to regain the master key",
    "Step 3: Type or select a website/service name",
    "Step 4: Enter your master key",
    "Step 5: Create or Retrieve a password for any service",
    "Step 6: Copy the retrieved password securely from the app",
  ];

  const toggleQuestion = (index) => {
    setSelectedQuestion(selectedQuestion === index ? null : index);
  };

  return (
    <div className='autocomplete="off" bg-gradient-to-b from-cyan-600 to-cyan-700 animate-pulse-smooth text-gray-900 font-sans min-h-screen select-none'>
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
          <ol className="list-decimal list-inside space-y-4 text-lg text-white">
            {howToSteps.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </section>

        <section className="mb-16 mt-12">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-black pb-4">
                <button
                  onClick={() => toggleQuestion(index)}
                  className="w-full rounded-md text-left flex justify-between items-center text-lg font-medium "
                >
                  {faq.question}
                  <span>{selectedQuestion === index ? "-" : "+"}</span>
                </button>
                {selectedQuestion === index && (
                  <p className="mt-3 text-gray-200">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
        </section>

      </main>

      <div className="mt-auto pt-2 text-slate-300 ">
      <Footer />
      </div>
    </div>
  );
};

export default FAQAndHowTo;