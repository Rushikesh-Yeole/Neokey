export const OTPMAIL = `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Email Verification</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
      background-color: #f6f8fa;
      color: #333333;
    }
    table, td {
      border-collapse: collapse;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 50px auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #1e88e5;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
      font-size: 24px;
      font-weight: 600;
    }
    .sub-header {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      padding: 20px;
      text-align: center;
    }
    .otp {
      font-size: 28px;
      font-weight: bold;
      color: #1e88e5;
      background-color: #f1f8ff;
      padding: 15px 20px;
      border-radius: 8px;
      display: inline-block;
      letter-spacing: 2px;
      margin: 20px 0;
    }
    .footer {
      font-size: 14px;
      color: #6b7280;
      text-align: center;
      padding: 20px;
    }
    .divider {
      width: 80%;
      height: 1px;
      background-color: #e5e7eb;
      margin: 20px auto;
    }
    @media only screen and (max-width: 480px) {
      .container {
        width: 90% !important;
      }
      .header {
        font-size: 20px !important;
        padding: 20px 10px !important;
      }
      .otp {
        font-size: 24px !important;
        padding: 10px 15px !important;
      }
      .sub-header {
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="header">
                  Confirm Your Email
                </td>
              </tr>
              <tr>
                <td class="sub-header">
                  To ensure the security of your account, we need to verify your email address. Use the code below:
                </td>
              </tr>
              <tr>
                <td align="center">
                  <div class="otp">
                    {{otp}}
                  </div>
                </td>
              </tr>
              <tr>
                <td class="sub-header">
                  Once verified, you’ll be able to securely manage your passwords and access your account.
                </td>
              </tr>
              <tr>
                <td>
                  <div class="divider"></div>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  If you didn’t request this code, it may be that someone is trying to access your account. For your security, we strongly recommend you <strong>reset your password</strong>.
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 20px;">
                  <a href="https://neokey.onrender.com/#/reset" style="display: inline-block; background-color: #1e88e5; color: #ffffff; padding: 12px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                    Reset Password
                  </a>
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`


export const RESETMAIL = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Password Reset Alert</title>
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style type="text/css">
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
      background-color: #f6f8fa;
      color: #333333;
    }
    table, td {
      border-collapse: collapse;
    }
    .container {
      width: 100%;
      max-width: 600px;
      margin: 50px auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    .header {
      background-color: #1e88e5;
      color: #ffffff;
      padding: 30px 20px;
      text-align: center;
      font-size: 22px;
      font-weight: 600;
    }
    .sub-header {
      color: #6b7280;
      font-size: 16px;
      line-height: 1.6;
      padding: 20px;
      text-align: center;
    }
    .alert {
      font-size: 18px;
      font-weight: bold;
      color: #d32f2f;
      background-color: #ffebee;
      padding: 15px;
      border-radius: 8px;
      text-align: center;
      margin: 20px auto;
      max-width: 80%;
    }
    .footer {
      font-size: 14px;
      color: #6b7280;
      text-align: center;
      padding: 20px;
    }
    .divider {
      width: 80%;
      height: 1px;
      background-color: #e5e7eb;
      margin: 20px auto;
    }
    .contact-link {
      color: #1e88e5;
      text-decoration: none;
      font-weight: bold;
    }
    @media only screen and (max-width: 480px) {
      .container {
        width: 90% !important;
      }
      .header {
        font-size: 20px !important;
        padding: 20px 10px !important;
      }
      .alert {
        font-size: 16px !important;
        padding: 10px !important;
      }
      .sub-header {
        font-size: 14px !important;
      }
    }
  </style>
</head>
<body>
  <table width="100%" cellspacing="0" cellpadding="0" border="0" align="center">
    <tbody>
      <tr>
        <td valign="top" align="center">
          <table class="container" width="600" cellspacing="0" cellpadding="0" border="0">
            <tbody>
              <tr>
                <td class="header">
                  Your Password Was Reset
                </td>
              </tr>
              <tr>
                <td class="sub-header">
                  Your account password was recently changed. If this was you, you can ignore this email.<br /><br />
                  <em>Please note:</em> A password reset means that if you did not authorize this change, an attacker may have had access not only to your previous Neokey password, but also to your <strong>email account</strong>. We strongly recommend reviewing your email security settings immediately.
                </td>
              </tr>
              <tr>
                <td align="center">
                  <div class="alert">
                    If you didn’t request this change, please <a href="{{contact_link}}" class="contact-link">contact us</a> immediately.
                  </div>
                </td>
              </tr>
              <tr>
                <td>
                  <div class="divider"></div>
                </td>
              </tr>
              <tr>
                <td class="footer">
                  This email was sent for security purposes.<br/>
                  © 2025 NeoKey™  
                </td>
              </tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
  </table>
</body>
</html>
`;
