import React, {createContext, useContext, useEffect, useRef} from 'react'
import {getBillingModelTemplates} from '../../../../api/getBillingModelTemplates'
import {SettingsPanelContext} from '../../SettingsPanelContext'
import {createBillingModelTemplate} from '../../../../api/createBillingModelTemplate'
import {updateBillingModelTemplate} from '../../../../api/updateBillingModelTemplate'
import {deleteBillingModelTemplate} from '../../../../api/deleteBillingModelTemplate'
import {SubTemplates} from '../SubTemplates'
import {InputPercentage} from './InputPercentage'
import {LanguagesExceptions} from './LanguagesExceptions'
import {BreakdownsTable} from './BreakdownsTable'

export const ANALYSIS_SCHEMA_KEYS = {
  id: 'id',
  uid: 'uid',
  name: 'payable_rate_template_name',
  breakdowns: 'breakdowns',
  createdAt: 'createdAt',
  modifiedAt: 'modifiedAt',
  version: 'version',
}
export const ANALYSIS_BREAKDOWNS = {
  newWords: 'NO_MATCH',
  tm50_74: '50%-74%',
  tm75_84: '75%-84%',
  tm85_94: '85%-94%',
  tm95_99: '95%-99%',
  tm100: '100%',
  public100: '100%_PUBLIC',
  repetitions: 'REPETITIONS',
  internal75_99: 'INTERNAL',
  mt: 'MT',
  tm100InContext: 'ICE',
}

const getFilteredSchemaCreateUpdate = (template) => {
  /* eslint-disable no-unused-vars */
  const {
    id,
    uid,
    version,
    createdAt,
    modifiedAt,
    isTemporary,
    isSelected,
    ...filtered
  } = template
  /* eslint-enable no-unused-vars */
  return filtered
}

export const AnalysisTabContext = createContext({})

export const AnalysisTab = () => {
  const {
    currentProjectTemplate,
    modifyingCurrentTemplate: modifyingCurrentProjectTemplate,
    analysisTemplates,
  } = useContext(SettingsPanelContext)

  const {templates, setTemplates, currentTemplate, modifyingCurrentTemplate} =
    analysisTemplates

  const mt = currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.mt]
  const setMt = (value) => setWordsValue(ANALYSIS_BREAKDOWNS.mt, value)

  const currentTemplateId = currentTemplate?.id
  const currentProjectTemplateBillingId =
    currentProjectTemplate.payableRateTemplateId
  const prevCurrentProjectTemplateBillingId = useRef()

  const originalCurrentTemplate = templates?.find(
    ({id, isTemporary}) => id === currentTemplate.id && !isTemporary,
  )
  const isMtSaved =
    originalCurrentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.mt] === mt

  const setWordsValue = (name, value) => {
    modifyingCurrentTemplate((prevTemplate) => {
      return {
        ...prevTemplate,
        breakdowns: {
          ...prevTemplate.breakdowns,
          default: {
            ...prevTemplate.breakdowns.default,
            [name]: value,
          },
        },
      }
    })
  }

  const addException = (newBreakdowns) => {
    modifyingCurrentTemplate((prevTemplate) => {
      return {
        ...prevTemplate,
        breakdowns: {
          ...newBreakdowns,
        },
      }
    })
  }
  // retrieve billing model templates
  useEffect(() => {
    if (templates.length) return

    let cleanup = false

    if (config.isLoggedIn === 1 && !config.is_cattool) {
      getBillingModelTemplates().then(({items}) => {
        if (!cleanup) {
          const selectedTemplateId =
            items.find(({id}) => id === currentProjectTemplateBillingId)?.id ??
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
  }, [setTemplates, templates.length, currentProjectTemplateBillingId])

  // Select billing model template when curren project template change
  useEffect(() => {
    setTemplates((prevState) =>
      prevState.map((template) => ({
        ...template,
        isSelected: template.id === currentProjectTemplateBillingId,
      })),
    )
  }, [currentProjectTemplateBillingId, setTemplates])

  // Modify current project template qa model template id when qf template id change
  useEffect(() => {
    if (
      typeof currentTemplateId === 'number' &&
      currentTemplateId !== prevCurrentProjectTemplateBillingId.current &&
      currentProjectTemplateBillingId ===
        prevCurrentProjectTemplateBillingId.current
    )
      modifyingCurrentProjectTemplate((prevTemplate) => ({
        ...prevTemplate,
        payableRateTemplateId: currentTemplateId,
      }))

    prevCurrentProjectTemplateBillingId.current =
      currentProjectTemplateBillingId
  }, [
    currentTemplateId,
    currentProjectTemplateBillingId,
    modifyingCurrentProjectTemplate,
  ])

  return (
    templates.length > 0 && (
      <div className="settings-panel-box">
        <SubTemplates
          {...{
            templates,
            setTemplates,
            currentTemplate,
            modifyingCurrentTemplate,
            schema: ANALYSIS_SCHEMA_KEYS,
            getFilteredSchemaCreateUpdate,
            createApi: createBillingModelTemplate,
            updateApi: updateBillingModelTemplate,
            deleteApi: deleteBillingModelTemplate,
          }}
        />
        <div className="analysis-tab settings-panel-contentwrapper-tab-background">
          <div className="analysis-tab-head">
            <h2>Lorem ipsum</h2>
            <span>
              Lorem ipsum dolor sit amet consectetur. Vestibulum mauris gravida
              volutpat libero vulputate faucibus ultrices convallis. Non
              sagittis in condimentum lectus dapibus. Vestibulum volutpat tempus
              sed sed odio eleifend porta malesuada.
            </span>
          </div>
          <BreakdownsTable saveValue={setWordsValue} />
          <div className="analysis-tab-exceptionsContainer">
            <div className="analysis-tab-subhead">
              <h3>Machine translation</h3>
              <span>
                Lorem ipsum dolor sit amet consectetur. Vestibulum mauris
                gravida volutpat libero vulputate faucibus ultrices convallis.
                Non sagittis in condimentum lectus dapibus. Vestibulum volutpat
                tempus sed sed odio eleifend porta malesuada.
              </span>
              <InputPercentage
                value={mt}
                setFn={setMt}
                className={!isMtSaved ? 'analysis-value-not-saved' : ''}
              />
            </div>

            <LanguagesExceptions
              breakdowns={currentTemplate.breakdowns}
              updateExceptions={addException}
            />
          </div>
        </div>
      </div>
    )
  )
}
