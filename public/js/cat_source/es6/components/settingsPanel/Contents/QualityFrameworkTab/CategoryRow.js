import React, {useContext} from 'react'
import PropTypes from 'prop-types'
import {QualityFrameworkTabContext} from './QualityFrameworkTab'
import {MenuButton} from '../../../common/MenuButton/MenuButton'
import IconDown from '../../../icons/IconDown'
import {MenuButtonItem} from '../../../common/MenuButton/MenuButtonItem'
import IconEdit from '../../../icons/IconEdit'
import Trash from '../../../../../../../img/icons/Trash'
import {SettingsPanelContext} from '../../SettingsPanelContext'
import {switchArrayIndex} from '../../../../utils/commonUtils'

export const CategoryRow = ({category, index}) => {
  const {portalTarget} = useContext(SettingsPanelContext)

  const {templates, currentTemplate, modifyingCurrentTemplate} = useContext(
    QualityFrameworkTabContext,
  )

  const {label} = category

  const [line1, line2] = label.split('(')

  const checkIsNotSaved = () => {
    if (!templates?.some(({isTemporary}) => isTemporary)) return false

    const originalCurrentTemplate = templates?.find(
      ({id, isTemporary}) => id === currentTemplate.id && !isTemporary,
    )

    return !originalCurrentTemplate.categories.some(
      ({id}) => id === category.id,
    )
  }

  const isNotSaved = checkIsNotSaved()

  const moveUp = () => {
    const newIndex = index - 1
    if (newIndex >= 0) {
      modifyingCurrentTemplate((prevTemplate) => ({
        ...prevTemplate,
        categories: switchArrayIndex(prevTemplate.categories, index, newIndex),
      }))
    }
  }

  const moveDown = () => {
    const newIndex = index + 1
    if (newIndex <= currentTemplate.categories.length - 1) {
      modifyingCurrentTemplate((prevTemplate) => ({
        ...prevTemplate,
        categories: switchArrayIndex(prevTemplate.categories, index, newIndex),
      }))
    }
  }

  const isMoveUpDisabled = index === 0
  const isMoveDownDisabled = index === currentTemplate.categories.length - 1

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
        onMouseUp={() => {}}
      >
        <IconEdit />
        Rename
      </MenuButtonItem>
      <MenuButtonItem
        className="quality-framework-columns-menu-item"
        onMouseUp={moveUp}
        disabled={isMoveUpDisabled}
      >
        Move up
      </MenuButtonItem>
      <MenuButtonItem
        className="quality-framework-columns-menu-item"
        onMouseUp={moveDown}
        disabled={isMoveDownDisabled}
      >
        Move down
      </MenuButtonItem>
      <MenuButtonItem className="quality-framework-columns-menu-item">
        <Trash size={16} />
        Delete category
      </MenuButtonItem>
    </MenuButton>
  )

  return (
    <div className={`row${isNotSaved ? ' row-not-saved' : ''}`}>
      <div className="label">
        <span>{line1}</span>
        <div className="details">{line2 && `(${line2}`}</div>
      </div>
      <div className="menu">{menu}</div>
    </div>
  )
}

CategoryRow.propTypes = {
  category: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
}
