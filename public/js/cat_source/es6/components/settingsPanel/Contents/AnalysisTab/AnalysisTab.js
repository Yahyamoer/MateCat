import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import Switch from '../../../common/Switch'
import {getBillingModelTemplates} from '../../../../api/getBillingModelTemplates'
import useTemplates from '../../../../hooks/useTemplates'
import {SettingsPanelContext} from '../../SettingsPanelContext'
import {createBillingModelTemplate} from '../../../../api/createBillingModelTemplate'
import {updateBillingModelTemplate} from '../../../../api/updateBillingModelTemplate'
import {deleteBillingModelTemplate} from '../../../../api/deleteBillingModelTemplate'
import {SubTemplates} from '../SubTemplates'

const ANALYSIS_SCHEMA_KEYS = {
  id: 'id',
  uid: 'uid',
  name: 'payable_rate_template_name',
  breakdowns: 'breakdowns',
  createdAt: 'createdAt',
  modifiedAt: 'modifiedAt',
  version: 'version',
}
const ANALYSIS_BREAKDOWNS = {
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

const getMemoTemplates = (() => {
  let _templates = []

  return () =>
    new Promise((resolve) => {
      if (!_templates.length) {
        // fetch templates
        getBillingModelTemplates().then(({items}) => {
          _templates = items
          resolve(items)
        })
      } else {
        resolve(_templates)
      }
    })
})()

export const AnalysisTabContext = createContext({})

export const AnalysisTab = () => {
  const {
    currentProjectTemplate,
    modifyingCurrentTemplate: modifyingCurrentProjectTemplate,
  } = useContext(SettingsPanelContext)

  const {templates, setTemplates, currentTemplate, modifyingCurrentTemplate} =
    useTemplates(ANALYSIS_SCHEMA_KEYS)

  const [matches100InScope, setMatches100InScope] = useState(true)
  const [matches101InScope, setMatches101InScope] = useState(false)

  const newWords =
    currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.newWords]
  const setNewWords = (value) =>
    setWordsValue(ANALYSIS_BREAKDOWNS.newWords, value)
  const repetitions =
    currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.repetitions]
  const setRepetitions = (value) =>
    setWordsValue(ANALYSIS_BREAKDOWNS.repetitions, value)
  const internal75_99 =
    currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.internal75_99]
  const setInternal75_99 = (value) =>
    setWordsValue(ANALYSIS_BREAKDOWNS.internal75_99, value)
  const tm50_74 =
    currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.tm50_74]
  const setTm50_74 = (value) =>
    setWordsValue(ANALYSIS_BREAKDOWNS.tm50_74, value)
  const tm75_84 =
    currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.tm75_84]
  const setTm75_84 = (value) =>
    setWordsValue(ANALYSIS_BREAKDOWNS.tm75_84, value)
  const tm85_94 =
    currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.tm85_94]
  const setTm85_94 = (value) =>
    setWordsValue(ANALYSIS_BREAKDOWNS.tm85_94, value)
  const tm95_99 =
    currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.tm95_99]
  const setTm95_99 = (value) =>
    setWordsValue(ANALYSIS_BREAKDOWNS.tm95_99, value)
  const tm100 = currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.tm100]
  const setTm100 = (value) => setWordsValue(ANALYSIS_BREAKDOWNS.tm100, value)
  const public100 =
    currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.public100]
  const setPublic100 = (value) =>
    setWordsValue(ANALYSIS_BREAKDOWNS.public100, value)
  const tm100InContext =
    currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.tm100InContext]
  const setTm100InContext = (value) =>
    setWordsValue(ANALYSIS_BREAKDOWNS.tm100InContext, value)

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

  const currentTemplateId = currentTemplate?.id
  const currentProjectTemplateBillingId =
    currentProjectTemplate.payableRateTemplateId
  const prevCurrentProjectTemplateBillingId = useRef()

  // select billing model template when curren project template change
  if (
    prevCurrentProjectTemplateBillingId.current !==
      currentProjectTemplateBillingId &&
    currentTemplateId !== currentProjectTemplateBillingId &&
    templates.length
  ) {
    setTemplates((prevState) =>
      prevState.map((template) => ({
        ...template,
        isSelected: template.id === currentProjectTemplateBillingId,
      })),
    )
  }

  prevCurrentProjectTemplateBillingId.current = currentProjectTemplateBillingId

  // retrieve billing model templates
  useEffect(() => {
    let cleanup = false

    if (config.isLoggedIn === 1 && !config.is_cattool) {
      getMemoTemplates().then((templates) => {
        if (!cleanup) {
          setTemplates(
            templates.map((template) => ({
              ...template,
              isSelected:
                template.id === prevCurrentProjectTemplateBillingId.current,
            })),
          )
        }
      })
    } else {
      // not logged in
    }

    return () => (cleanup = true)
  }, [setTemplates])

  // Modify current project template qa model template id when qf template id change
  useEffect(() => {
    if (
      typeof currentTemplateId === 'number' &&
      currentTemplateId !== prevCurrentProjectTemplateBillingId.current
    )
      modifyingCurrentProjectTemplate((prevTemplate) => ({
        ...prevTemplate,
        payableRateTemplateId: currentTemplateId,
      }))
  }, [currentTemplateId, modifyingCurrentProjectTemplate])

  return (
    <div>
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
          <h2>Pre-translate settings</h2>
          <span>
            Select whether 100%/101% matches are in-scope for the job. If they
            are out of scope, their payable rate will be set to 0% and they will
            be preapproved and locked in the editor window
          </span>
        </div>
        <div>
          <div className="analysis-tab-switchContainer">
            <h3>100% matches</h3>
            <Switch
              onChange={(value) => {
                setMatches100InScope(value)
              }}
              active={matches100InScope}
              activeText={'In scope'}
              inactiveText={'Out of scope'}
            />
          </div>
          <div className="analysis-tab-switchContainer">
            <h3>101% matches</h3>
            <Switch
              onChange={(value) => {
                setMatches101InScope(value)
              }}
              active={matches101InScope}
              activeText={'In scope'}
              inactiveText={'Out of scope'}
            />
          </div>
        </div>
        <div className="analysis-tab-head">
          <h2>Lorem ipsum</h2>
          <span>
            Lorem ipsum dolor sit amet consectetur. Vestibulum mauris gravida
            volutpat libero vulputate faucibus ultrices convallis. Non sagittis
            in condimentum lectus dapibus. Vestibulum volutpat tempus sed sed
            odio eleifend porta malesuada.
          </span>
        </div>
        <div className="analysis-tab-tableContainer">
          <table>
            <thead>
              <tr>
                <th>New</th>
                <th>Repetitions</th>
                <th>Internal matches 75-99%</th>
                <th>TM Partial 50-74%</th>
                <th>TM Partial 75-84%</th>
                <th>TM Partial 85-94%</th>
                <th>TM Partial 95-99%</th>
                <th>TM 100%</th>
                <th>Public TM 100%</th>
                <th>TM 100% in context</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <InputPercentage value={newWords} setFn={setNewWords} />
                </td>
                <td>
                  <InputPercentage value={repetitions} setFn={setRepetitions} />
                </td>
                <td>
                  <InputPercentage
                    value={internal75_99}
                    setFn={setInternal75_99}
                  />
                </td>
                <td>
                  <InputPercentage value={tm50_74} setFn={setTm50_74} />
                </td>
                <td>
                  <InputPercentage value={tm75_84} setFn={setTm75_84} />
                </td>
                <td>
                  <InputPercentage value={tm85_94} setFn={setTm85_94} />
                </td>
                <td>
                  <InputPercentage value={tm95_99} setFn={setTm95_99} />
                </td>
                <td>
                  <InputPercentage value={tm100} setFn={setTm100} />
                </td>
                <td>
                  <InputPercentage value={public100} setFn={setPublic100} />
                </td>
                <td>
                  <InputPercentage
                    value={tm100InContext}
                    setFn={setTm100InContext}
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
const InputPercentage = ({value = '', setFn}) => {
  const inputRef = useRef()
  const [inputValue, setInputValue] = useState(value)
  const onPercentInput = (e) => {
    let int = e.target.value.split('%')[0]
    int = parseInt(int)
    int = isNaN(int) ? '' : int
    if (int > 100) {
      int = 100
    }
    setInputValue(int)
  }
  const onBlur = () => {
    let int = inputValue
    int = int === '' ? 0 : int
    setInputValue(int)
    setFn(int)
  }
  useEffect(() => {
    setInputValue(value)
  }, [value])
  return (
    <input
      ref={inputRef}
      value={inputValue + '%'}
      onInput={(e) => onPercentInput(e)}
      onBlur={onBlur}
    />
  )
}
