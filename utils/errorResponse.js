const errorResponse = function(res, req, reason) {
  if (reason === 'loginPostError') {
    return res.status(400).send({message: "Invalid email or password. If you previously logged in with Google, click 'Log in with Google' to access your account."})
  }
  if (reason === 'forgotPasswordPostError') {
    return res.status(400).send({ message: `No account exists for ${req.body.email}. Maybe you signed up using a different/incorrect e-mail address`
      })
  }
  if (reason === 'standardError') {
    return res.status(500).send({ message: "We're experiencing technical difficulties at the moment. Please wait and try again later. Thank you." })
  }
}

module.exports = errorResponse