import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const FAQAndHowTo = () => {
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  const faqs = [
  {
    question: "Why is Neokey better than the rest?",
    answer: (
      <>
        Traditional managers are just digitized notebooks. If they get hacked, you lose everything.
        <br></br>
        <br></br>Neokey is your ultimate password platform: Stateless, Ultra-secure, and Anonymous. 
        <br></br>It's a password platform that <strong> doesn't store passwords, even encrypted.</strong>
        <br></br>If computes your passwords <strong>in real-time</strong> using high-entropy math. 
        <br></br>
        <br></br>Zero storage means zero leaks.
      </>
    ),
  },    

  {
    question: "Is it actually secure?",
    answer: (
      <>
        Neokey <strong>stores no secrets and generates everything on the fly</strong>, giving you truly zero-knowledge security.
        <br></br>
        <br></br>
        It uses end-to-end encryption for transit and irreversible heavy hashing for verification.
        <br></br>
        The database is completely opaque & anoymous.
        <br></br>
        Neokey enforces MFA for safe, brute-force-resistant access.
        <br></br>
        It stores No Identity, No Passwords.
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
    question: "What happens if I lose my master password ?",
    answer: (
      <>
        Then you lose access. Period.  
        <br></br>
        We don't know your key, so we can't reset it.
        <br></br>
        <br></br>
        Use the <strong>Recovery Artifact</strong> you downloaded at signup. If you lost that too, we can't help you.
      </>
  ),
  },
  {
    question: "What's BIFROST?",
    answer: (
      <>
        It's a rapid, end-to-end encrypted session transfer.
        <br></br><br></br>
        Generate a temporary <strong>6-digit sequence</strong> on your active device and enter it on the target device. Bifrost generates ephemeral RSA-2048 keys on the fly to securely beam your session across, completely blinding the server to your session details.
        <br></br><br></br>
        The tunnel stays open for exactly <strong>60 seconds</strong> and requires explicit host authorization. Once the jump is complete, the new session remains active for 45 minutes. Get in, get out, leave zero trace.
      </>
    ),
  },    
];


  const howToSteps = [
    "Step 1: Sign up using your email and a strong Master password",
    "Step 2: Download and securely store the one time recovery artifact as your fallback to regain the master key.",
    "Step 3: Enter your master key once to access active session.",
    "Step 4: Type/select a website/service name",
    "Step 5: Create or Reveal a password for any service",
    "Step 6: Copy the Revealed password securely",
  ];

  const toggleQuestion = (index) => {
    setSelectedQuestion(selectedQuestion === index ? null : index);
  };

  return (
    <div className='autocomplete="off" bg-gradient-to-b from-cyan-600 to-cyan-700 animate-pulse-smooth text-gray-900 font-sans min-h-screen select-none'>
      <Navbar />

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