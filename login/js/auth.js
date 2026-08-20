
const USERS_KEY = "foodiehub_users";
const SESSION_KEY = "foodiehub_session";

function getUsers(){
  try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; }
  catch(e){ return []; }
}
function saveUsers(users){ localStorage.setItem(USERS_KEY, JSON.stringify(users)); }

function seedDemoUser(){
  const users = getUsers();
  if(!users.length){
    users.push({
      id: Date.now(),
      name: "Navyasree Palavari",
      email: "navya@gmail.com",
      phone: "9876543210",
      city: "Ongole",
      password: "Navya@123"
    });
    saveUsers(users);
  }
}
seedDemoUser();

function setSession(user){
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id:user.id,name:user.name,email:user.email,phone:user.phone,city:user.city
  }));
}
function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch(e){ return null; }
}
function logout(){
  localStorage.removeItem(SESSION_KEY);
  window.location.href = "login.html";
}

function showAlert(targetId, message, type="success"){
  const box=document.getElementById(targetId);
  if(!box) return;
  box.innerHTML=`<div class="alert alert-${type} alert-dismissible fade show" role="alert">
    ${message}<button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  </div>`;
}

function togglePassword(id, button){
  const input=document.getElementById(id);
  if(!input) return;
  if(input.type==="password"){
    input.type="text";
    button.innerHTML='<i class="bi bi-eye-slash"></i>';
  }else{
    input.type="password";
    button.innerHTML='<i class="bi bi-eye"></i>';
  }
}

function passwordScore(password){
  let score=0;
  if(password.length>=8) score++;
  if(/[A-Z]/.test(password)) score++;
  if(/[a-z]/.test(password)) score++;
  if(/[0-9]/.test(password)) score++;
  if(/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) score++;
  return score;
}

function updatePasswordRules(password, prefix=""){
  const rules=[
    [prefix+"lengthRule", password.length>=8],
    [prefix+"upperRule", /[A-Z]/.test(password)],
    [prefix+"numberRule", /[0-9]/.test(password)],
    [prefix+"specialRule", /[!@#$%^&*(),.?":{}|<>_\-]/.test(password)]
  ];
  rules.forEach(([id,valid])=>{
    const el=document.getElementById(id);
    if(!el) return;
    el.classList.toggle("valid",valid);
    el.classList.toggle("invalid",!valid);
    const icon=el.querySelector("i");
    if(icon) icon.className=valid ? "bi bi-check-circle-fill" : "bi bi-circle";
  });
}

function setupPasswordValidation(inputId, prefix=""){
  const input=document.getElementById(inputId);
  if(!input) return;
  const update=()=>{
    updatePasswordRules(input.value,prefix);
    const meter=document.getElementById(prefix+"passwordMeter");
    const fill=document.getElementById(prefix+"passwordMeterFill");
    if(meter && fill){
      const score=passwordScore(input.value);
      fill.style.width=(score/5*100)+"%";
      fill.style.background=score<=2 ? "#DC2626" : score===3 ? "#F59E0B" : "#16A34A";
    }
  };
  input.addEventListener("input",update);
  update();
}

function validPassword(p){
  return p.length>=8 && /[A-Z]/.test(p) && /[0-9]/.test(p) &&
         /[!@#$%^&*(),.?":{}|<>_\-]/.test(p);
}

/* Registration */
const registerForm=document.getElementById("registerForm");
if(registerForm){
  setupPasswordValidation("registerPassword","register");
  registerForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const name=document.getElementById("fullName").value.trim();
    const email=document.getElementById("registerEmail").value.trim().toLowerCase();
    const phone=document.getElementById("phone").value.trim();
    const password=document.getElementById("registerPassword").value;
    const confirm=document.getElementById("confirmPassword").value;

    if(!name || !email || !phone || !password || !confirm){
      return showAlert("registerAlert","Please fill in all required fields.","danger");
    }
    if(!/^[0-9]{10}$/.test(phone)){
      return showAlert("registerAlert","Phone number must contain exactly 10 digits.","danger");
    }
    if(!validPassword(password)){
      return showAlert("registerAlert","Password must be 8+ characters and include an uppercase letter, number and special character.","danger");
    }
    if(password!==confirm){
      return showAlert("registerAlert","Passwords do not match.","danger");
    }
    const users=getUsers();
    if(users.some(u=>u.email===email)){
      return showAlert("registerAlert","An account with this email already exists.","danger");
    }
    const user={id:Date.now(),name,email,phone,city:"",password};
    users.push(user); saveUsers(users); setSession(user);
    showAlert("registerAlert","Account created successfully. Opening your profile...","success");
    setTimeout(()=>window.location.href="profile.html",900);
  });
}

/* Login */
const loginForm=document.getElementById("loginForm");
if(loginForm){
  loginForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const email=document.getElementById("loginEmail").value.trim().toLowerCase();
    const password=document.getElementById("loginPassword").value;
    const user=getUsers().find(u=>u.email===email && u.password===password);
    if(!user){
      return showAlert("loginAlert","Invalid email or password. Try the demo account shown below.","danger");
    }
    setSession(user);
    showAlert("loginAlert","Login successful. Redirecting...","success");
    setTimeout(()=>window.location.href="profile.html",700);
  });
}

