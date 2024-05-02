import React, {useContext, useState} from 'react'
import SocialButtons from './SocialButtons'
import {useForm, Controller} from 'react-hook-form'
import {INPUT_TYPE, Input} from '../common/Input/Input'
import {EMAIL_PATTERN} from '../../constants/Constants'
import {
  BUTTON_HTML_TYPE,
  BUTTON_MODE,
  BUTTON_SIZE,
  BUTTON_TYPE,
  Button,
} from '../common/Button/Button'
import {ONBOARDING_STEP, OnBoardingContext} from './OnBoarding'
import Checkmark from '../../../../../img/icons/Checkmark'
import {registerUser} from '../../api/registerUser'
import ModalsActions from '../../actions/ModalsActions'
import ConfirmRegister from '../modals/ConfirmRegister'

const Register = () => {
  const {setStep} = useContext(OnBoardingContext)
  const [errorMessage, setErrorMessage] = useState()

  const {handleSubmit, control} = useForm()

  const handleFormSubmit = (formData) => {
    setErrorMessage()
    registerUser({
      firstname: formData.name,
      surname: formData.surname,
      email: formData.email,
      password: formData.password,
      passwordConfirmation: formData.password,
      wantedUrl: window.location.href,
    })
      .then(() => {
        const style = {
          width: '25%',
          maxWidth: '450px',
        }
        ModalsActions.showModalComponent(
          ConfirmRegister,
          {emailAddress: formData.email},
          'Confirm Registration',
          style,
        )
      })
      .catch((error) => {
        let generalErrorText
        if (error.message) {
          generalErrorText = error.message
        } else {
          generalErrorText =
            'There was a problem saving the data, please try again later or contact support.'
        }
        setErrorMessage(generalErrorText)
      })
  }

  const showTerms = () => {
    window.open('https://site.matecat.com/terms/', '_blank')
  }
  const gotoSignin = () => setStep(ONBOARDING_STEP.LOGIN)

  return (
    <div className="register-component">
      <div className="column-info">
        <h2>Sign up to Matecat</h2>
        <ul>
          <li>
            <Checkmark size={22} /> Completely free!
          </li>
          <li>
            <Checkmark size={22} /> User friendly
          </li>
          <li>
            <Checkmark size={22} /> GPT-powered AI assistant
          </li>
          <li>
            <Checkmark size={22} /> Best-in-class adaptive Machine Translation
          </li>
          <li>
            <Checkmark size={22} /> Best terminology QA in the industry
          </li>
          <li>
            <Checkmark size={22} /> Live support chat
          </li>
        </ul>
      </div>
      <div className="column-form">
        <h4>Signup with</h4>
        <SocialButtons />
        <div className="register-divider">
          <div />
          <span>Or</span>
          <div />
        </div>
        <form
          className="register-form"
          onSubmit={handleSubmit(handleFormSubmit)}
        >
          <fieldset>
            <Controller
              control={control}
              defaultValue=""
              name="name"
              rules={{
                required: 'This field is mandatory',
              }}
              render={({
                field: {name, onChange, value},
                fieldState: {error},
              }) => (
                <Input placeholder="Name" {...{name, value, onChange, error}} />
              )}
            />
          </fieldset>
          <fieldset>
            <Controller
              control={control}
              defaultValue=""
              name="surname"
              rules={{
                required: 'This field is mandatory',
              }}
              render={({
                field: {name, onChange, value},
                fieldState: {error},
              }) => (
                <Input
                  placeholder="Surname"
                  {...{name, value, onChange, error}}
                />
              )}
            />
          </fieldset>
          <fieldset>
            <Controller
              control={control}
              defaultValue=""
              name="email"
              rules={{
                required: 'This field is mandatory',
                pattern: {
                  value: EMAIL_PATTERN,
                  message: 'Enter a valid email address',
                },
              }}
              render={({
                field: {name, onChange, value},
                fieldState: {error},
              }) => (
                <Input
                  type={INPUT_TYPE.EMAIL}
                  placeholder="Email"
                  {...{name, value, onChange, error}}
                />
              )}
            />
          </fieldset>
          <fieldset>
            <Controller
              control={control}
              defaultValue=""
              name="password"
              rules={{
                required: 'This field is mandatory',
              }}
              render={({
                field: {name, onChange, value},
                fieldState: {error},
              }) => (
                <Input
                  type={INPUT_TYPE.PASSWORD}
                  placeholder="Password"
                  {...{name, value, onChange, error}}
                />
              )}
            />
          </fieldset>
          <fieldset>
            <Controller
              control={control}
              defaultValue={false}
              name="terms"
              rules={{
                required: 'This field is mandatory',
              }}
              render={({
                field: {name, onChange, value},
                fieldState: {error},
              }) => (
                <div className="terms-and-conditions">
                  <div className="input-container">
                    <input
                      type="checkbox"
                      {...{name, value, onChange, error}}
                    />
                    <span>
                      Accept{' '}
                      <Button
                        className="link-underline"
                        type={BUTTON_TYPE.PRIMARY}
                        mode={BUTTON_MODE.LINK}
                        size={BUTTON_SIZE.LINK_SMALL}
                        onClick={showTerms}
                      >
                        Terms and Conditions
                      </Button>
                    </span>
                  </div>

                  {error && (
                    <span className="terms-and-conditions-error">
                      Please agree to the Terms of Service
                    </span>
                  )}
                </div>
              )}
            />
          </fieldset>
          <Button
            type={BUTTON_TYPE.PRIMARY}
            size={BUTTON_SIZE.MEDIUM}
            htmlType={BUTTON_HTML_TYPE.SUBMIT}
          >
            Create account
          </Button>
          {errorMessage && (
            <span className="form-errorMessage">{errorMessage}</span>
          )}
        </form>
        <div className="footer-links-container">
          Already have an account?{' '}
          <Button
            className="link-underline"
            type={BUTTON_TYPE.PRIMARY}
            mode={BUTTON_MODE.LINK}
            size={BUTTON_SIZE.LINK_SMALL}
            onClick={gotoSignin}
          >
            Sign in
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Register
