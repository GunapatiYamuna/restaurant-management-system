# FOODIEHUB — Member 1 Frontend

Module: Authentication & User Dashboard
Technology: HTML5, CSS3, Bootstrap 5, JavaScript

## Pages
1. Login
2. Registration
3. Forgot Password
4. Reset Password
5. User Profile

## Features
- Responsive Bootstrap layout
- Navy / orange / white FOODIEHUB theme
- Registration validation
- Password strength rules
- Login demo authentication
- Forgot/reset password demo flow
- Profile edit and update
- Logout
- Success/error alerts
- Browser localStorage demo persistence

## Run
Open `index.html` in a browser. For best results, use VS Code Li<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>FOODIEHUB</title>
<style>
*{box-sizing:border-box}
body{margin:0;min-height:100vh;font-family:Arial,sans-serif;background:#061522;display:flex;flex-direction:column}
.topbar{height:64px;border-bottom:1px solid #243642;display:flex;align-items:center;padding:0 7%;color:white;font-size:22px;font-weight:800}
.topbar span,.logo-name span{color:#ff6b00}
.page{flex:1;display:flex;align-items:center;justify-content:center;padding:40px 20px}
.card{width:100%;max-width:560px;background:white;border-radius:9px;padding:34px;text-align:center;box-shadow:0 20px 55px #0005}
.logo{width:82px;height:82px;margin:0 auto 10px;border-radius:50%;background:#ff6b00;border:5px solid #fff0e6;display:flex;align-items:center;justify-content:center;font-size:40px;box-shadow:0 7px 20px #ff6b0045}
.logo-name{font-size:20px;font-weight:900;letter-spacing:1px}
h1{font-size:28px;margin:12px 0 8px}
.sub{color:#687580;font-size:14px;margin-bottom:25px}
.buttons{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.btn{padding:13px 10px;border:1px solid #ff6b00;border-radius:5px;text-decoration:none;color:#ff6b00;font-weight:700}
.btn.primary{background:#ff6b00;color:white}
.btn:hover{background:#fff0e6}.btn.primary:hover{background:#e85d00}
.demo{margin-top:24px;padding:16px;text-align:left;border:1px solid #ffd8bf;background:#fff7f1;border-radius:6px;font-size:13px;line-height:1.55}
@media(max-width:600px){.buttons{grid-template-columns:1fr}.card{padding:25px 18px}h1{font-size:24px}}
</style>
</head>
<body>
<header class="topbar">FOODIE<span>HUB</span></header>
<main class="page">
<section class="card">
  <!-- FoodieHub logo placed ABOVE Authentication -->
  <div class="logo">🍴</div>
  <div class="logo-name">FOODIE<span>HUB</span></div>

  <h1>Authentication &amp; User Dashboard</h1>
  <p class="sub">FOODIEHUB frontend module • Navy / Orange / White theme</p>

  <div class="buttons">
    <a class="btn primary" href="pages/login.html">Login</a>
    <a class="btn" href="pages/register.html">Register</a>
    <a class="btn" href="pages/forgot-password.html">Forgot Password</a>
    <a class="btn" href="pages/profile.html">User Profile</a>
  </div>

  <div class="demo">
    <strong>Demo login:</strong> navya@gmail.com / Navya@123<br>
    Registration, profile updates and password reset are stored in browser.
  </div>
</section>
</main>
</body>
</html>ve Server.

## Demo account
Email: navya@gmail.com
Password: Navya@123

## Important
This is frontend-only. Passwords are stored in localStorage only for demonstration.
For the final project, replace localStorage authentication with backend API/database authentication.

## Integration
During team integration:
- Keep the `pages`, `css`, and `js` folders.
- Replace the temporary navbar/footer with the team's common components.
- Keep the same CSS variables:
  --navy: #061522
  --navy-2: #0B1D2A
  --orange: #FF6B00
  --orange-dark: #E85D00
- Update navigation links to the final 21-page project paths.