/* Forgot password */
const forgotForm=document.getElementById("forgotForm");
if(forgotForm){
  forgotForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const email=document.getElementById("forgotEmail").value.trim().toLowerCase();
    const user=getUsers().find(u=>u.email===email);
    if(!user){
      return showAlert("forgotAlert","No account was found with that email.","danger");
    }
    sessionStorage.setItem("reset_email",email);
    showAlert("forgotAlert","Reset request accepted for this demo. Continue to create a new password.","success");
    setTimeout(()=>window.location.href="reset-password.html",900);
  });
}

/* Reset password */
const resetForm=document.getElementById("resetForm");
if(resetForm){
  setupPasswordValidation("resetPassword","reset");
  const resetEmail=sessionStorage.getItem("reset_email");
  const emailLabel=document.getElementById("resetEmailLabel");
  if(emailLabel) emailLabel.textContent=resetEmail || "your registered email";
  resetForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const email=sessionStorage.getItem("reset_email");
    const password=document.getElementById("resetPassword").value;
    const confirm=document.getElementById("resetConfirmPassword").value;
    if(!email) return showAlert("resetAlert","Please start from the Forgot Password page.","danger");
    if(!validPassword(password)) return showAlert("resetAlert","Choose a stronger password.","danger");
    if(password!==confirm) return showAlert("resetAlert","Passwords do not match.","danger");
    const users=getUsers();
    const index=users.findIndex(u=>u.email===email);
    if(index<0) return showAlert("resetAlert","Account not found.","danger");
    users[index].password=password; saveUsers(users);
    sessionStorage.removeItem("reset_email");
    showAlert("resetAlert","Password updated successfully. Redirecting to login...","success");
    setTimeout(()=>window.location.href="login.html",900);
  });
}

/* Profile */
function loadProfile(){
  const user=getSession();
  if(!user){ window.location.href="login.html"; return; }
  const fields={
    profileName:user.name, profileEmail:user.email, profilePhone:user.phone || "Not added",
    profileCity:user.city || "Not added", editName:user.name, editEmail:user.email,
    editPhone:user.phone || "", editCity:user.city || ""
  };
  Object.entries(fields).forEach(([id,val])=>{
    const el=document.getElementById(id); if(el) el.value!==undefined ? el.value=val : el.textContent=val;
  });
  const initials=user.name.split(/\s+/).map(x=>x[0]).slice(0,2).join("").toUpperCase();
  const avatar=document.getElementById("profileAvatar");
  if(avatar) avatar.textContent=initials;
}
const profileForm=document.getElementById("profileForm");
if(profileForm){
  loadProfile();
  profileForm.addEventListener("submit",(e)=>{
    e.preventDefault();
    const session=getSession();
    if(!session) return;
    const name=document.getElementById("editName").value.trim();
    const email=document.getElementById("editEmail").value.trim().toLowerCase();
    const phone=document.getElementById("editPhone").value.trim();
    const city=document.getElementById("editCity").value.trim();
    if(!name || !email || !/^[0-9]{10}$/.test(phone)){
      return showAlert("profileAlert","Please enter a valid name, email and 10-digit phone number.","danger");
    }
    const users=getUsers();
    const duplicate=users.find(u=>u.email===email && u.id!==session.id);
    if(duplicate) return showAlert("profileAlert","That email is already used by another account.","danger");
    const index=users.findIndex(u=>u.id===session.id);
    if(index<0) return;
    users[index]={...users[index],name,email,phone,city};
    saveUsers(users); setSession(users[index]); loadProfile();
    showAlert("profileAlert","Profile updated successfully.","success");
  });
}

/* Navbar profile name */
document.addEventListener("DOMContentLoaded",()=>{
  const user=getSession();
  document.querySelectorAll("[data-user-name]").forEach(el=>el.textContent=user?.name || "Guest");
});
