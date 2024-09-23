import React, {createContext, useContext, useEffect, useRef} from 'react'
import {SettingsPanelContext} from '../../../SettingsPanelContext'
import CatToolActions from '../../../../../actions/CatToolActions'
import ModalsActions from '../../../../../actions/ModalsActions'
import {ConfirmDeleteResourceProjectTemplates} from '../../../../modals/ConfirmDeleteResourceProjectTemplates'
import {SubTemplates} from '../../SubTemplates'
import {SCHEMA_KEYS} from '../../../../../hooks/useProjectTemplates'
import {getXliffSettingsTemplates} from '../../../../../api/getXliffSettingsTemplates/getXliffSettingsTemplates'
import defaultXliffSettings from '../../defaultTemplates/xliffSettings.json'
import {createXliffSettingsTemplate} from '../../../../../api/createXliffSettingsTemplate/createXliffSettingsTemplate'
import {updateXliffSettingsTemplate} from '../../../../../api/updateXliffSettingsTemplate/updateXliffSettingsTemplate'
import {deleteXliffSettingsTemplate} from '../../../../../api/deleteXliffSettingsTemplate/deleteXliffSettingsTemplate'
import {Xliff12} from './Xliff12'
import {Xliff20} from './Xliff20'

export const XLIFF_SETTINGS_SCHEMA_KEYS = {
  id: 'id',
  uid: 'uid',
  name: 'name',
  rules: 'rules',
  createdAt: 'created_at',
  modifiedAt: 'modified_at',
}

const getFilteredSchemaCreateUpdate = (template) => {
  /* eslint-disable no-unused-vars */
  const {
    id,
    uid,
    isTemporary,
    isSelected,
    created_at,
    modified_at,
    ...filtered
  } = template
  /* eslint-enable no-unused-vars */
  return filtered
}
const getFilteredSchemaToCompare = (template) => {
  /* eslint-disable no-unused-vars */
  const {
    id,
    uid,
    isTemporary,
    isSelected,
    name,
    created_at,
    modified_at,
    ...filtered
  } = template

  return filtered
  /* eslint-enable no-unused-vars */
}

export const XliffSettingsContext = createContext({})

export const XliffSettings = () => {
  const {
    currentProjectTemplate,
    modifyingCurrentTemplate: modifyingCurrentProjectTemplate,
    fileImportXliffSettingsTemplates,
    portalTarget,
  } = useContext(SettingsPanelContext)

  const {templates, setTemplates, currentTemplate, modifyingCurrentTemplate} =
    fileImportXliffSettingsTemplates

  const currentTemplateId = currentTemplate?.id
  const currentProjectTemplateFiltersId =
    currentProjectTemplate.XliffConfigTemplateId
  const prevCurrentProjectTemplateFiltersId = useRef()

  const saveErrorCallback = (error) => {
    let message = 'There was an error saving your data. Please retry!'
    CatToolActions.addNotification({
      title: 'Error saving data',
      type: 'error',
      text: message,
      position: 'br',
    })
  }

  const getModalTryingSaveIdenticalSettingsTemplate = (templatesInvolved) =>
    new Promise((resolve, reject) => {
      ModalsActions.showModalComponent(
        ConfirmDeleteResourceProjectTemplates,
        {
          projectTemplatesInvolved: templatesInvolved,
          successCallback: () => resolve(),
          cancelCallback: () => reject(),
          content:
            'The extraction parameters you are trying to save has identical settings to the following extraction parameters:',
          footerContent:
            'Please confirm that you want to save a extraction parameters with the same settings as an existing extraction parameters',
        },
        'Extraction parameters',
      )
    })

  // retrieve filters params templates
  useEffect(() => {
    if (templates.length) return

    let cleanup = false

    if (config.isLoggedIn === 1 && !config.is_cattool) {
      getXliffSettingsTemplates().then((templates) => {
        const items = [defaultXliffSettings, ...templates.items]
        if (!cleanup) {
          const selectedTemplateId =
            items.find(({id}) => id === currentProjectTemplateFiltersId)?.id ??
            0

          setTemplates(
            items.map((template) => ({
              ...template,
              isSelected: template.id === selectedTemplateId,
            })),
          )
        }
      })
    } else {
      // not logged in
    }

    return () => (cleanup = true)
  }, [setTemplates, templates.length, currentProjectTemplateFiltersId])

  // Select QF template when curren project template change
  useEffect(() => {
    setTemplates((prevState) =>
      prevState.map((template) => ({
        ...template,
        isSelected: template.id === currentProjectTemplateFiltersId,
      })),
    )
  }, [currentProjectTemplateFiltersId, setTemplates])

  // Modify current project template qa model template id when qf template id change
  useEffect(() => {
    if (
      typeof currentTemplateId === 'number' &&
      currentTemplateId !== prevCurrentProjectTemplateFiltersId.current &&
      currentProjectTemplateFiltersId ===
        prevCurrentProjectTemplateFiltersId.current
    )
      modifyingCurrentProjectTemplate((prevTemplate) => ({
        ...prevTemplate,
        XliffConfigTemplateId: currentTemplateId,
      }))

    prevCurrentProjectTemplateFiltersId.current =
      currentProjectTemplateFiltersId
  }, [
    currentTemplateId,
    currentProjectTemplateFiltersId,
    modifyingCurrentProjectTemplate,
  ])

  return (
    <XliffSettingsContext.Provider
      value={{templates, currentTemplate, modifyingCurrentTemplate}}
    >
      {templates.length > 0 && (
        <div className="settings-panel-box">
          <div className="file-import-tab settings-panel-contentwrapper-tab-background">
            <div className="file-import-tab-header">
              <h2>Xliff import settings</h2>
              <p>
                Set rules for the import of Xliff 1.2 and 2.0 files to decide
                Matecat’s behavior for segments with different states.
              </p>
              <SubTemplates
                {...{
                  templates,
                  setTemplates,
                  currentTemplate,
                  modifyingCurrentTemplate,
                  portalTarget,
                  schema: XLIFF_SETTINGS_SCHEMA_KEYS,
                  propConnectProjectTemplate: SCHEMA_KEYS.XliffConfigTemplateId,
                  getFilteredSchemaCreateUpdate,
                  getFilteredSchemaToCompare,
                  getModalTryingSaveIdenticalSettingsTemplate,
                  createApi: createXliffSettingsTemplate,
                  updateApi: updateXliffSettingsTemplate,
                  deleteApi: deleteXliffSettingsTemplate,
                  saveErrorCallback,
                }}
              />
            </div>
            <Xliff12 />
            <Xliff20 />
          </div>
        </div>
      )}
    </XliffSettingsContext.Provider>
  )
}
