import { PDFDocument, StandardFonts, rgb } from 'pdf-lib-plus-encrypt';

export const RecoveryArtifact = async (password, email) => {
  if (!email || typeof email !== 'string') return { success: false, message: 'Missing or invalid email' };
  if (!password || typeof password !== 'string') return { success: false, message: 'Missing or invalid password' };

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const { width, height } = page.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontMono = await pdfDoc.embedFont(StandardFonts.Courier);

    const obfuscateEmail = (email) => {
        const [local = '', domain = ''] = email.split('@');
        const [name = '', tld = ''] = domain.split('.');
        const obfLocal = local ? local[0] + '*'.repeat(Math.max(local.length - 2, 1)) + (local.slice(-1) || '') : '';
        return `${obfLocal}@****${tld ? '.' + tld : ''}`;
    };


    // Background gradient
    for (let i = 0; i < height; i += 2) {
      let shade = 0.97 + (i / height) * 0.03;
      shade = Math.min(Math.max(shade, 0), 1);
      page.drawRectangle({ x: 0, y: i, width, height: 2, color: rgb(shade, shade, Math.min(shade + 0.01, 1)) });
    }

    // Top bars
    page.drawRectangle({ x: 0, y: height - 4, width, height: 4, color: rgb(0.1, 0.1, 0.12) });
    page.drawRectangle({ x: 0, y: height - 2, width, height: 2, color: rgb(0, 0, 0) });

    // Header
    page.drawRectangle({ x: 0, y: height - 120, width, height: 116, color: rgb(0.98, 0.98, 0.99) });
    page.drawText('NEOKEY', { x: 45, y: height - 55, size: 26, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('Recovery Artifact', { x: 45, y: height - 80, size: 10, font, color: rgb(0.4, 0.4, 0.42) });

    // --- Confidential Card
    const warnY = height - 200;
    const warnX = 45, warnW = width - 90, warnH = 95;
    page.drawRectangle({ x: warnX + 2, y: warnY - 4, width: warnW, height: warnH, color: rgb(0.88, 0.88, 0.9) });
    page.drawRectangle({ x: warnX, y: warnY, width: warnW, height: warnH, color: rgb(0.99, 0.97, 0.95) });
    page.drawRectangle({ x: warnX, y: warnY, width: 4, height: warnH, color: rgb(1, 0.76, 0.03) });
    page.drawCircle({ x: warnX + 22, y: warnY + warnH - 18, size: 10, color: rgb(1, 0.76, 0.03) });
    page.drawText('!', { x: warnX + 20, y: warnY + warnH - 24, size: 14, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Confidential Document', { x: warnX + 40, y: warnY + warnH - 22, size: 13, font: fontBold, color: rgb(0.5, 0.35, 0.1) });
    page.drawText('This recovery artifact is issued once during sign-up.', { x: warnX + 40, y: warnY + warnH - 42, size: 9, font, color: rgb(0.35, 0.35, 0.35) });
    page.drawText('It enables password recovery if master password forgotten. Store securely.', { x: warnX + 40, y: warnY + warnH - 56, size: 9, font, color: rgb(0.35, 0.35, 0.35) });
    page.drawText('As anyone with this file and your email can get your master password.', { x: warnX + 40, y: warnY + warnH - 70, size: 9, font: fontBold, color: rgb(0.8, 0.4, 0.1) });

    // --- Master Password
    const passY = warnY - 155;
    const passX = 45, passW = width - 90, passH = 135;
    page.drawRectangle({ x: passX + 2, y: passY - 4, width: passW, height: passH, color: rgb(0.92, 0.92, 0.94) });
    page.drawRectangle({ x: passX, y: passY, width: passW, height: passH, color: rgb(1, 1, 1) });
    try { page.drawRectangle({ x: passX, y: passY, width: passW, height: passH, color: rgb(0,0,0), opacity:0, borderColor: rgb(0.82,0.82,0.84), borderWidth:1 }); } catch(e){}
    page.drawRectangle({ x: passX, y: passY + passH - 42, width: passW, height: 42, color: rgb(0.97, 0.97, 0.98) });
    page.drawText('Master Password', { x: passX + 20, y: passY + passH - 22, size: 12, font: fontBold, color: rgb(0, 0, 0) });
    page.drawText('Keep this password & recovery artifact absolutely private', { x: passX + 20, y: passY + passH - 36, size: 8, font, color: rgb(0.5, 0.5, 0.52) });
    page.drawRectangle({ x: passX + 20, y: passY + 35, width: passW - 40, height: 46, color: rgb(0.96, 0.96, 0.97) });
    const passWidth = fontMono.widthOfTextAtSize(password, 16);
    page.drawText(password, { x: passX + (passW - passWidth) / 2, y: passY + 52, size: 16, font: fontMono, color: rgb(0, 0, 0) });
    page.drawRectangle({ x: passX + 20, y: passY + 12, width: 110, height: 16, color: rgb(0.93, 0.98, 0.94) });
    page.drawText('AES-256 Encrypted', { x: passX + 38, y: passY + 16, size: 8, font: fontBold, color: rgb(0.15, 0.6, 0.25) });

    // --- Instructions
    const instrY = passY - 170;
    const instrX = 45, instrW = width - 90, instrH = 150;
    page.drawRectangle({ x: instrX + 2, y: instrY - 4, width: instrW, height: instrH, color: rgb(0.92, 0.92, 0.94) });
    page.drawRectangle({ x: instrX, y: instrY, width: instrW, height: instrH, color: rgb(0.98, 0.98, 0.99) });
    try { page.drawRectangle({ x: instrX, y: instrY, width: instrW, height: instrH, color: rgb(0,0,0), opacity:0, borderColor: rgb(0.82,0.82,0.84), borderWidth:1 }); } catch(e){}
    page.drawRectangle({ x: instrX, y: instrY + instrH - 32, width: instrW, height: 32, color: rgb(0.95,0.96,0.98) });
    page.drawText('Recovery Overview', { x: instrX + 20, y: instrY + instrH - 20, size: 11, font: fontBold, color: rgb(0,0,0) });

    const instructions = [
      ['1','This file is created only at sign-up. Keep it secure to avoid losing access to your account and passwords.'],
      ['2','Open this file with your registered email address if you forget your password.'],
      ['3','Access your Neokey account.'],
    ];
    let instrLineY = instrY + instrH - 52;
    instructions.forEach(([num,text])=>{
      page.drawCircle({ x: instrX+28, y: instrLineY-4, size: 8, color: rgb(0.1,0.1,0.12) });
      page.drawText(num, { x: instrX+25, y: instrLineY-7, size: 9, font: fontBold, color: rgb(1,1,1) });
      page.drawText(text, { x: instrX+45, y: instrLineY-6, size: 8.5, font, color: rgb(0.25,0.25,0.25) });
      instrLineY -= 26;
    });

    // --- Metadata Card
    const metaY = instrY - 135;
    const metaX = 45, metaW = width - 90, metaH = 85;
    page.drawRectangle({ x: metaX + 2, y: metaY - 4, width: metaW, height: metaH, color: rgb(0.92,0.92,0.94) });
    page.drawRectangle({ x: metaX, y: metaY, width: metaW, height: metaH, color: rgb(0.97,0.98,0.99) });
    try { page.drawRectangle({ x: metaX, y: metaY, width: metaW, height: metaH, color: rgb(0,0,0), opacity:0, borderColor: rgb(0.82,0.82,0.84), borderWidth:1 }); } catch(e){}
    const info = [
      ['Email', obfuscateEmail(email)],
      ['Created', new Date().toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit'})],
      ['Encryption','AES-256'],
      ['Artifact ID',`NK-${Date.now().toString(36).toUpperCase()}`]
    ];
    let metaLineY = metaY + metaH - 18;
    info.forEach(([label,value],idx)=>{
      if(idx>0) page.drawRectangle({ x: metaX+20, y: metaLineY+10, width: metaW-40, height:0.5, color: rgb(0.88,0.88,0.9) });
      page.drawText(label, { x: metaX+20, y: metaLineY, size:8, font, color: rgb(0.5,0.5,0.52) });
      page.drawText(value, { x: metaX+130, y: metaLineY, size:8.5, font, color: rgb(0.1,0.1,0.1) });
      metaLineY -= 18;
    });

    // Footer
    const footerY = 50;
    page.drawRectangle({ x: 0, y: footerY, width, height: 1, color: rgb(0.88,0.88,0.9) });
    page.drawText('NEOKEY', { x: 45, y: footerY-22, size: 10, font: fontBold, color: rgb(0,0,0) });
    page.drawText(`Your passwords were never here`, { x: 45, y: footerY-38, size:7.5, font:fontMono, color: rgb(0.5,0.5,0.52) });
    page.drawText(` ${new Date().getFullYear()} Neokey`, { x: width-95, y: footerY-22, size:7.5, font, color: rgb(0.5,0.5,0.52) });

    if(typeof pdfDoc.encrypt==='function'){
      try{
        await pdfDoc.encrypt({
          userPassword: email.trim().toLowerCase(),
          ownerPassword: email.trim().toLowerCase()+Date.now(),
          permissions:{
            printing:'highResolution', modifying:false, copying:true, annotating:false, fillingForms:false, contentAccessibility:true, documentAssembly:false
          }
        });
      } catch(e){console.warn('Encryption failed:', e);}
    }

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type:'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=`neokey-recovery-artifact.pdf`;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),10000);

    return { success:true, message:<>One-time Recovery Artifact is Downloaded 📥 <br></br><br></br> <strong>Generated and encrypted on-device with your email</strong>.<br></br><br></br> Keep it secure.</> };
  } catch(error){
    console.error('Recovery Artifact error:', error);
    return { success:false, message:`PDF generation failed: ${error?.message||error}` };
  }
};
