/*
* RAM-Only identifiers store
* Strategy: Zero Persistence.
* This module isolates cryptographic material in a closure.
* Data stored here persists ONLY for the duration of the page session (RAM).
*/

let _csalt = null;
let _bsalt = null;
let _cred  = null;

const CredStore = {
  
  setCsalt: (val) => { _csalt = val; },
  getCsalt: () => _csalt,

  setBsalt: (val) => { _bsalt = val; },
  getBsalt: () => _bsalt,

  setCred: (val) => { _cred = val; },
  getCred: () => _cred,

  isUnlocked: () => !!(_bsalt && _cred),

  wipe: () => {
    _csalt = null;
    _bsalt = null;
    _cred = null;
  }
};

Object.freeze(CredStore);
export default CredStore;