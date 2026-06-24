const supabaseUrl = 'https://jzjjmpgonqbusumcryaj.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6amptcGdvbnFidXN1bWNyeWFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyODA0NTgsImV4cCI6MjA5Nzg1NjQ1OH0.k5A1OtUbsUT9UBZOD4-3T4-Mw-VHK9SWkzwF8Fp3NoM';

const supabase = window.supabase.createClient(
  supabaseUrl,
  supabaseKey
);

async function login() {

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password
    });

  if (error) {
    document.getElementById('message').innerText =
      error.message;
    return;
  }

  const user = data.user;

  const { data: employee, error: roleError } =
    await supabase
      .from('employees')
      .select('role')
      .eq('user_id', user.id)
      .single();

  if (roleError) {
    document.getElementById('message').innerText =
      'Role not found';
    return;
  }

  // Save role for later use
  localStorage.setItem('role', employee.role);

  // Redirect to dashboard
  window.location.href = 'index.html';
}
