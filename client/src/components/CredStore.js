// Neokey Volatile Memory Store
// Isolates active salts and keys in a RAM-only closure with a 10-minute TTL.
// Strategy: Zero-persistence. Data is wiped on tab close or timeout.

let _csalt = null;
let _snkey = null;
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

  setSnkey: (val) => { _snkey = val; startTTL(); },
  getSnkey: () => _snkey,

  setCred: (val) => { _cred = val; startTTL(); },
  getCred: () => _cred,

  isUnlocked: () => !!(_snkey && _cred),

  wipe: () => {
    _csalt = null;
    _snkey = null;
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