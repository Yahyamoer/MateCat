import React, {useContext, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {QualityFrameworkTabContext} from './QualityFrameworkTab'
import {MenuButton} from '../../../common/MenuButton/MenuButton'
import {MenuButtonItem} from '../../../common/MenuButton/MenuButtonItem'
import {SettingsPanelContext} from '../../SettingsPanelContext'
import IconEdit from '../../../icons/IconEdit'
import Trash from '../../../../../../../img/icons/Trash'
import IconDown from '../../../icons/IconDown'
import {switchArrayIndex} from '../../../../utils/commonUtils'
import {isEqual} from 'lodash'
import LabelWithTooltip from '../../../common/LabelWithTooltip'
import {getCodeFromLabel} from './CategoriesSeveritiesTable'

export const SeverityColumn = ({label, index, shouldScrollIntoView}) => {
  const {portalTarget} = useContext(SettingsPanelContext)
  const {templates, currentTemplate, modifyingCurrentTemplate} = useContext(
    QualityFrameworkTabContext,
  )

  const [isEditingName, setIsEditingName] = useState(false)

  const ref = useRef()

  useEffect(() => {
    if (shouldScrollIntoView)
      ref.current.scrollIntoView?.({behavior: 'smooth', block: 'nearest'})
  }, [shouldScrollIntoView])

  const checkIsNotSaved = () => {
    if (!templates?.some(({isTemporary}) => isTemporary)) return false

    const originalCurrentTemplate = templates?.find(
      ({id, isTemporary}) => id === currentTemplate.id && !isTemporary,
    )

    const isMatched = originalCurrentTemplate.categories.some(({severities}) =>
      severities.some((severity) => severity.label === label),
    )

    if (!isMatched) return true

    const originalColumnSeverity = originalCurrentTemplate.categories.map(
      ({severities}) => severities[index],
    )
    const columnsSeverity = currentTemplate.categories.map(
      ({severities}) => severities[index],
    )

    const isModified = !isEqual(originalColumnSeverity, columnsSeverity)

    return isModified
  }

  const isNotSaved = checkIsNotSaved()

  const moveLeft = () => {
    const newIndex = index - 1
    if (newIndex >= 0) {
      modifyingCurrentTemplate((prevTemplate) => ({
        ...prevTemplate,
        categories: prevTemplate.categories.map((category) => ({
          ...category,
          severities: switchArrayIndex(category.severities, index, newIndex),
        })),
      }))
    }
  }

  const moveRight = () => {
    const newIndex = index + 1
    if (newIndex <= currentTemplate.categories[0].severities.length - 1) {
      modifyingCurrentTemplate((prevTemplate) => ({
        ...prevTemplate,
        categories: prevTemplate.categories.map((category) => ({
          ...category,
          severities: switchArrayIndex(category.severities, index, newIndex),
        })),
      }))
    }
  }

  const deleteSeverity = () => {
    modifyingCurrentTemplate((prevTemplate) => ({
      ...prevTemplate,
      categories: prevTemplate.categories.map((category) => ({
        ...category,
        severities: category.severities.filter(
          (severity, indexSeverity) => indexSeverity !== index,
        ),
      })),
    }))
  }

  const onChangeName = ({currentTarget: {value}}) => {
    modifyingCurrentTemplate((prevTemplate) => ({
      ...prevTemplate,
      categories: prevTemplate.categories.map((category) => ({
        ...category,
        severities: category.severities.map((severity, indexSeverity) => ({
          ...severity,
          ...(indexSeverity === index && {
            label: value,
          }),
        })),
      })),
    }))
  }

  const isMoveLeftDisabled = index === 0
  const isMoveRightDisabled =
    index === currentTemplate.categories[0].severities.length - 1

  const menu = (
    <MenuButton
      className="button-menu-button quality-framework-columns-menu-button"
      icon={<IconDown width={14} height={14} />}
      onClick={() => false}
      isVisibleRectArrow={false}
      itemsTarget={portalTarget}
    >
      <MenuButtonItem
        className="quality-framework-columns-menu-item"
        onMouseUp={() => setIsEditingName(true)}
      >
        <IconEdit />
        Rename
      </MenuButtonItem>
      <MenuButtonItem
        className="quality-framework-columns-menu-item"
        onMouseUp={moveLeft}
        disabled={isMoveLeftDisabled}
      >
        Move left
      </MenuButtonItem>
      <MenuButtonItem
        className="quality-framework-columns-menu-item"
        onMouseUp={moveRight}
        disabled={isMoveRightDisabled}
      >
        Move right
      </MenuButtonItem>
      <MenuButtonItem
        className="quality-framework-columns-menu-item"
        onMouseUp={deleteSeverity}
      >
        <Trash size={16} />
        Delete severity
      </MenuButtonItem>
    </MenuButton>
  )

  return (
    <div
      ref={ref}
      className={`column${isNotSaved ? ' quality-framework-not-saved' : ''}`}
    >
      <LabelWithTooltip className="label" tooltipTarget={portalTarget}>
        {isEditingName ? (
          <input
            autoFocus
            value={label}
            onChange={onChangeName}
            onBlur={() => setIsEditingName(false)}
          />
        ) : (
          <span>{label}</span>
        )}
      </LabelWithTooltip>
      {menu}
    </div>
  )
}

SeverityColumn.propTypes = {
  label: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  shouldScrollIntoView: PropTypes.bool,
}
