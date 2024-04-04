import React, {useContext, useEffect, useRef} from 'react'
import {ProjectTemplateContext} from './ProjectTemplateContext'
import {SettingsPanelContext} from '../SettingsPanelContext'

export const TemplateNameInput = () => {
  const {modifyingCurrentTemplate} = useContext(SettingsPanelContext)
  const {templateName, setTemplateName, setTemplateModifier} = useContext(
    ProjectTemplateContext,
  )
  const container = useRef()

  const onChangeTemplateName = (e) => setTemplateName(e.currentTarget.value)

  useEffect(() => {
    const {current} = container
    const updateName = () => {
      modifyingCurrentTemplate((prevTemplate) => ({
        ...prevTemplate,
        name: templateName,
      }))
    }

    const cancel = () => {
      setTemplateModifier()
      setTemplateName('')
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        updateName()
      } else if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        cancel()
      }
    }

    current.addEventListener('keydown', handleKeyDown, true)

    return () => current.removeEventListener('keydown', handleKeyDown)
  }, [
    modifyingCurrentTemplate,
    setTemplateModifier,
    setTemplateName,
    templateName,
  ])
  return (
    <input
      ref={container}
      className="template-name"
      data-testid="template-name-input"
      value={templateName}
      onChange={onChangeTemplateName}
      autoFocus
    ></input>
  )
}
