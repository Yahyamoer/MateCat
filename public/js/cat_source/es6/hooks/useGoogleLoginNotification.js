import {useEffect} from 'react'
import CatToolActions from '../actions/CatToolActions'

export const GOOGLE_LOGIN_NOTIFICATION = {
  title: 'Google login warning',
  text: 'Content...',
  type: 'warning',
  autoDismiss: false,
  position: 'bl',
  allowHtml: true,
  closeCallback: function () {
    localStorage.removeItem(GOOGLE_LOGIN_LOCAL_STORAGE)
  },
}

export const GOOGLE_LOGIN_LOCAL_STORAGE = 'google_login_notification'

export const useGoogleLoginNotification = () => {
  const shouldShowNotification =
    localStorage.getItem(GOOGLE_LOGIN_LOCAL_STORAGE) === 'true' &&
    !config.isLoggedIn

  useEffect(() => {
    let tmOut

    if (shouldShowNotification) {
      tmOut = setTimeout(
        () => CatToolActions.addNotification(GOOGLE_LOGIN_NOTIFICATION),
        100,
      )
    }

    return () => clearTimeout(tmOut)
  }, [shouldShowNotification])
}
