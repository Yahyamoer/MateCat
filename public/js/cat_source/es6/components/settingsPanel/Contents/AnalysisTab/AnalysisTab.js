import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {getBillingModelTemplates} from '../../../../api/getBillingModelTemplates'
import {SettingsPanelContext} from '../../SettingsPanelContext'
import {createBillingModelTemplate} from '../../../../api/createBillingModelTemplate'
import {updateBillingModelTemplate} from '../../../../api/updateBillingModelTemplate'
import {deleteBillingModelTemplate} from '../../../../api/deleteBillingModelTemplate'
import {SubTemplates} from '../SubTemplates'
import {Select} from '../../../common/Select'
import {CreateProjectContext} from '../../../createProject/CreateProjectContext'
import Checkmark from '../../../../../../../img/icons/Checkmark'
import AddWide from '../../../../../../../img/icons/AddWide'
import {
  Button,
  BUTTON_MODE,
  BUTTON_SIZE,
  BUTTON_TYPE,
} from '../../../common/Button/Button'
import IconClose from '../../../icons/IconClose'

export const ANALYSIS_SCHEMA_KEYS = {
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

export const AnalysisTabContext = createContext({})

export const AnalysisTab = () => {
  const {
    currentProjectTemplate,
    modifyingCurrentTemplate: modifyingCurrentProjectTemplate,
    analysisTemplates,
  } = useContext(SettingsPanelContext)

  const {templates, setTemplates, currentTemplate, modifyingCurrentTemplate} =
    analysisTemplates

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
  const mt = currentTemplate?.breakdowns.default[ANALYSIS_BREAKDOWNS.mt]
  const setMt = (value) => setWordsValue(ANALYSIS_BREAKDOWNS.mt, value)

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
          setTemplates(
            items.map((template) => ({
              ...template,
              isSelected: template.id === currentProjectTemplateBillingId,
            })),
          )
        }
      })
    } else {
      // not logged in
    }

    return () => (cleanup = true)
  }, [setTemplates, templates, currentProjectTemplateBillingId])

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
                    <InputPercentage
                      value={repetitions}
                      setFn={setRepetitions}
                    />
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
          <div className="analysis-tab-exceptionsContainer">
            <div className="analysis-tab-subhead">
              <h3>Machine translation</h3>
              <span>
                Lorem ipsum dolor sit amet consectetur. Vestibulum mauris
                gravida volutpat libero vulputate faucibus ultrices convallis.
                Non sagittis in condimentum lectus dapibus. Vestibulum volutpat
                tempus sed sed odio eleifend porta malesuada.
              </span>
              <InputPercentage value={mt} setFn={setMt} />
            </div>

            <LanguagesExceptions
              object={currentTemplate.breakdowns}
              updateExceptions={addException}
            />
          </div>
        </div>
      </div>
    )
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
      className="input-percentage"
      ref={inputRef}
      value={inputValue + '%'}
      onInput={(e) => onPercentInput(e)}
      onBlur={onBlur}
    />
  )
}

const LanguagesExceptions = ({object, updateExceptions}) => {
  const [exceptions, setExceptions] = useState([])

  const [addExceptionCounter, setAddExceptionCounter] = useState(0)

  const evaluateExceptions = useCallback(() => {
    let exceptions = []
    for (const [source, value] of Object.entries(object)) {
      if (source !== 'default' && source.indexOf('-') > -1) {
        for (const [target, data] of Object.entries(value)) {
          exceptions.push({
            source: source,
            target: target,
            data: data,
          })
        }
      }
    }
    setExceptions(exceptions)
    setAddExceptionCounter(exceptions.length ? 0 : 1)
  }, [object])

  useEffect(() => {
    evaluateExceptions()
  }, [evaluateExceptions, object])

  const addException = ({source, target, value}) => {
    const newException = {
      [source.code]: {
        ...object[source.code],
        [target.code]: {
          ...object.default,
          MT: value,
        },
      },
    }
    updateExceptions({
      ...object,
      ...newException,
    })
  }
  const removeException = (exception) => {
    let newObject = {...object}
    delete newObject[exception.source][exception.target]
    if (Object.keys(newObject[exception.source]).length === 0) {
      delete newObject[exception.source]
    }
    updateExceptions({
      ...newObject,
    })
  }
  const modifyException = (oldException, newException) => {
    removeException(oldException)
    addException(newException)
  }
  return (
    <div className="analysis-tab-exceptions">
      <h3>Exceptions</h3>
      {exceptions.map((item) => {
        return (
          <LanguageException
            exception={item}
            addException={(newException) => modifyException(item, newException)}
            removeException={() => removeException(item)}
            key={item.source + '-' + item.target}
            confirmed={true}
          />
        )
      })}
      {[...Array(addExceptionCounter)].map((e, i) => (
        <LanguageException
          addException={addException}
          key={'newExc' + i}
          removeException={() => {
            setAddExceptionCounter((prevState) => prevState - 1)
          }}
        />
      ))}
      <Button
        className="add-button"
        type={BUTTON_TYPE.PRIMARY}
        size={BUTTON_SIZE.MEDIUM}
        onClick={() => setAddExceptionCounter((prevState) => prevState + 1)}
      >
        <AddWide size={12} />
        Add exception
      </Button>
    </div>
  )
}
const LanguageException = ({
  exception,
  confirmed = false,
  addException,
  removeException,
}) => {
  const {languages} = useContext(CreateProjectContext)
  const [source, setSource] = useState(
    exception ? languages.find((l) => exception.source === l.id) : undefined,
  )
  const [target, setTarget] = useState(
    exception ? languages.find((l) => exception.target === l.id) : undefined,
  )
  const [value, setValue] = useState(exception ? exception.data.MT : undefined)
  const [modified, setModified] = useState(false)
  return (
    <div className="analysis-tab-exceptionsRow">
      <div className="analysis-tab-languages">
        <Select
          name={'lang'}
          showSearchBar={true}
          options={languages}
          onSelect={(option) => {
            setSource(option)
            setModified(true)
          }}
          placeholder={'Please select language'}
          activeOption={source}
        />
        {/*TODO swap lingue*/}
        <div id="swaplang" title="Swap languages" onClick={() => {}} />
        <Select
          name={'lang'}
          showSearchBar={true}
          options={languages}
          onSelect={(option) => {
            setTarget(option)
            setModified(true)
          }}
          placeholder={'Please select language'}
          activeOption={target}
        />
      </div>
      <InputPercentage
        value={value}
        setFn={(value) => {
          setValue(value)
          setModified(true)
        }}
      />
      {/*TODO check form*/}

      {confirmed && !modified ? (
        <div className="analysis-tab-buttons">
          <Button
            size={BUTTON_SIZE.SMALL}
            mode={BUTTON_MODE.GHOST}
            onClick={removeException}
          >
            <IconClose />
          </Button>
        </div>
      ) : (
        <div className="analysis-tab-buttons">
          <Button
            type={BUTTON_TYPE.PRIMARY}
            size={BUTTON_SIZE.MEDIUM}
            disabled={source && target && value ? false : true}
            className={'confirm-button'}
            onClick={() => {
              addException({source, target, value})
              setModified(false)
            }}
          >
            <Checkmark size={12} />
            Confirm
          </Button>
          <Button
            type={BUTTON_TYPE.WARNING}
            size={BUTTON_SIZE.MEDIUM}
            className="close-button"
            onClick={removeException}
          >
            <IconClose />
          </Button>
        </div>
      )}
    </div>
  )
}
