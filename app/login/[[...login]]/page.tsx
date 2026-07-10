import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="clerk-login-shell">
        <div className="login-brand">
          <img className="keptos-logo login-logo" src="/keptos-logo.webp" alt="Keptos IT Services" />
          <div>
            <h1>Casino Analytics</h1>
            <p>Acceso al centro de performance de casinos.</p>
          </div>
        </div>
        <SignIn
          path="/login"
          routing="path"
          fallbackRedirectUrl="/"
          withSignUp={false}
          appearance={{
            variables: {
              colorPrimary: "#c00021",
              borderRadius: "8px",
              fontFamily: "Instrument Sans, sans-serif"
            },
            elements: {
              rootBox: "clerk-root",
              cardBox: "clerk-card-box",
              card: "clerk-card"
            }
          }}
        />
      </div>
    </div>
  );
}
