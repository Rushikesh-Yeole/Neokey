/*
* RAM-Only identifiers store
* Strategy: Zero Persistence.
* This module isolates cryptographic material in a closure.
* Data stored here persists ONLY for the duration of the page session (RAM).
*/

let _csalt = null;
let _bsalt = null;
let _cred  = null;
let _timeoutId = null;

const startTTL = () => {
  if (!_timeoutId) {
    _timeoutId = setTimeout(CredStore.wipe, 10 * 60 * 1000);
  }
};

const CredStore = {
  
  setCsalt: (val) => { _csalt = val; startTTL(); },
  getCsalt: () => _csalt,

  setBsalt: (val) => { _bsalt = val; startTTL(); },
  getBsalt: () => _bsalt,

  setCred: (val) => { _cred = val; startTTL(); },
  getCred: () => _cred,

  isUnlocked: () => !!(_bsalt && _cred),

  wipe: () => {
    _csalt = null;
    _bsalt = null;
    _cred = null;

  if (_timeoutId) {
      clearTimeout(_timeoutId);
      _timeoutId = null;
    }
    window.dispatchEvent(new Event('credstore-wiped'));

  }
};

Object.freeze(CredStore);
export default CredStore;