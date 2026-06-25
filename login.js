// 1. Import the creation function directly from the official ES Module CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://jzjjmpgonqbusumcryaj.supabase.co/'; // Put your actual project URL here
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6amptcGdvbnFidXN1bWNyeWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODA0NTgsImV4cCI6MjA5Nzg1NjQ1OH0.k5A1OtUbsUT9UBZOD4-3T4-Mw-VHK9SWkzwF8Fp3NoM';               // Put your actual Anon Key here

// 2. Initialize the client securely
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// 3. Keep the rest of your login() function exactly the same...
async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const messageElement = document.getElementById('message');

    if (!email || !password) {
        messageElement.style.color = "red";
        messageElement.innerText = "Please fill in both fields.";
        return;
    }

    messageElement.style.color = "#3B4D2A";
    messageElement.innerText = "Authenticating...";

    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            messageElement.style.color = "red";
            messageElement.innerText = error.message;
        } else {
            messageElement.style.color = "green";
            messageElement.innerText = "Login successful! Redirecting...";
            
            setTimeout(() => {
                window.location.href = "parking-management.html"; 
            }, 1500);
        }
    } catch (err) {
        messageElement.style.color = "red";
        messageElement.innerText = "An unexpected error occurred. Please try again.";
        console.error(err);
    }
}

// 4. EXPOSE THE FUNCTION TO THE WINDOW
// Because type="module" isolates scripts, we explicitly attach login to the window so your HTML onclick can find it.
window.login = login;
