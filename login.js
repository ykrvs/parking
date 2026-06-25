console.log("👉 STEP 1: login.js file has loaded successfully!");

const supabaseUrl = 'https://jzjjmpgonqbusumcryaj.supabase.co/'; // Put your actual project URL here
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6amptcGdvbnFidXN1bWNyeWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODA0NTgsImV4cCI6MjA5Nzg1NjQ1OH0.k5A1OtUbsUT9UBZOD4-3T4-Mw-VHK9SWkzwF8Fp3NoM';               // Put your actual Anon Key here

let supabaseClient;
try {
    supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);
    console.log("👉 STEP 2: Supabase client initialized successfully:", supabaseClient);
} catch (e) {
    console.error("❌ CRITICAL: Failed to initialize Supabase:", e);
}

async function login() {
    console.log("👉 STEP 3: Login button was clicked! The function is now running.");
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    console.log("Captured Email input:", email);

    if (!email || !password) {
        messageElement.style.color = "red";
        messageElement.innerText = "Please fill in both fields.";
        console.log("⚠️ Validation failed: Email or password field was empty.");
        return;
    }

    // Change UI state to let us know it's trying to talk to the server
    messageElement.style.color = "#3B4D2A";
    messageElement.innerText = "Authenticating...";
    console.log("👉 STEP 4: UI updated to 'Authenticating...'. Sending request to Supabase network...");

    // Safety check to ensure you aren't using the placeholder text
    if (supabaseUrl.includes("your-project-id")) {
        alert("Stop! You must replace the placeholder Supabase URL and Key at the top of login.js with your real credentials from your Supabase dashboard.");
        messageElement.style.color = "red";
        messageElement.innerText = "Configuration Error: Placeholder keys detected.";
        return;
    }

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        console.log("👉 STEP 5: Response successfully received back from Supabase!", { data, error });

        if (error) {
            messageElement.style.color = "red";
            messageElement.innerText = error.message;
            console.log("❌ Authentication failed:", error.message);
        } else {
            messageElement.style.color = "green";
            messageElement.innerText = "Login successful! Redirecting...";
            console.log("✅ Authentication success! Token acquired.");
            
            setTimeout(() => {
                window.location.href = "parking-management.html"; 
            }, 1500);
        }
    } catch (err) {
        messageElement.style.color = "red";
        messageElement.innerText = "An unexpected error occurred.";
        console.error("❌ Catch block caught an unhandled network/code error:", err);
    }
}

// FALLBACK METHOD 1: Force bind the function to the global window scope
// This guarantees it runs if your HTML button still has onclick="login()"
window.login = login; 

// FALLBACK METHOD 2: Look for the button by ID and add an event listener
// This guarantees it runs if your HTML has id="loginBtn" instead
const btn = document.getElementById('loginBtn');
if (btn) {
    btn.addEventListener('click', login);
    console.log("👉 STEP 6: Event listener successfully attached to element #loginBtn");
} else {
    console.log("👉 STEP 6 (Alternative): Element #loginBtn not found in HTML. Relying on window/onclick scope instead.");
}
