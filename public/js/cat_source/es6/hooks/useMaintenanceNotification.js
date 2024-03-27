import {useEffect} from 'react'
import CatToolActions from '../actions/CatToolActions'

const NOTIFICATION = {
  title: 'Maintenance operations',
  text: `Hello there!<br />Matecat will not be available today from 6 pm CET to 7:30 pm CET due to urgent unforeseen maintenance operations.<br /> 
  We apologize for the inconvenience and the short notice, we will do our best to restore all the services as soon as possible.`,
  type: 'warning',
  autoDismiss: false,
  position: 'bl',
  allowHtml: true,
  closeCallback: () => localStorage.setItem(KEY_LOCAL_STORAGE, 'true'),
}

const KEY_LOCAL_STORAGE = 'maintenance_notification'

export const useMaintenanceNotification = () => {
  useEffect(() => {
    let tmOut

    if (
      !localStorage.getItem(KEY_LOCAL_STORAGE) ||
      localStorage.getItem(KEY_LOCAL_STORAGE) === 'false'
    ) {
      tmOut = setTimeout(
        () => CatToolActions.addNotification(NOTIFICATION),
        100,
      )
    }

    return () => clearTimeout(tmOut)
  }, [])
}
