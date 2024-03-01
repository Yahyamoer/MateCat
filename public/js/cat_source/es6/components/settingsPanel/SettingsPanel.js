import React, {useState, useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {SettingsPanelContext} from './SettingsPanelContext'
import {ContentWrapper} from './ContentWrapper'
import {MachineTranslationTab} from './Contents/MachineTranslationTab'
import {AdvancedOptionsTab} from './Contents/AdvancedOptionsTab'
import {TranslationMemoryGlossaryTab} from './Contents/TranslationMemoryGlossaryTab'
import {ProjectTemplate} from './ProjectTemplate/ProjectTemplate'
import {SCHEMA_KEYS} from '../../hooks/useProjectTemplates'
import {AnalysisTab} from './Contents/AnalysisTab'
import {QualityFrameworkTab} from './Contents/QualityFrameworkTab'

let tabOpenFromQueryString = new URLSearchParams(window.location.search).get(
  'openTab',
)

export const SETTINGS_PANEL_TABS = {
  translationMemoryGlossary: 'tm',
  machineTranslation: 'mt',
  advancedOptions: 'options',
  analysis: 'analysis',
  qualityFramework: 'qf',
}

export const TEMPLATE_PROPS_BY_TAB = {
  [SETTINGS_PANEL_TABS.translationMemoryGlossary]: [
    SCHEMA_KEYS.tm,
    SCHEMA_KEYS.getPublicMatches,
    SCHEMA_KEYS.pretranslate100,
  ],
  [SETTINGS_PANEL_TABS.machineTranslation]: [SCHEMA_KEYS.mt],
  [SETTINGS_PANEL_TABS.advancedOptions]: [
    SCHEMA_KEYS.speech2text,
    SCHEMA_KEYS.tagProjection,
    SCHEMA_KEYS.lexica,
    SCHEMA_KEYS.crossLanguageMatches,
    SCHEMA_KEYS.segmentationRule,
    SCHEMA_KEYS.idTeam,
  ],
}

const DEFAULT_CONTENTS = (isCattool = config.is_cattool) => {
  return [
    {
      id: SETTINGS_PANEL_TABS.translationMemoryGlossary,
      label: 'Translation Memory and Glossary',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      component: <TranslationMemoryGlossaryTab />,
    },
    {
      id: SETTINGS_PANEL_TABS.machineTranslation,
      label: 'Machine Translation',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      component: <MachineTranslationTab />,
    },
    ...(!isCattool
      ? [
          {
            id: SETTINGS_PANEL_TABS.qualityFramework,
            label: 'Quality framework',
            description:
              'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
            component: <QualityFrameworkTab />,
          },
          {
            id: SETTINGS_PANEL_TABS.analysis,
            label: 'Analysis',
            description:
              'Determines what discount percentage is applied to each match category. More details <a href="#">here</a>.',
            component: <AnalysisTab />,
          },
        ]
      : []),
    {
      id: SETTINGS_PANEL_TABS.advancedOptions,
      label: 'Advanced settings',
      description:
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc vulputate libero et velit interdum, ac aliquet odio mattis.',
      component: <AdvancedOptionsTab />,
    },
  ]
}

export const DEFAULT_ENGINE_MEMORY = {
  id: 1,
  name: 'MyMemory',
  description:
    'Machine translation by the MT engine best suited to your project.',
  default: true,
}
export const MMT_NAME = 'ModernMT'

export const SettingsPanel = ({
  onClose,
  isOpened,
  tabOpen = SETTINGS_PANEL_TABS.translationMemoryGlossary,
  user,
  tmKeys,
  setTmKeys,
  mtEngines,
  setMtEngines,
  sourceLang,
  targetLangs,
  projectTemplates,
  currentProjectTemplate,
  setProjectTemplates,
  modifyingCurrentTemplate,
  checkSpecificTemplatePropsAreModified,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [tabs, setTabs] = useState(() => {
    const initialState = DEFAULT_CONTENTS().map((tab) => ({
      ...tab,
      isOpened: Object.values(SETTINGS_PANEL_TABS).some(
        (value) => value === tabOpenFromQueryString,
      )
        ? tabOpenFromQueryString === tab.id
        : tabOpen === tab.id,
    }))

    tabOpenFromQueryString = false
    return initialState
  })

  const wrapperRef = useRef()

  useEffect(() => {
    setIsVisible(typeof isOpened !== 'undefined' ? isOpened : true)

    const keyboardHandler = (e) => e.key === 'Escape' && setIsVisible(false)
    document.addEventListener('keydown', keyboardHandler)

    return () => document.removeEventListener('keydown', keyboardHandler)
  }, [isOpened])

  useEffect(() => {
    const onTransitionEnd = () => !isVisible && onClose()

    const {current} = wrapperRef
    current.addEventListener('transitionend', onTransitionEnd)

    return () => current.removeEventListener('transitionend', onTransitionEnd)
  }, [isVisible, onClose])

  const close = () => setIsVisible(false)

  const openLoginModal = () => {
    setIsVisible(false)
    APP.openLoginModal()
  }

  const isEnabledProjectTemplateComponent =
    config.isLoggedIn === 1 && !config.is_cattool

  return (
    <SettingsPanelContext.Provider
      value={{
        tabs,
        setTabs,
        user,
        tmKeys,
        setTmKeys,
        mtEngines,
        setMtEngines,
        openLoginModal,
        wrapperRef,
        sourceLang,
        targetLangs,
        projectTemplates,
        currentProjectTemplate,
        setProjectTemplates,
        modifyingCurrentTemplate,
        checkSpecificTemplatePropsAreModified,
        isEnabledProjectTemplateComponent,
      }}
    >
      <div
        className={`settings-panel${
          isOpened || typeof isOpened === 'undefined' ? ' visible' : ''
        }`}
      >
        <div
          className={`settings-panel-overlay${
            isVisible
              ? ' settings-panel-overlay-visible'
              : ' settings-panel-overlay-hide'
          }`}
          onClick={close}
        ></div>
        <div
          ref={wrapperRef}
          className={`settings-panel-wrapper${
            isVisible
              ? ' settings-panel-wrapper-visible'
              : ' settings-panel-wrapper-hide'
          }`}
        >
          {isOpened && (
            <>
              <div className="settings-panel-header">
                <div className="settings-panel-header-logo" />
                <span>Settings</span>
                <div onClick={close} className="close-matecat-modal x-popup" />
              </div>
              {isEnabledProjectTemplateComponent && <ProjectTemplate />}
              {currentProjectTemplate && <ContentWrapper />}
            </>
          )}
        </div>
      </div>
    </SettingsPanelContext.Provider>
  )
}

SettingsPanel.propTypes = {
  onClose: PropTypes.func.isRequired,
  isOpened: PropTypes.bool,
  tabOpen: PropTypes.oneOf(Object.values(SETTINGS_PANEL_TABS)),
  user: PropTypes.object,
  tmKeys: PropTypes.array,
  setTmKeys: PropTypes.func,
  mtEngines: PropTypes.array,
  setMtEngines: PropTypes.func,
  sourceLang: PropTypes.object,
  targetLangs: PropTypes.array,
  projectTemplates: PropTypes.array,
  currentProjectTemplate: PropTypes.any,
  setProjectTemplates: PropTypes.func,
  modifyingCurrentTemplate: PropTypes.func,
  checkSpecificTemplatePropsAreModified: PropTypes.func,
}
