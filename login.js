const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_ANON_KEY';

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
