const tPromise = require('./tpromise.js')

// Usage
const returnPromise = (val) => {
  return new tPromise((resolve, reject) => {
    if (val) {
      resolve(val)
    } else {
      reject({ message: 'Induced an error!' })
    }
  })
}

function handleError(e) {
  console.warn(e.message)
}

returnPromise(3)
  // Should log 3
  .then(function success(val) {
    console.log('Step 1: ' + val)
    return val
  })
  // Should log 6
  .then(function successAgain(val) {
    const val2 = val * 2
    console.log('Step 2: ' + val2)
    return val2
  })
  // Should wait 1 second then log We pass some time
  .then(function successTheThird(val) {
    return new tPromise((resolve, reject) => {
      setTimeout(() => {
        // should wait before logging
        console.log('Step 3: We pass some time')
        resolve(val)
      }, 1000)
    })
  })
  // Should log this message after We pass some time
  .then(function oneMoreSuccess(val) {
    // should log this after above, preserving val = 6
    console.log('Step 4: This message should be last and the value from step 2 == ' + val)
    throw new Error('An error appears, let\'s see if catch works...\nIf it does, there will be no trace')
  })
  // This should never be seen, because catch handles the thrown error
  // and stops execution
  .then(function thisWontRun() {
    console.log('You shouldn\'t see this message')
  })
  .catch(handleError)
