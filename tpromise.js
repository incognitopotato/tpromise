// States as 'enum', used to determine the status of the tPromise
const statuses = Object.freeze({
  RESOLVED: Symbol('resolved'),
  REJECTED: Symbol('rejected'),
  PENDING: Symbol('pending')
})

// Implemented as constructor fn
module.exports = function tPromise (fn) {
  // PRIVATE
  // Used to iterate through callbacks
  let i = 0
  // Status will change to reflect whether reject / resolve was called
  let status = statuses.PENDING
  // Holds value when reject / resolve is called
  let val
  // Register error handler from .catch()
  let _errorHandler
  // Register success handler from .then()
  let _successHandlers = []
  // This is used by other tPromises
  let handleDone

  // PUBLIC API
  this.then = registerSuccess
  this.catch = registerHandleError

  // Execute constructor function arg
  setTimeout(() => {
    fn(_resolve, _reject)
  }, 0)

  /**
   * This is shown to the user as the public .then(cb) method.  Cbs are pushed into array for ordered execution
   * @param cb {function(val)} a function to handle the return value
   * @returns {tPromise} returns this instance of tPromise to allow for then chaining
   */
  function registerSuccess (cb) {
    _successHandlers.push(cb)
    return this
  }

  /**
   * This is shown to the user as the public .catch(cb) method (which is a protected keyword, thus the alternate naming
   * here.  We do not return this instance of tPromise here because catch is the last 'link' when you chain
   * @param cb {function(e)} an error handler function
   */
  function registerHandleError (cb) {
    _errorHandler = cb
  }

  /**
   * This function is passed into the callback provided to the constructor to allow user to resolve
   * @param value
   * @private
   */
  function _resolve (value) {
    val = value
    status = statuses.RESOLVED

    _handleOutcome()
  }

  /**
   * This function is passed into the callback provided to the constructor to allow the user to reject
   * @param err
   * @private
   */
  function _reject (err) {
    val = err
    status = statuses.REJECTED

    _handleOutcome()
  }

  /**
   * This function is executed by both _handleOutcome inside of a setTimeout.  It is responsible for checking the result
   * of the previous cb and deciding to either handle the value or to defer until the higher stack tPromise has returned
   * @param result
   * @private
   */
  function _handleResult (result) {
    // If we have an error at any point or we reject at any layer, we don't go
    // any further
    if (status === statuses.REJECTED) {
      return
    }

    // If the result of our cb is a new tPromise, we'll wait for that to
    // finish before proceeding
    if (result instanceof tPromise) {
      // A tPromise within a tPromise 0_0
      result
        .then(v => {
          _resolve(v)
        })
        .catch(e => {
          _reject(e)
        })
    } else {
      _resolve(result)
    }
  }

  /**
   * This function is responsible for deciding how to handle the outcome of a resolve/reject.  If we have a successful
   * resolve, we get the result and allow it to be handled.  If we have a rejection, we use our registered error handler
   * to let the user decide
   * @private
   */
  function _handleOutcome () {
    switch (status) {
      // Used when called with _resolve
      case statuses.RESOLVED:
        // If we've registered a callback with then or more than one
        if (_successHandlers.length > i) {
          let result

          try {
            // Store result
            result = _successHandlers[i++](val)
          } catch (e) {
            _reject(e)
          }

          // Now that we have a result, we should handle it based on type
          // If it is a new tPromise, we need to wait to resolve it.  Using
          // setTimeout to run event loop to make sure that our status is
          // set correctly.
          setTimeout(() => _handleResult(result), 0)
        }

        break

      // Used when called with _reject
      case statuses.REJECTED:
        if (_errorHandler) {
          _errorHandler(val)
        } else {
          throw new Error('Unhandled tPromise Exception!  Use the .catch(err) method to handle this!')
        }
        break

      default:
        break
    }
  }
}
