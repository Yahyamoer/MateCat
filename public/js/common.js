import Cookies from 'js-cookie'
import {filter} from 'lodash'
import ConfirmMessageModal from './cat_source/es6/components/modals/ConfirmMessageModal'
import {downloadFileGDrive} from './cat_source/es6/api/downloadFileGDrive'
import ModalsActions from './cat_source/es6/actions/ModalsActions'
import CommonUtils from './cat_source/es6/utils/commonUtils'
import CatToolActions from './cat_source/es6/actions/CatToolActions'
import SuccessModal from './cat_source/es6/components/modals/SuccessModal'
import PreferencesModal from './cat_source/es6/components/modals/PreferencesModal'
import ResetPasswordModal from './cat_source/es6/components/modals/ResetPasswordModal'
import RegisterModal from './cat_source/es6/components/modals/RegisterModal'
import {onModalWindowMounted} from './cat_source/es6/components/modals/ModalWindow'
import LoginModal from './cat_source/es6/components/modals/LoginModal'

window.APP = null

window.APP = {
  teamStorageName: 'defaultTeam',
  init: function () {
    this.setLoginEvents()
  },
  /*************************************************************************************************************/
  setLoginEvents: function () {},

  openLoginModal: function (param = {}) {
    var title = 'Add project to your management panel'
    var style = {
      width: '80%',
      maxWidth: '800px',
      minWidth: '600px',
    }
    var props = {
      googleUrl: config.authURL,
      ...param,
    }

    ModalsActions.showModalComponent(LoginModal, props, title, style)
  },
  openRegisterModal: (params) => {
    let props = {
      googleUrl: config.authURL,
    }
    if (params) {
      props = {
        ...props,
        ...params,
      }
    }
    ModalsActions.showModalComponent(RegisterModal, props, 'Register Now')
  },
  openPreferencesModal: ({showGDriveMessage = false} = {}) => {
    const style = {
      width: '700px',
      maxWidth: '700px',
    }
    ModalsActions.showModalComponent(
      PreferencesModal,
      {showGDriveMessage},
      'Profile',
      style,
    )
  },
  openSuccessModal: (props) => {
    ModalsActions.showModalComponent(SuccessModal, props, props.title)
  },
  openResetPassword: () => {
    let props = {closeOnOutsideClick: false, showOldPassword: true}
    if (APP.lookupFlashServiceParam('popup')) {
      props.showOldPassword = false
    }
    ModalsActions.showModalComponent(
      ResetPasswordModal,
      props,
      'Reset Password',
    )
  },
  lookupFlashServiceParam: function (name) {
    if (config.flash_messages && config.flash_messages.service) {
      return filter(config.flash_messages.service, function (service) {
        return service.key == name
      })
    }
  },
  getLastTeamSelected: function (teams) {
    if (config.isLoggedIn) {
      if (localStorage.getItem(this.teamStorageName)) {
        var lastId = localStorage.getItem(this.teamStorageName)
        var team = teams.find(function (t) {
          return parseInt(t.id) === parseInt(lastId)
        })
        if (team) {
          return team
        } else {
          return teams[0]
        }
      } else {
        return teams[0]
      }
    }
  },

  setTeamInStorage(teamId) {
    localStorage.setItem(this.teamStorageName, teamId)
  },

  downloadFile: function (idJob, pass, callback) {
    //create an iFrame element
    var iFrameDownload = $(document.createElement('iframe')).hide().prop({
      id: 'iframeDownload',
      src: '',
    })

    //append iFrame to the DOM
    $('body').append(iFrameDownload)

    //generate a token download
    var downloadToken =
      new Date().getTime() + '_' + parseInt(Math.random(0, 1) * 10000000)

    //set event listner, on ready, attach an interval that check for finished download
    iFrameDownload.ready(function () {
      //create a GLOBAL setInterval so in anonymous function it can be disabled
      var downloadTimer = window.setInterval(function () {
        //check for cookie
        var token = Cookies.get(downloadToken)

        //if the cookie is found, download is completed
        //remove iframe an re-enable download button
        if (typeof token != 'undefined') {
          /*
           * the token is a json and must be read with "parseJSON"
           * in case of failure:
           *      error_message = Object {code: -110, message: "Download failed.
           *      Please contact the owner of this MateCat instance"}
           *
           * in case of success:
           *      error_message = Object {code: 0, message: "Download Complete."}
           *
           */
          var tokenData = $.parseJSON(token)
          if (parseInt(tokenData.code) < 0) {
            APP.showDownloadErrorMessage()
          }
          if (callback) {
            callback()
          }

          window.clearInterval(downloadTimer)
          Cookies.set(downloadToken, null, {
            path: '/',
            expires: -1,
            secure: true,
          })
          iFrameDownload.remove()
        }
      }, 2000)
    })

    //clone the html form and append a token for download
    // var iFrameForm = $("#fileDownload").clone().append(
    //     $( document.createElement( 'input' ) ).prop({
    //         type:'hidden',
    //         name:'downloadToken',
    //         value: downloadToken
    //     })
    // );

    var iFrameForm = $(
      '<form id="fileDownload" action="' +
        config.basepath +
        `api/v2/translation/${idJob}/${pass}` +
        '" method="GET">' +
        '<input type="hidden" name="download_type" value="all" />' +
        '<input type="hidden" name="downloadToken" value="' +
        downloadToken +
        '" />' +
        '</form>',
    )

    //append from to newly created iFrame and submit form post
    iFrameDownload.contents().find('body').append(iFrameForm)
    iFrameDownload.contents().find('#fileDownload').submit()
  },

  showDownloadErrorMessage: function () {
    const notification = {
      title: 'Error',
      text:
        'Download failed. Please, fix any tag issues and try again in 5 minutes. If it still fails, please, contact ' +
        config.support_mail,
      type: 'error',
    }
    CatToolActions.addNotification(notification)
  },

  downloadGDriveFile: function (openOriginalFiles, jobId, pass, callback) {
    if (typeof openOriginalFiles === 'undefined') {
      openOriginalFiles = 0
    }

    if (typeof window.googleDriveWindows == 'undefined') {
      window.googleDriveWindows = {}
    }

    if (CommonUtils.isSafari) {
      var windowReference = window.open()
    }
    var driveUpdateDone = function (data) {
      if (!data.urls || data.urls.length === 0) {
        var props = {
          text:
            'Matecat was not able to update project files on Google Drive. Maybe the project owner revoked privileges to access those files. Ask the project owner to login again and' +
            ' grant Google Drive privileges to Matecat.',
          successText: 'Ok',
          successCallback: function () {
            ModalsActions.onCloseModal()
          },
        }
        ModalsActions.showModalComponent(
          ConfirmMessageModal,
          props,
          'Download fail',
        )
        return
      }

      var winName

      $.each(data.urls, function (index, item) {
        winName = 'window' + item.localId
        if (CommonUtils.isSafari) {
          windowReference.location = item.alternateLink
        } else if (
          window.googleDriveWindows[winName] &&
          !window.googleDriveWindows[winName].closed &&
          window.googleDriveWindows[winName].location != null
        ) {
          window.googleDriveWindows[winName].location.href = item.alternateLink
          window.googleDriveWindows[winName].focus()
        } else {
          window.googleDriveWindows[winName] = window.open(item.alternateLink)
        }
      })
    }
    var downloadToken =
      new Date().getTime() + '_' + parseInt(Math.random(0, 1) * 10000000)

    downloadFileGDrive(openOriginalFiles, jobId, pass, downloadToken)
      .then((data) => {
        driveUpdateDone(data)
        if (callback) {
          callback()
        }
      })
      .catch(() => {
        if (callback) {
          callback()
        }
        var cookie = Cookies.get(downloadToken)
        if (cookie) {
          this.showDownloadErrorMessage()
          var props = {
            text: cookie.message,
            successText: 'Ok',
            successCallback: function () {
              ModalsActions.onCloseModal()
            },
          }
          ModalsActions.showModalComponent(
            ConfirmMessageModal,
            props,
            'Download fail',
          )
          Cookies.remove(downloadToken)
        }
      })
  },
}

document.addEventListener('DOMContentLoaded', function (event) {
  APP.init()
})
