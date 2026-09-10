
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
    id:user.id,name:user.name,email:user.email,phone:user.phone,city:user.city,role:user.role||"user"
  }));
}
function getSession(){
  try { return JSON.parse(localStorage.getItem(SESSION_KEY)); }
  catch(e){ return null; }
}
function logout() {
    console.log("Logout button clicked");

    localStorage.removeItem("foodiehub_session");

    console.log("Session after logout:",
        localStorage.getItem("foodiehub_session"));

    window.location.href = "../../index.html";
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
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  setupPasswordValidation("registerPassword", "register");

  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("fullName").value.trim();
    const email = document.getElementById("registerEmail").value.trim().toLowerCase();
    const phone = document.getElementById("phone").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirm = document.getElementById("confirmPassword").value;

    if (!name || !email || !phone || !password || !confirm) {
      return showAlert(
        "registerAlert",
        "Please fill in all required fields.",
        "danger"
      );
    }

    if (!/^[0-9]{10}$/.test(phone)) {
      return showAlert(
        "registerAlert",
        "Phone number must contain exactly 10 digits.",
        "danger"
      );
    }

    if (!validPassword(password)) {
      return showAlert(
        "registerAlert",
        "Password must be 8+ characters and include an uppercase letter, number and special character.",
        "danger"
      );
    }

    if (password !== confirm) {
      return showAlert(
        "registerAlert",
        "Passwords do not match.",
        "danger"
      );
    }

    const formData = new URLSearchParams();

    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/api/register/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return showAlert(
          "registerAlert",
          data.message || "Registration failed.",
          "danger"
        );
      }

      showAlert(
        "registerAlert",
        "Account created successfully. You can now log in.",
        "success"
      );

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1000);

    } catch (error) {
      console.error("Registration error:", error);

      showAlert(
        "registerAlert",
        "Unable to connect to the server. Please make sure Django is running.",
        "danger"
      );
    }
    const user={id:Date.now(),name,email,phone,city:"",password,role:"user"};
    users.push(user); saveUsers(users); setSession(user);
    showAlert("registerAlert","Account created successfully. Opening your profile...","success");
    setTimeout(()=>window.location.href="../../index.html",900);
  });
}

/* Login */

const loginForm = document.getElementById("loginForm");

if (loginForm) {

  loginForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document
      .getElementById("loginEmail")
      .value
      .trim()
      .toLowerCase();

    const password = document.getElementById("loginPassword").value;

    if (!email || !password) {
      return showAlert(
        "loginAlert",
        "Please enter your email and password.",
        "danger"
      );
    }

    const formData = new URLSearchParams();

    formData.append("email", email);
    formData.append("password", password);

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/login/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return showAlert(
          "loginAlert",
          data.message || "Invalid email or password.",
          "danger"
        );
      }

      // Store the logged-in user information for the frontend session
      localStorage.setItem(
        "foodiehub_session",
        JSON.stringify(data.user)
      );

      showAlert(
        "loginAlert",
        "Login successful. Redirecting...",
        "success"
      );

      setTimeout(() => {
        window.location.href = "profile.html";
      }, 700);

    } catch (error) {

      console.error("Login error:", error);

      showAlert(
        "loginAlert",
        "Unable to connect to the server. Please make sure Django is running.",
        "danger"
      );
    }

    const email=document.getElementById("loginEmail").value.trim().toLowerCase();
    const password=document.getElementById("loginPassword").value;
    const user=getUsers().find(u=>u.email===email && u.password===password);
    if(!user){
      return showAlert("loginAlert","Invalid email or password. Try the demo account shown below.","danger");
    }
    setSession(user);
    showAlert("loginAlert","Login successful. Redirecting...","success");
    setTimeout(()=>window.location.href="../../index.html",700);
  });

}

/* Forgot Password */

const forgotForm = document.getElementById("forgotForm");

if (forgotForm) {

  forgotForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email = document
      .getElementById("forgotEmail")
      .value
      .trim()
      .toLowerCase();

    if (!email) {
      return showAlert(
        "forgotAlert",
        "Please enter your email address.",
        "danger"
      );
    }

    const formData = new URLSearchParams();

    formData.append("email", email);

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/api/forgot-password/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return showAlert(
          "forgotAlert",
          data.message || "Unable to send reset link.",
          "danger"
        );
      }

      showAlert(
        "forgotAlert",
        data.message,
        "success"
      );

      forgotForm.reset();

    } catch (error) {

      console.error("Forgot password error:", error);

      showAlert(
        "forgotAlert",
        "Unable to connect to the server. Please make sure Django is running.",
        "danger"
      );
    }

  });

}

function updatePasswordRule(element, valid) {

  if (!element) return;

  if (valid) {

    element.classList.remove("invalid");
    element.classList.add("valid");

    const icon = element.querySelector("i");

    if (icon) {
      icon.className = "bi bi-check-circle-fill";
    }

  } else {

    element.classList.remove("valid");
    element.classList.add("invalid");

    const icon = element.querySelector("i");

    if (icon) {
      icon.className = "bi bi-circle";
    }

  }

}

/* Reset password */

