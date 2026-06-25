// 1. Grab the createClient function out of the global supabase object
const { createClient } = supabase;

const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseKey = 'your-anon-public-key';

// 2. Properly initialize your specific client instance
const supabaseClient = createClient(supabaseUrl, supabaseKey);

// 3. Define the login function that your HTML button calls
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
        // 4. Authenticate using the properly built client
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
