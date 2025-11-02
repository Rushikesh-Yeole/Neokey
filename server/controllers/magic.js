import crypto from 'crypto';
import { blake3 } from '@noble/hashes/blake3';
import { utf8ToBytes, bytesToHex } from '@noble/hashes/utils';

export const hash = (data) => {
  for (let i = 0; i < Math.floor(Number(process.env.RIMS) / 10); i++) 
    data = crypto.createHmac('sha256', process.env.SALT).update(data).digest('hex');
  return data;
};

export const bhash = (data) => bytesToHex(blake3(utf8ToBytes(data)));

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
export const cook = (base, serv, tm, salt) => {
  const food = (serv.toString()) + (base.toString()) ;
  const hash = rim((food + tm.toString() + salt.toString() + process.env.SALT));

  const ascSum = [...hash].reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  let num = [...hash].filter((ch) => /\d/.test(ch));
  let alp = [...hash].filter((ch) => /[a-zA-Z]/.test(ch));
  if(!num.length) num = [(hash.slice(-1)[0].charCodeAt(0)*17)%10];
  if(alp.length < 2){ alp=[...(hash.slice(-2))].map(c=>String.fromCharCode(65+((c.charCodeAt(0)*7)%26)+((c.charCodeAt(0)*13)%2)*32));};

  const allowedChars = "!#%*+,-./:;<=>?^_`{|}~()[]" + "0123456789" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" ;
  let key = allowedChars[(ascSum) % 25];
  key += alp.shift().toUpperCase();
  key += num.shift();
  key += alp.shift().toLowerCase();
  
  let dish = [...hash];
  let ctr = 0;
  for (let k = 0; k < 16; k++) {
    ctr += String(dish[k % dish.length]).charCodeAt(0);
    key += allowedChars[ctr % allowedChars.length];
  };
  return key;
};