function updatePasswordRule(element, valid) {

  if (!element) return;

  if (valid) {

    element.classList.remove("invalid");
    element.classList.add("valid");

    const icon = element.querySelector("i");

    if (icon) {
      icon.className = "bi bi-check-circle-fill";
    }

  } else {

    element.classList.remove("valid");
    element.classList.add("invalid");

    const icon = element.querySelector("i");

    if (icon) {
      icon.className = "bi bi-circle";
    }

  }

}

const resetForm = document.getElementById("resetForm");

if (resetForm) {

  const params = new URLSearchParams(window.location.search);

  const uid = params.get("uid");
  const token = params.get("token");

  const resetEmailLabel = document.getElementById("resetEmailLabel");
  const resetPassword = document.getElementById("resetPassword");
  const resetConfirmPassword =
    document.getElementById("resetConfirmPassword");

  if (!uid || !token) {

    showAlert(
      "resetAlert",
      "This password reset link is invalid or incomplete.",
      "danger"
    );

    resetForm.querySelector("button[type='submit']").disabled = true;

  }

  if (resetPassword) {

    resetPassword.addEventListener("input", () => {

      const password = resetPassword.value;

      const lengthRule =
        document.getElementById("resetlengthRule");

      const upperRule =
        document.getElementById("resetupperRule");

      const numberRule =
        document.getElementById("resetnumberRule");

      const specialRule =
        document.getElementById("resetspecialRule");

      const hasLength = password.length >= 8;
      const hasUpper = /[A-Z]/.test(password);
      const hasNumber = /[0-9]/.test(password);
      const hasSpecial = /[^A-Za-z0-9]/.test(password);

      updatePasswordRule(lengthRule, hasLength);
      updatePasswordRule(upperRule, hasUpper);
      updatePasswordRule(numberRule, hasNumber);
      updatePasswordRule(specialRule, hasSpecial);

      const meterFill =
        document.getElementById("resetpasswordMeterFill");

      if (meterFill) {

        let strength = 0;

        if (hasLength) strength++;
        if (hasUpper) strength++;
        if (hasNumber) strength++;
        if (hasSpecial) strength++;

        meterFill.style.width = `${strength * 25}%`;
      }

    });

  }

  resetForm.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!uid || !token) {
      return;
    }

    const password = resetPassword.value;
    const confirmPassword = resetConfirmPassword.value;

    if (password !== confirmPassword) {

      return showAlert(
        "resetAlert",
        "Passwords do not match.",
        "danger"
      );

    }

    if (password.length < 8) {

      return showAlert(
        "resetAlert",
        "Password must be at least 8 characters long.",
        "danger"
      );

    }

    if (!/[A-Z]/.test(password)) {

      return showAlert(
        "resetAlert",
        "Password must contain at least one uppercase letter.",
        "danger"
      );

    }

    if (!/[0-9]/.test(password)) {

      return showAlert(
        "resetAlert",
        "Password must contain at least one number.",
        "danger"
      );

    }

    if (!/[^A-Za-z0-9]/.test(password)) {

      return showAlert(
        "resetAlert",
        "Password must contain at least one special character.",
        "danger"
      );

    }

    const formData = new URLSearchParams();

    formData.append("uid", uid);
    formData.append("token", token);
    formData.append("password", password);

    const submitButton =
      resetForm.querySelector("button[type='submit']");

    try {

      submitButton.disabled = true;

      submitButton.innerHTML =
        '<i class="bi bi-hourglass-split me-1"></i> Resetting...';

      const response = await fetch(
        "http://127.0.0.1:8000/api/reset-password/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {

        submitButton.disabled = false;

        submitButton.innerHTML =
          '<i class="bi bi-check2-circle me-1"></i> Reset Password';

        return showAlert(
          "resetAlert",
          data.message || "Unable to reset password.",
          "danger"
        );

      }

      showAlert(
        "resetAlert",
        "Password reset successfully! Redirecting to login...",
        "success"
      );

      resetForm.reset();

      setTimeout(() => {
        window.location.href = "login.html";
      }, 1500);

    } catch (error) {

      console.error("Reset password error:", error);

      submitButton.disabled = false;

      submitButton.innerHTML =
        '<i class="bi bi-check2-circle me-1"></i> Reset Password';

      showAlert(
        "resetAlert",
        "Unable to connect to the server. Please make sure Django is running.",
        "danger"
      );

    }

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
document.addEventListener("DOMContentLoaded", () => {

  const user = getSession();

  const loginSection = document.getElementById("loginSection");
  const userSection = document.getElementById("userSection");
  const userName = document.getElementById("navbarUserName");
  const avatar = document.getElementById("navbarAvatar");

  // Nobody is logged in
  if (!user) {
    if (loginSection) loginSection.style.display = "block";
    if (userSection) userSection.style.display = "none";
    return;
  }

  // Do not show admin as a normal user
  if (user.role === "admin") {
    if (loginSection) loginSection.style.display = "block";
    if (userSection) userSection.style.display = "none";
    return;
  }

  // Normal user is logged in
  if (loginSection) loginSection.style.display = "none";
  if (userSection) userSection.style.display = "flex";

  const nameParts = user.name.trim().split(/\s+/);

  const firstName = nameParts[0];

  let initials = firstName.charAt(0).toUpperCase();

  if (nameParts.length > 1) {
    initials += nameParts[nameParts.length - 1]
      .charAt(0)
      .toUpperCase();
  }

  if (userName) {
    userName.textContent = firstName;
  }

  if (avatar) {
    avatar.textContent = initials;
  }
});
