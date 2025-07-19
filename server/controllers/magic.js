import crypto from 'crypto';

export const hash = (data) => {
  for (let i = 0; i < Math.floor(Number(process.env.RIMS) / 10); i++) 
    data = crypto.createHmac('sha256', process.env.SALT).update(data).digest('hex');
  return data;
};

export const rim = (data) => {
  for (let i = 0; i < Number(process.env.RIMS); i++) 
    data = crypto.createHmac('sha256', process.env.SALT).update(data).digest('hex');
  return data;
};

export const toHex = (offset) => 
  offset && (offset = offset.replace(/[^.]+/g, num => 
    (Number(num) + +process.env.HEX).toString(16).padStart(2, '0')
  ).replace(/\./g, ''));

export const fromHex = (hexOffset) => 
  hexOffset && (hexOffset = hexOffset.replace(/../g, hex => 
    (parseInt(hex, 16) - +process.env.HEX) + '.'
  ).slice(0, -1));

export const adjustOffset = (input, output, previousOffset = '') =>
    input.split('').map((char, i) => 
      (previousOffset.split('.')[i] ? (Number(previousOffset.split('.')[i]) + (output.charCodeAt(i) - char.charCodeAt(0) + 128) % 128) % 128 : (output.charCodeAt(i) - char.charCodeAt(0) + 128) % 128)
    ).join('.');

export const useOffset = (input, offset = '') =>
  input.split('').map((char, i) =>
    String.fromCharCode(
      (offset.split('.')[i] ? (Number(offset.split('.')[i]) + char.charCodeAt(0)) % 128 : char.charCodeAt(0)) % 128)
  ).join('');

// Cookery
export const cook = (base, serv, tm) => {
  let food = (serv.toString().trim().toLowerCase()) + (base.toString().trim().toLowerCase())

  let hash = rim((food + tm.toString() + process.env.SALT).toLowerCase());

  let ascSum = [...hash].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  let num = [...hash].filter((ch) => /\d/.test(ch));
  let alp = [...hash].filter((ch) => /[a-zA-Z]/.test(ch));

  const nl = num.length, al = alp.length;
  let [i, j] = [ascSum % nl, ascSum % al];
  const nums = [], alps = [];

  while (nums.length < 8 || alps.length < 8) {
    nums.push(num[i]);
    alps.push(alp[j]);
    i = (i + 1) % nl;
    j = (j + 1) % al;
  }

  // let allowedChars = "!#$%*+-./:<=>?@[]^_{|}~" + "0123456789" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz";
  let allowedChars = "!#%*+,-./:;<=>?^_`{|}~()[]" + "0123456789" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" ;
  let key = allowedChars[(Number(tm.slice(6,8) + ascSum)) % 32];
  key += alps.shift().toUpperCase();
  key += nums.shift().toUpperCase();
  key += alps.shift().toLowerCase();
  
  let ctr = 0;
  for (let k = 0; k < 6; k++) {
    ctr += String(nums[k % nums.length]).charCodeAt(0);
    key += allowedChars[ctr % allowedChars.length];
    
    ctr += alps[k % alps.length].charCodeAt(0);
    key += allowedChars[ctr % allowedChars.length];
  };

  return key;
};