const errorResponse = function(req, res, errorType) {
  if (errorType === 'loginPostError') {
    return res.status(400).send({message: "Invalid email or password. If you previously logged in with Google, click 'Log in with Google' to access your account."})
  }

  if (errorType === 'forgotPasswordPostError') {
    return res.status(400).send({ message: `No account exists for ${req.body.email}. Maybe you signed up using a different/incorrect e-mail address.`
      })
  }

  if (errorType === 'signupError' || errorType === 'accountPutError') {
    return res.status(409).send({ message: 'The email address you have entered is already associated with another account.' })
  }

  if (errorType === 'oAuthGoogle') {
    return res.status(500).send({ message: "Sorry we could not find your email from Google, please add or make your email available from your Google account. Otherwise you can sign up via our other options. " })
  }

  if (errorType === 'oAuthGithub') {
    return res.status(500).send({ message: "Sorry we could not find your email from Github, please add or make your email available from your Github account. Otherwise you can sign up via our other options. " })
  }

  if (errorType === 'standardError') {
    return res.status(500).send({ message: "We're experiencing technical difficulties at the moment. Please wait and try again later. Thank you." })
  }

}

module.exports = errorResponse