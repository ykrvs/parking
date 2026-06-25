// 1. Initialize your Supabase client
// Replace these placeholders with your actual project URL and Anon Key from your Supabase Dashboard
const supabaseUrl = 'https://jzjjmpgonqbusumcryaj.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6amptcGdvbnFidXN1bWNyeWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODA0NTgsImV4cCI6MjA5Nzg1NjQ1OH0.k5A1OtUbsUT9UBZOD4-3T4-Mw-VHK9SWkzwF8Fp3NoM';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// 2. Define the login function that the HTML button calls
async function login() {
    // Grab the inputs from the HTML page
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    // Simple validation check before sending to backend
    if (!email || !password) {
        messageElement.style.color = "red";
        messageElement.innerText = "Please fill in both fields.";
        return;
    }

    // Clear previous messages and show a loading state
    messageElement.style.color = "#3B4D2A"; // Olive green color
    messageElement.innerText = "Authenticating...";

    try {
        // 3. Authenticate against Supabase Auth
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            // If Supabase returns an error (e.g., wrong password)
            messageElement.style.color = "red";
            messageElement.innerText = error.message;
        } else {
            // Success! Redirect the user to your dashboard or landing page
            messageElement.style.color = "green";
            messageElement.innerText = "Login successful! Redirecting...";
            
            // Wait 1.5 seconds so they can see the success message, then redirect
            setTimeout(() => {
                window.location.href = "dashboard.html"; // Change this to your destination file
            }, 1500);
        }
    } catch (err) {
        // Catch any unexpected connection issues
        messageElement.style.color = "red";
        messageElement.innerText = "An unexpected error occurred. Please try again.";
        console.error(err);
    }
}
