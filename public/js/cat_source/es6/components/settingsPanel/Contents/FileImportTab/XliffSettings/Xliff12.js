import React, {useCallback, useContext, useMemo, useState} from 'react'
import {XliffSettingsContext} from './XliffSettings'
import {XliffRulesRow} from './XliffRulesRow'
import {Accordion} from '../../../../common/Accordion/Accordion'
import Switch from '../../../../common/Switch'
import xliffOptions from '../../defaultTemplates/xliffOptions.json'
import {
  Button,
  BUTTON_SIZE,
  BUTTON_TYPE,
} from '../../../../common/Button/Button'
import IconAdd from '../../../../icons/IconAdd'

export const Xliff12 = () => {
  const {currentTemplate, modifyingCurrentTemplate} =
    useContext(XliffSettingsContext)

  const [isUseCustomRules, setIsUseCustomRules] = useState(false)

  const xliff12 = useMemo(
    () =>
      currentTemplate.rules.xliff12.map((item, index) => ({
        ...item,
        id: index,
      })),
    [currentTemplate.rules.xliff12],
  )

  const onChange = useCallback(
    (value) => {
      const {id, ...restProps} = value
      modifyingCurrentTemplate((prevTemplate) => ({
        ...prevTemplate,
        rules: {
          ...prevTemplate.rules,
          xliff12: prevTemplate.rules.xliff12.map((row, index) =>
            index === id ? restProps : row,
          ),
        },
      }))
    },
    [modifyingCurrentTemplate],
  )

  const onAdd = useCallback(() => {
    modifyingCurrentTemplate((prevTemplate) => ({
      ...prevTemplate,
      rules: {
        ...prevTemplate.rules,
        xliff12: [
          ...prevTemplate.rules.xliff12,
          {
            id: prevTemplate.rules.length,
            states: ['translated'],
            analysis: 'new',
          },
        ],
      },
    }))
  }, [modifyingCurrentTemplate])
  const onDelete = useCallback(
    (id) => {
      modifyingCurrentTemplate((prevTemplate) => ({
        ...prevTemplate,
        rules: {
          ...prevTemplate.rules,
          xliff12: prevTemplate.rules.xliff12.filter(
            (row, index) => index !== id,
          ),
        },
      }))
    },
    [modifyingCurrentTemplate],
  )

  const accordionNodeWithSwitch = (
    <div className="use-custom-rules-switch">
      <Switch
        active={isUseCustomRules}
        onChange={(active) => setIsUseCustomRules(active)}
        activeText={''}
        inactiveText={''}
      />
      Use custom rules
    </div>
  )

  return (
    <div className="xliff-settings-container">
      <h2>Xliff 1.2</h2>
      <Accordion
        id="xliff12"
        title={accordionNodeWithSwitch}
        expanded={isUseCustomRules}
      >
        <div className="xliff-settings-content">
          <div className="xliff-settings-table">
            <span className="xliff-settings-column-name xliff-settings-column-name-state">
              State / State qualifier
            </span>
            <span className="xliff-settings-column-name">Analysis</span>
            <span className="xliff-settings-column-name xliff-settings-column-name-editor">
              Editor
            </span>
            {xliff12.map((row, index) => (
              <XliffRulesRow
                key={index}
                value={row}
                onChange={onChange}
                onDelete={onDelete}
                xliffOptions={xliffOptions.xliff12}
              />
            ))}
          </div>
          <Button
            className="button-add-rule"
            type={BUTTON_TYPE.PRIMARY}
            size={BUTTON_SIZE.MEDIUM}
            onClick={onAdd}
          >
            <IconAdd size={22} /> Add rule
          </Button>
        </div>
      </Accordion>
    </div>
  )
}
